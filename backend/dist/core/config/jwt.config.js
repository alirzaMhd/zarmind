"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('jwt', () => ({
    // Prefer JWT_ACCESS_SECRET; fallback to JWT_SECRET
    accessSecret: process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? 'change_me',
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    accessRememberExpiresIn: process.env.JWT_ACCESS_EXPIRES_REMEMBER ?? '7d',
}));
//# sourceMappingURL=jwt.config.js.map