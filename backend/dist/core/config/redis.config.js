"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
function toBool(v) {
    if (!v)
        return false;
    const s = v.toLowerCase();
    return s === 'true' || s === '1' || s === 'yes' || s === 'on';
}
exports.default = (0, config_1.registerAs)('redis', () => ({
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB ?? '0', 10),
    tls: toBool(process.env.REDIS_TLS),
    keyPrefix: process.env.REDIS_KEY_PREFIX ?? 'zarmind:cache:',
}));
//# sourceMappingURL=redis.config.js.map