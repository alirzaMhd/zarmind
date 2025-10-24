import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, Logger } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // =================================
  // Configuration
  // =================================

  const port = configService.get<number>('app.port') || 3000;
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';
  const corsOrigin = configService.get<string>('app.corsOrigin');

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
  } else {
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
  app.use(cookieParser());

  // =================================
  // Global Pipes
  // =================================
  // Applies validation rules to all incoming request payloads
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
      transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
      transformOptions: {
        enableImplicitConversion: true, // Automatically convert primitive types (e.g., string from query param to number)
      },
    }),
  );

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