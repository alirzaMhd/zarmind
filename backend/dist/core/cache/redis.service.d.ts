import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
type PubSubHandler = (message: string, channel: string) => void;
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    private client;
    private subscriber;
    private readonly keyPrefix;
    private readonly handlers;
    private enabled;
    constructor(config: ConfigService);
    private createClient;
    private bindEvents;
    private k;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    get(key: string): Promise<string | null>;
    getJson<T = unknown>(key: string): Promise<T | null>;
    set(key: string, value: string | number | Buffer, ttlSeconds?: number): Promise<'OK' | null>;
    setJson(key: string, value: unknown, ttlSeconds?: number): Promise<'OK' | null>;
    del(key: string): Promise<number>;
    incr(key: string): Promise<number>;
    expire(key: string, ttlSeconds: number): Promise<number>;
    wrap<T>(key: string, ttlSeconds: number, producer: () => Promise<T>): Promise<T>;
    publish(channel: string, message: string): Promise<number>;
    subscribe(channel: string, handler: PubSubHandler): Promise<void>;
    unsubscribe(channel: string, handler?: PubSubHandler): Promise<void>;
    acquireLock(lockName: string, ttlMs?: number, token?: string): Promise<string | null>;
    releaseLock(lockName: string, token: string): Promise<boolean>;
}
export {};
//# sourceMappingURL=redis.service.d.ts.map