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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const config_1 = require("@nestjs/config");
let AuthController = class AuthController {
    constructor(authService, config) {
        this.authService = authService;
        this.config = config;
    }
    async login(dto, req, res) {
        const result = await this.authService.login(dto, req.headers['user-agent'] ?? undefined, (req.ip ||
            (Array.isArray(req.ips) && req.ips[0]) ||
            undefined));
        // Optionally set httpOnly cookie
        const useCookies = String(this.config.get('AUTH_USE_COOKIES') ?? '').toLowerCase() ===
            'true';
        if (useCookies) {
            const cookieName = this.config.get('JWT_COOKIE_NAME') || 'access_token';
            const secure = (this.config.get('JWT_COOKIE_SECURE') ?? '').toString().toLowerCase() ===
                'true' || process.env.NODE_ENV === 'production';
            const sameSite = this.config.get('JWT_COOKIE_SAME_SITE') ||
                'lax';
            const domain = this.config.get('JWT_COOKIE_DOMAIN');
            // Align cookie lifetime with token expiration if available
            let maxAge = 0;
            if (result.expiresAt) {
                const diff = result.expiresAt.getTime() - Date.now();
                maxAge = diff > 0 ? diff : 0;
            }
            else {
                // Fallbacks if exp is missing
                maxAge = dto.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
            }
            res.cookie(cookieName, result.accessToken, {
                httpOnly: true,
                secure,
                sameSite,
                domain,
                maxAge,
                path: '/',
            });
        }
        return {
            accessToken: result.accessToken,
            tokenType: 'Bearer',
            expiresAt: result.expiresAt,
            user: result.user,
        };
    }
    async me(req) {
        return this.authService.getProfile(req.user.userId);
    }
    async logout(res) {
        // Best-effort cookie clear; token revocation would require a blacklist
        const cookieName = this.config.get('JWT_COOKIE_NAME') || 'access_token';
        res.clearCookie(cookieName, { path: '/' });
        return { success: true };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map