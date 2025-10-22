import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';
import cookiesConfig from './cookies.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, cookiesConfig],
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
export class AppConfigModule {}