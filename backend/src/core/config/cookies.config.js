"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
function toBool(v) {
    if (!v)
        return false;
    const s = v.toLowerCase();
    return s === 'true' || s === '1' || s === 'yes' || s === 'on';
}
exports.default = (0, config_1.registerAs)('cookies', () => {
    const secure = toBool(process.env.JWT_COOKIE_SECURE) || (process.env.NODE_ENV === 'production');
    return {
        useCookies: toBool(process.env.AUTH_USE_COOKIES),
        cookieName: process.env.JWT_COOKIE_NAME ?? 'access_token',
        secure,
        sameSite: process.env.JWT_COOKIE_SAME_SITE ?? 'lax',
        domain: process.env.JWT_COOKIE_DOMAIN,
    };
});
//# sourceMappingURL=cookies.config.js.map