import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
declare const PrismaClient: any;
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    transactional<T>(fn: (tx: any) => Promise<T>): Promise<T>;
}
export {};
//# sourceMappingURL=prisma.service.d.ts.map