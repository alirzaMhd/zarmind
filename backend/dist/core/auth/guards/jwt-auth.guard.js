"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
let JwtAuthGuard = class JwtAuthGuard extends (0, passport_1.AuthGuard)('jwt') {
    canActivate(context) {
        // Add any custom pre-checks here if needed (e.g., public routes)
        return super.canActivate(context);
    }
    handleRequest(err, user, info) {
        if (err) {
            throw err;
        }
        if (!user) {
            // info can be a Jwt error from passport-jwt
            if (info?.name === 'TokenExpiredError') {
                throw new common_1.UnauthorizedException('JWT token has expired');
            }
            if (info?.name === 'JsonWebTokenError') {
                throw new common_1.UnauthorizedException('Invalid JWT token');
            }
            throw new common_1.UnauthorizedException('Unauthorized');
        }
        // Optional: ensure user is active (depends on your JwtStrategy validate return)
        if (user?.status && user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('User account is not active');
        }
        return user;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)()
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map