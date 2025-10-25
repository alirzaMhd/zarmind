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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfigModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const Joi = __importStar(require("joi"));
const app_config_1 = __importDefault(require("./app.config"));
const database_config_1 = __importDefault(require("./database.config"));
const jwt_config_1 = __importDefault(require("./jwt.config"));
const redis_config_1 = __importDefault(require("./redis.config"));
const cookies_config_1 = __importDefault(require("./cookies.config"));
let AppConfigModule = class AppConfigModule {
};
exports.AppConfigModule = AppConfigModule;
exports.AppConfigModule = AppConfigModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [app_config_1.default, database_config_1.default, jwt_config_1.default, redis_config_1.default, cookies_config_1.default],
                validationSchema: Joi.object({
                    NODE_ENV: Joi.string()
                        .valid('development', 'test', 'production')
                        .default('development'),
                    PORT: Joi.number().port().default(3000),
                    // Database
                    DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).required(),
                    // JWT
                    JWT_SECRET: Joi.string().optional(),
                    JWT_ACCESS_SECRET: Joi.string().optional(),
                    JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
                    JWT_ACCESS_EXPIRES_REMEMBER: Joi.string().default('7d'),
                    JWT_ISSUER: Joi.string().optional(),
                    JWT_AUDIENCE: Joi.string().optional(),
                    // Auth cookies
                    AUTH_USE_COOKIES: Joi.boolean()
                        .truthy('true', '1', 'yes', 'on')
                        .falsy('false', '0', 'no', 'off')
                        .default(false),
                    JWT_COOKIE_NAME: Joi.string().default('access_token'),
                    JWT_COOKIE_SECURE: Joi.boolean()
                        .truthy('true', '1', 'yes', 'on')
                        .falsy('false', '0', 'no', 'off')
                        .optional(),
                    JWT_COOKIE_SAME_SITE: Joi.string().valid('lax', 'strict', 'none').default('lax'),
                    JWT_COOKIE_DOMAIN: Joi.string().optional(),
                    // Redis
                    REDIS_URL: Joi.string().uri({ scheme: ['redis', 'rediss'] }).optional(),
                    REDIS_HOST: Joi.string().default('127.0.0.1'),
                    REDIS_PORT: Joi.number().default(6379),
                    REDIS_PASSWORD: Joi.string().allow('').optional(),
                    REDIS_DB: Joi.number().default(0),
                    REDIS_TLS: Joi.boolean()
                        .truthy('true', '1', 'yes', 'on')
                        .falsy('false', '0', 'no', 'off')
                        .default(false),
                    REDIS_KEY_PREFIX: Joi.string().default('zarmind:cache:'),
                    // App
                    APP_NAME: Joi.string().default('Zarmind'),
                    CORS_ORIGIN: Joi.string().optional(),
                }),
                validationOptions: {
                    allowUnknown: true,
                    abortEarly: false,
                },
            }),
        ],
    })
], AppConfigModule);
//# sourceMappingURL=config.module.js.map