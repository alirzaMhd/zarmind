"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../database/prisma.service");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcryptjs"));
let AuthService = class AuthService {
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    parseBool(value, fallback = false) {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'string') {
            return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
        }
        if (typeof value === 'number')
            return value === 1;
        return fallback;
    }
    // Supports: "15m", "7d", "10h", "30s", "1w" or raw seconds like "900"
    parseExpiresInToSeconds(value) {
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
    async login(dto, userAgent, ipAddress) {
        const user = await this.findUserByIdentifier(dto.email, dto.username);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const passOk = await bcrypt.compare(dto.password, user.password);
        if (!passOk) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status && user.status !== 'ACTIVE') {
            throw new common_1.ForbiddenException('User account is not active');
        }
        // Update last login timestamp
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const remember = dto.rememberMe ??
            this.parseBool(this.config.get('AUTH_REMEMBER_DEFAULT') ?? false, false);
        const rawExp = remember
            ? this.config.get('JWT_ACCESS_EXPIRES_REMEMBER') ?? '7d'
            : this.config.get('JWT_ACCESS_EXPIRES_IN') ?? '15m';
        // Convert to number (seconds) to satisfy JwtSignOptions typing
        const expiresIn = this.parseExpiresInToSeconds(rawExp);
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            branchId: user.branchId ?? null,
        };
        const accessToken = await this.jwt.signAsync(payload, {
            expiresIn, // number of seconds
            issuer: this.config.get('JWT_ISSUER'),
            audience: this.config.get('JWT_AUDIENCE'),
        });
        // Derive expiresAt from token's exp claim
        const decoded = this.jwt.decode(accessToken);
        const expiresAt = decoded?.exp && typeof decoded.exp === 'number'
            ? new Date(decoded.exp * 1000)
            : undefined;
        const safeUser = {
            id: user.id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone,
            role: user.role,
            status: user.status,
            branchId: user.branchId ?? null,
            lastLoginAt: new Date(),
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        // Optional: create an audit log
        // await this.prisma.auditLog.create({
        //   data: {
        //     userId: user.id,
        //     action: 'LOGIN',
        //     entityType: 'User',
        //     entityId: user.id,
        //     newValue: { userAgent, ipAddress },
        //   },
        // });
        return { accessToken, expiresAt, user: safeUser };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                status: true,
                branchId: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        return user;
    }
    async findUserByIdentifier(email, username) {
        if (!email && !username)
            return null;
        const user = await this.prisma.user.findUnique({
            where: email ? { email } : { username: username },
            select: {
                id: true,
                email: true,
                username: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                status: true,
                branchId: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                password: true,
            },
        });
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map