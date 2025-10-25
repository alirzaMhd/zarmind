"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const prisma_service_1 = require("../database/prisma.service");
// Simple parser: supports "15m", "7d", "10h", "30s", "1w" or raw seconds like "900"
function parseExpiresInToSeconds(value) {
    const fallback = 15 * 60; // 15 minutes
    if (!value)
        return fallback;
    const trimmed = value.trim().toLowerCase();
    // If it's a plain number, interpret as seconds
    if (/^\d+$/.test(trimmed))
        return Number(trimmed);
    const match = trimmed.match(/^(\d+)\s*(s|m|h|d|w)$/);
    if (!match)
        return fallback;
    const num = parseInt(match[1], 10);
    const unit = match[2];
    const unitMap = { s: 1, m: 60, h: 3600, d: 86400, w: 604800 };
    return num * unitMap[unit];
}
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            passport_1.PassportModule.register({ defaultStrategy: 'jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const rawExp = config.get('JWT_ACCESS_EXPIRES_IN') ?? '15m';
                    const expiresIn = parseExpiresInToSeconds(rawExp); // number (seconds), avoids typing issues
                    return {
                        secret: config.get('JWT_ACCESS_SECRET') ??
                            config.get('JWT_SECRET') ??
                            'change_me',
                        signOptions: {
                            expiresIn, // number of seconds
                            issuer: config.get('JWT_ISSUER'),
                            audience: config.get('JWT_AUDIENCE'),
                            algorithm: 'HS256',
                        },
                    };
                },
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, jwt_strategy_1.JwtStrategy, jwt_auth_guard_1.JwtAuthGuard, prisma_service_1.PrismaService],
        exports: [auth_service_1.AuthService, jwt_auth_guard_1.JwtAuthGuard, jwt_1.JwtModule],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map