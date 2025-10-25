import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Avoid esModuleInterop issues by requiring at runtime
// Types are imported separately for safety.
import type { Redis as IORedisClient, RedisOptions } from 'ioredis';
const IORedis = require('ioredis');

type PubSubHandler = (message: string, channel: string) => void;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  private client!: IORedisClient;
  private subscriber!: IORedisClient;

  private readonly keyPrefix: string;
  private readonly handlers = new Map<string, Set<PubSubHandler>>();

  // When false, all Redis operations become no-ops (graceful fallback)
  private enabled = true;

  constructor(private readonly config: ConfigService) {
    this.keyPrefix = this.config.get<string>('REDIS_KEY_PREFIX') ?? 'zarmind:cache:';

    // Construct clients (lazy connect)
    this.client = this.createClient('client');
    this.subscriber = this.createClient('subscriber');

    this.bindEvents(this.client, 'client');
    this.bindEvents(this.subscriber, 'subscriber');

    // Route pub/sub messages to channel-specific handlers
    this.subscriber.on('message', (channel: string, message: string) => {
      const set = this.handlers.get(channel);
      if (!set?.size) return;

      // Use forEach to avoid for..of on Set (works with lower TS targets without downlevelIteration)
      set.forEach((fn) => {
        try {
          fn(message, channel);
        } catch (err: any) {
          this.logger.error(`Handler error for channel ${channel}: ${err?.message}`, err?.stack);
        }
      });
    });
  }

  private createClient(label: 'client' | 'subscriber'): IORedisClient {
    const url = this.config.get<string>('REDIS_URL') ?? process.env.REDIS_URL;
    const host = this.config.get<string>('REDIS_HOST') ?? '127.0.0.1';
    const port = parseInt(this.config.get<string>('REDIS_PORT') ?? '6379', 10);
    const password = this.config.get<string>('REDIS_PASSWORD') || undefined;
    const db = parseInt(this.config.get<string>('REDIS_DB') ?? '0', 10);
    const useTls =
      (this.config.get<string>('REDIS_TLS') ?? '')
        .toString()
        .toLowerCase() === 'true';

    const base: RedisOptions = {
      lazyConnect: true,
      maxRetriesPerRequest: 5,
      enableAutoPipelining: true,
      retryStrategy: (attempts) => Math.min(attempts * 50, 2000),
      tls: useTls ? {} : undefined,
      keyPrefix: undefined,
    };

    if (url) {
      return new IORedis(url, base);
    }

    return new IORedis({
      ...base,
      host,
      port,
      password,
      db,
    });
  }

  private bindEvents(client: IORedisClient, label: string) {
    client.on('connect', () => this.logger.log(`Redis ${label} connecting...`));
    client.on('ready', () => this.logger.log(`Redis ${label} ready`));
    client.on('end', () => this.logger.warn(`Redis ${label} connection closed`));
    client.on('reconnecting', (delay: number) =>
      this.logger.warn(`Redis ${label} reconnecting in ${delay}ms`),
    );
    client.on('error', (err: any) =>
      this.logger.error(`Redis ${label} error: ${err?.message}`),
    );
  }

  private k(key: string): string {
    return `${this.keyPrefix}${key}`;
  }

  async onModuleInit() {
    // Try to connect, but gracefully degrade if Redis is unavailable
    try {
      await this.client.connect();
      await this.subscriber.connect();
    } catch (err: any) {
      this.enabled = false;
      this.logger.warn(
        `Redis unavailable (${err?.message}). Falling back to in-memory no-op cache.`
      );
      try {
        this.client.disconnect();
      } catch {}
      try {
        this.subscriber.disconnect();
      } catch {}
    }
  }

  async onModuleDestroy() {
    if (!this.enabled) return;

    try {
      // Avoid spreading MapIterator to support lower TS targets
      const channels: string[] = [];
      this.handlers.forEach((_set, ch) => channels.push(ch));
      if (channels.length) {
        await this.subscriber.unsubscribe(...channels);
      }
    } catch {
      // ignore
    }
    try {
      await this.subscriber.quit();
    } catch {}
    try {
      await this.client.quit();
    } catch {}
  }

  // Basic KV operations

  async get(key: string): Promise<string | null> {
    if (!this.enabled) return null;
    return this.client.get(this.k(key));
  }

  async getJson<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: string | number | Buffer, ttlSeconds?: number): Promise<'OK' | null> {
    if (!this.enabled) return null;
    if (ttlSeconds && ttlSeconds > 0) {
      return (this.client as any).set(this.k(key), value, 'EX', ttlSeconds);
    }
    return this.client.set(this.k(key), value as any);
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<'OK' | null> {
    if (!this.enabled) return null;
    const payload = JSON.stringify(value);
    return this.set(key, payload, ttlSeconds);
  }

  async del(key: string): Promise<number> {
    if (!this.enabled) return 0;
    return this.client.del(this.k(key));
  }

  async incr(key: string): Promise<number> {
    if (!this.enabled) return 0;
    return this.client.incr(this.k(key));
  }

  async expire(key: string, ttlSeconds: number): Promise<number> {
    if (!this.enabled) return 0;
    return this.client.expire(this.k(key), ttlSeconds);
  }

  // Cache wrap helper
  async wrap<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      // If Redis is disabled/unavailable, just compute and return
      return producer();
    }
    const cached = await this.getJson<T>(key);
    if (cached !== null) return cached;

    const value = await producer();
    await this.setJson(key, value, ttlSeconds);
    return value;
  }

  // Pub/Sub

  async publish(channel: string, message: string): Promise<number> {
    if (!this.enabled) return 0;
    return this.client.publish(channel, message);
  }

  async subscribe(channel: string, handler: PubSubHandler): Promise<void> {
    if (!this.enabled) return;

    let set = this.handlers.get(channel);
    if (!set) {
      set = new Set<PubSubHandler>();
      this.handlers.set(channel, set);
      await this.subscriber.subscribe(channel);
    }
    set.add(handler);
  }

  async unsubscribe(channel: string, handler?: PubSubHandler): Promise<void> {
    if (!this.enabled) return;

    const set = this.handlers.get(channel);
    if (!set) return;

    if (handler) {
      set.delete(handler);
    }
    if (!handler || set.size === 0) {
      await this.subscriber.unsubscribe(channel);
      this.handlers.delete(channel);
    }
  }

  // Simple distributed lock
  async acquireLock(lockName: string, ttlMs = 10000, token?: string): Promise<string | null> {
    if (!this.enabled) return null;
    const key = this.k(`lock:${lockName}`);
    const value = token ?? Math.random().toString(36).slice(2);
    const res = await (this.client as any).set(key, value, 'PX', ttlMs, 'NX');
    return res === 'OK' ? value : null;
  }

  async releaseLock(lockName: string, token: string): Promise<boolean> {
    if (!this.enabled) return true;
    const key = this.k(`lock:${lockName}`);
    const lua =
      'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';
    const result = (await this.client.eval(lua, 1, key, token)) as number;
    return result === 1;
  }
}