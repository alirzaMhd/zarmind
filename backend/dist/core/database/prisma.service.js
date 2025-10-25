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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const { PrismaClient } = require('@prisma/client');
let PrismaService = PrismaService_1 = class PrismaService extends PrismaClient {
    constructor(config) {
        const nodeEnv = config.get('NODE_ENV') ?? process.env.NODE_ENV ?? 'development';
        const isProd = nodeEnv === 'production';
        const log = isProd
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
                    url: config.get('DATABASE_URL') ?? process.env.DATABASE_URL ?? '',
                },
            },
            log,
        });
        this.config = config;
        this.logger = new common_1.Logger(PrismaService_1.name);
        if (!isProd) {
            this.$on('query', (e) => {
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
    async transactional(fn) {
        return this.$transaction(async (tx) => fn(tx));
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map