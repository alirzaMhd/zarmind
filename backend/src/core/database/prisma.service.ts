import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const { PrismaClient } = require('@prisma/client');

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly config: ConfigService) {
    const nodeEnv = config.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development';
    const isProd = nodeEnv === 'production';

    const log: any[] = isProd
      ? [
          { level: 'warn', emit: 'stdout' },
          { level: 'error', emit: 'stdout' },
        ]
      : [
          { level: 'query', emit: 'event' },
          { level: 'info', emit: 'stdout' },
          { level: 'warn', emit: 'stdout' },
          { level: 'error', emit: 'stdout' },
        ];

    super({
      datasources: {
        db: {
          url: config.get<string>('DATABASE_URL') ?? process.env.DATABASE_URL ?? '',
        },
      },
      log,
    });

    if (!isProd) {
      this.$on('query', (e: any) => {
        this.logger.debug(`Query: ${e.query} — Params: ${e.params} — Duration: ${e.duration}ms`);
      });
    }
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to the database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from the database');
  }

  // Helper to run a callback within a Prisma transaction
  async transactional<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx: any) => fn(tx));
  }
}