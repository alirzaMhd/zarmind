"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const IORedis = require('ioredis');
let RedisService = RedisService_1 = class RedisService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(RedisService_1.name);
        this.handlers = new Map();
        this.keyPrefix = this.config.get('REDIS_KEY_PREFIX') ?? 'zarmind:cache:';
        // Construct clients (lazy connect)
        this.client = this.createClient('client');
        this.subscriber = this.createClient('subscriber');
        this.bindEvents(this.client, 'client');
        this.bindEvents(this.subscriber, 'subscriber');
        // Route pub/sub messages to channel-specific handlers
        this.subscriber.on('message', (channel, message) => {
            const set = this.handlers.get(channel);
            if (!set?.size)
                return;
            // Use forEach to avoid for..of on Set (works with lower TS targets without downlevelIteration)
            set.forEach((fn) => {
                try {
                    fn(message, channel);
                }
                catch (err) {
                    this.logger.error(`Handler error for channel ${channel}: ${err?.message}`, err?.stack);
                }
            });
        });
    }
    createClient(label) {
        const url = this.config.get('REDIS_URL') ?? process.env.REDIS_URL;
        const host = this.config.get('REDIS_HOST') ?? '127.0.0.1';
        const port = parseInt(this.config.get('REDIS_PORT') ?? '6379', 10);
        const password = this.config.get('REDIS_PASSWORD') || undefined;
        const db = parseInt(this.config.get('REDIS_DB') ?? '0', 10);
        const useTls = (this.config.get('REDIS_TLS') ?? '')
            .toString()
            .toLowerCase() === 'true';
        const base = {
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
    bindEvents(client, label) {
        client.on('connect', () => this.logger.log(`Redis ${label} connecting...`));
        client.on('ready', () => this.logger.log(`Redis ${label} ready`));
        client.on('end', () => this.logger.warn(`Redis ${label} connection closed`));
        client.on('reconnecting', (delay) => this.logger.warn(`Redis ${label} reconnecting in ${delay}ms`));
        client.on('error', (err) => this.logger.error(`Redis ${label} error: ${err?.message}`, err?.stack));
    }
    k(key) {
        return `${this.keyPrefix}${key}`;
    }
    async onModuleInit() {
        await this.client.connect();
        await this.subscriber.connect();
    }
    async onModuleDestroy() {
        try {
            // Avoid spreading MapIterator to support lower TS targets
            const channels = [];
            this.handlers.forEach((_set, ch) => channels.push(ch));
            if (channels.length) {
                await this.subscriber.unsubscribe(...channels);
            }
        }
        catch {
            // ignore
        }
        await this.subscriber.quit();
        await this.client.quit();
    }
    // Basic KV operations
    async get(key) {
        return this.client.get(this.k(key));
    }
    async getJson(key) {
        const raw = await this.get(key);
        if (raw == null)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        if (ttlSeconds && ttlSeconds > 0) {
            return this.client.set(this.k(key), value, 'EX', ttlSeconds);
        }
        return this.client.set(this.k(key), value);
    }
    async setJson(key, value, ttlSeconds) {
        const payload = JSON.stringify(value);
        return this.set(key, payload, ttlSeconds);
    }
    async del(key) {
        return this.client.del(this.k(key));
    }
    async incr(key) {
        return this.client.incr(this.k(key));
    }
    async expire(key, ttlSeconds) {
        return this.client.expire(this.k(key), ttlSeconds);
    }
    // Cache wrap helper
    async wrap(key, ttlSeconds, producer) {
        const cached = await this.getJson(key);
        if (cached !== null)
            return cached;
        const value = await producer();
        await this.setJson(key, value, ttlSeconds);
        return value;
    }
    // Pub/Sub
    async publish(channel, message) {
        return this.client.publish(channel, message);
    }
    async subscribe(channel, handler) {
        let set = this.handlers.get(channel);
        if (!set) {
            set = new Set();
            this.handlers.set(channel, set);
            await this.subscriber.subscribe(channel);
        }
        set.add(handler);
    }
    async unsubscribe(channel, handler) {
        const set = this.handlers.get(channel);
        if (!set)
            return;
        if (handler) {
            set.delete(handler);
        }
        if (!handler || set.size === 0) {
            await this.subscriber.unsubscribe(channel);
            this.handlers.delete(channel);
        }
    }
    // Simple distributed lock
    async acquireLock(lockName, ttlMs = 10000, token) {
        const key = this.k(`lock:${lockName}`);
        const value = token ?? Math.random().toString(36).slice(2);
        const res = await this.client.set(key, value, 'PX', ttlMs, 'NX');
        return res === 'OK' ? value : null;
    }
    async releaseLock(lockName, token) {
        const key = this.k(`lock:${lockName}`);
        const lua = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';
        const result = (await this.client.eval(lua, 1, key, token));
        return result === 1;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map