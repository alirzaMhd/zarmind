// ==========================================
// ZARMIND - Main Server Entry Point
// ==========================================

import 'express-async-errors';
import express, { Application, Request, Response } from 'express';
import * as cors from 'cors';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as morgan from 'morgan';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ==========================================
// IMPORTS
// ==========================================

// Configuration
import {
  SERVER_CONFIG,
  CORS_OPTIONS,
  HELMET_OPTIONS,
  BODY_PARSER_CONFIG,
  COOKIE_CONFIG,
  COMPRESSION_CONFIG,
  UPLOAD_CONFIG,
  MONITORING_CONFIG,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
} from './config/server';
import { initializeDatabase, closePool, healthCheck } from './config/database';

// Logger
import logger, { stream, logSystem, logError } from './utils/logger';

// Middleware
import {
  errorHandler,
  notFoundHandler,
  attachResponseHelpers,
  requestIdMiddleware,
  requestTimingMiddleware,
  handleUncaughtException,
  handleUnhandledRejection,
} from './middleware/error.middleware';

// Routes (will be imported later)
// import authRoutes from './routes/auth.routes';
// import inventoryRoutes from './routes/inventory.routes';
// import salesRoutes from './routes/sales.routes';
// import customerRoutes from './routes/customer.routes';
// import reportRoutes from './routes/report.routes';
// import aiRoutes from './routes/ai.routes';

// ==========================================
// CREATE EXPRESS APP
// ==========================================

const app: Application = express();

// ==========================================
// TRUST PROXY (for production behind reverse proxy)
// ==========================================

if (SERVER_CONFIG.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

// ==========================================
// ENSURE UPLOAD DIRECTORIES EXIST
// ==========================================

const ensureUploadDirectories = (): void => {
  const directories = [
    UPLOAD_CONFIG.UPLOAD_PATH,
    UPLOAD_CONFIG.TEMP_PATH,
    UPLOAD_CONFIG.PRODUCTS_PATH,
    UPLOAD_CONFIG.SCALE_PATH,
    UPLOAD_CONFIG.DOCUMENTS_PATH,
    UPLOAD_CONFIG.AVATARS_PATH,
  ];

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logSystem(`Created upload directory: ${dir}`);
    }
  });
};

ensureUploadDirectories();

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// Helmet - Security headers
app.use(helmet(HELMET_OPTIONS));

// CORS - Cross-Origin Resource Sharing
app.use(cors(CORS_OPTIONS));

// ==========================================
// REQUEST PARSING MIDDLEWARE
// ==========================================

// Body parser for JSON
app.use(express.json(BODY_PARSER_CONFIG.JSON));

// Body parser for URL-encoded data
app.use(express.urlencoded(BODY_PARSER_CONFIG.URLENCODED));

// Cookie parser
app.use(cookieParser(COOKIE_CONFIG.SECRET));

// ==========================================
// COMPRESSION
// ==========================================

app.use(compression(COMPRESSION_CONFIG));

// ==========================================
// LOGGING MIDDLEWARE
// ==========================================

// Morgan HTTP request logger
if (IS_DEVELOPMENT) {
  app.use(morgan('dev', { stream }));
} else {
  app.use(morgan('combined', { stream }));
}

// ==========================================
// CUSTOM MIDDLEWARE
// ==========================================

// Request ID
app.use(requestIdMiddleware);

// Request timing
app.use(requestTimingMiddleware);

// Attach response helpers
app.use(attachResponseHelpers);

// ==========================================
// STATIC FILES
// ==========================================

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==========================================
// HEALTH CHECK & MONITORING
// ==========================================

if (MONITORING_CONFIG.ENABLED) {
  // Health check endpoint
  app.get(MONITORING_CONFIG.HEALTH_CHECK_PATH, async (req: Request, res: Response) => {
    try {
      const dbHealth = await healthCheck();
      
      const healthStatus = {
        status: dbHealth.status === 'healthy' ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        database: {
          status: dbHealth.status,
          latency: dbHealth.latency,
          stats: dbHealth.stats,
        },
        memory: {
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
          unit: 'MB',
        },
        cpu: {
          user: process.cpuUsage().user,
          system: process.cpuUsage().system,
        },
      };

      const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(healthStatus);
    } catch (error) {
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      });
    }
  });

  // Simple status endpoint
  app.get(MONITORING_CONFIG.STATUS_PATH, (req: Request, res: Response) => {
    res.json({
      status: 'running',
      name: 'Zarmind API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });
}

// ==========================================
// API ROUTES
// ==========================================

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Welcome to Zarmind API - سیستم حسابداری هوشمند زرمند',
    version: '1.0.0',
    documentation: `${SERVER_CONFIG.BASE_URL}/api/docs`,
    endpoints: {
      health: MONITORING_CONFIG.HEALTH_CHECK_PATH,
      status: MONITORING_CONFIG.STATUS_PATH,
      api: SERVER_CONFIG.API_PREFIX,
    },
  });
});

// API version info
app.get(`${SERVER_CONFIG.API_PREFIX}`, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Zarmind API v1.0.0',
    version: '1.0.0',
    endpoints: {
      auth: `${SERVER_CONFIG.API_PREFIX}/auth`,
      inventory: `${SERVER_CONFIG.API_PREFIX}/inventory`,
      sales: `${SERVER_CONFIG.API_PREFIX}/sales`,
      customers: `${SERVER_CONFIG.API_PREFIX}/customers`,
      reports: `${SERVER_CONFIG.API_PREFIX}/reports`,
      ai: `${SERVER_CONFIG.API_PREFIX}/ai`,
    },
  });
});

// Register API routes
// app.use(`${SERVER_CONFIG.API_PREFIX}/auth`, authRoutes);
// app.use(`${SERVER_CONFIG.API_PREFIX}/inventory`, inventoryRoutes);
// app.use(`${SERVER_CONFIG.API_PREFIX}/sales`, salesRoutes);
// app.use(`${SERVER_CONFIG.API_PREFIX}/customers`, customerRoutes);
// app.use(`${SERVER_CONFIG.API_PREFIX}/reports`, reportRoutes);
// app.use(`${SERVER_CONFIG.API_PREFIX}/ai`, aiRoutes);

// ==========================================
// ERROR HANDLING MIDDLEWARE (MUST BE LAST)
// ==========================================

// 404 Not Found handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal: string): Promise<void> => {
  logSystem(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logSystem('HTTP server closed');

    try {
      // Close database connections
      await closePool();
      logSystem('Database connections closed');

      // Close logger
      // await closeLogger();

      logSystem('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logError(error as Error, 'Error during graceful shutdown');
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// ==========================================
// PROCESS EVENT HANDLERS
// ==========================================

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', handleUnhandledRejection);

// Handle uncaught exceptions
process.on('uncaughtException', handleUncaughtException);

// ==========================================
// START SERVER
// ==========================================

let server: any;

/**
 * Initialize and start the server
 */
const startServer = async (): Promise<void> => {
  try {
    // Initialize database
    logSystem('Initializing database connection...');
    await initializeDatabase();
    logSystem('Database initialized successfully');

    // Start HTTP server
    server = app.listen(SERVER_CONFIG.PORT, SERVER_CONFIG.HOST, () => {
      logSystem('='.repeat(60));
      logSystem('🚀 Zarmind Server Started Successfully!');
      logSystem('='.repeat(60));
      logSystem(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logSystem(`Server URL: ${SERVER_CONFIG.BASE_URL}`);
      logSystem(`API Prefix: ${SERVER_CONFIG.API_PREFIX}`);
      logSystem(`Health Check: ${SERVER_CONFIG.BASE_URL}${MONITORING_CONFIG.HEALTH_CHECK_PATH}`);
      logSystem(`Frontend URL: ${SERVER_CONFIG.FRONTEND_URL}`);
      logSystem('='.repeat(60));

      // Log feature flags
      const featuresEnabled = Object.entries(require('./config/server').FEATURES)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => feature);
      
      if (featuresEnabled.length > 0) {
        logSystem(`Enabled Features: ${featuresEnabled.join(', ')}`);
      }

      logSystem('Server is ready to accept connections');
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logError(
          error,
          `Port ${SERVER_CONFIG.PORT} is already in use. Please use a different port.`
        );
      } else {
        logError(error, 'Server error');
      }
      process.exit(1);
    });

  } catch (error) {
    logError(error as Error, 'Failed to start server');
    process.exit(1);
  }
};

// ==========================================
// BOOTSTRAP APPLICATION
// ==========================================

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
  startServer();
}

// ==========================================
// EXPORTS
// ==========================================

export default app;
export { server, startServer, gracefulShutdown };