"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const logger = new common_1.Logger('Bootstrap');
    // =================================
    // Configuration
    // =================================
    const port = configService.get('app.port') || 3000;
    const nodeEnv = configService.get('app.nodeEnv') || 'development';
    const corsOrigin = configService.get('app.corsOrigin');
    // =================================
    // Global Prefix
    // =================================
    // All routes will be prefixed with /api (e.g., /api/users)
    app.setGlobalPrefix('api');
    // =================================
    // CORS (Cross-Origin Resource Sharing)
    // =================================
    if (corsOrigin) {
        app.enableCors({
            origin: corsOrigin.split(',').map((o) => o.trim()), // Allow multiple origins
            credentials: true, // Necessary for cookies
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        });
        logger.log(`CORS enabled for origin(s): ${corsOrigin}`);
    }
    else {
        // Enable CORS for any origin if not specified (useful for development)
        app.enableCors({
            credentials: true,
        });
        logger.warn('CORS enabled for all origins (CORS_ORIGIN not set)');
    }
    // =================================
    // Middlewares
    // =================================
    // Enables parsing of cookies from incoming requests
    app.use((0, cookie_parser_1.default)());
    // =================================
    // Global Pipes
    // =================================
    // Applies validation rules to all incoming request payloads
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true, // Strip properties that do not have any decorators
        forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
        transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
        transformOptions: {
            enableImplicitConversion: true, // Automatically convert primitive types (e.g., string from query param to number)
        },
    }));
    // =================================
    // Graceful Shutdown
    // =================================
    // Ensures the app cleans up connections (e.g., Prisma, Redis) on termination
    app.enableShutdownHooks();
    // =================================
    // Start Application
    // =================================
    await app.listen(port);
    logger.log(`🚀 Application is running in "${nodeEnv}" mode`);
    logger.log(`🎧 Listening on: ${await app.getUrl()}`);
}
bootstrap();
//# sourceMappingURL=main.js.map