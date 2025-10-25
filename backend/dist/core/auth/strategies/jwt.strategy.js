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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const config_1 = require("@nestjs/config");
const cookieExtractor = (req) => req?.cookies?.access_token || null;
const headerTokenExtractor = (req) => {
    const header = req?.headers?.['x-access-token'];
    if (!header)
        return null;
    return Array.isArray(header) ? header[0] : header;
};
const queryExtractor = (req) => {
    const q = req?.query;
    if (q?.token && typeof q.token === 'string')
        return q.token;
    return null;
};
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy, 'jwt') {
    constructor(configService) {
        const secret = configService.get('JWT_ACCESS_SECRET') ??
            configService.get('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT secret is not configured. Please set JWT_ACCESS_SECRET or JWT_SECRET in your environment variables.');
        }
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
                cookieExtractor,
                headerTokenExtractor,
                queryExtractor,
            ]),
            secretOrKey: secret, // Now TypeScript knows this is definitely a string
            issuer: configService.get('JWT_ISSUER'),
            audience: configService.get('JWT_AUDIENCE'),
            ignoreExpiration: false,
            algorithms: ['HS256'],
        });
        this.config = configService;
    }
    async validate(payload) {
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role,
            status: payload.status,
            branchId: payload.branchId ?? null,
        };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map