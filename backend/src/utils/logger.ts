// ==========================================
// ZARMIND - Logger Utility
// ==========================================

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

// ==========================================
// LOG DIRECTORY SETUP
// ==========================================

const logDir = process.env.LOG_DIR || 'logs';

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ==========================================
// LOG LEVELS
// ==========================================

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'gray'
};

winston.addColors(colors);

// ==========================================
// LOG LEVEL CONFIGURATION
// ==========================================

const level = (): string => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : (process.env.LOG_LEVEL || 'info');
};

// ==========================================
// LOG FORMATS
// ==========================================

// Format for development (colorful, readable)
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaString}`;
  })
);

// Format for production (JSON, structured)
const prodFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Format for files (detailed)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.uncolorize(),
  winston.format.json()
);

// ==========================================
// TRANSPORTS
// ==========================================

const transports: winston.transport[] = [];

// Console Transport
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: devFormat
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: prodFormat
    })
  );
}

// Error Log File (Daily Rotation)
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true
  })
);

// Combined Log File (Daily Rotation)
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true
  })
);

// HTTP Log File (Daily Rotation)
transports.push(
  new DailyRotateFile({
    filename: path.join(logDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
  })
);

// Debug Log File (Development only)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'debug-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'debug',
      format: fileFormat,
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true
    })
  );
}

// ==========================================
// LOGGER INSTANCE
// ==========================================

const logger = winston.createLogger({
  level: level(),
  levels,
  format: prodFormat,
  transports,
  exitOnError: false
});

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Log HTTP request
 */
export const logRequest = (
  method: string,
  url: string,
  statusCode: number,
  responseTime: number,
  userId?: string
): void => {
  const message = `${method} ${url} ${statusCode} ${responseTime}ms`;
  logger.http(message, {
    method,
    url,
    statusCode,
    responseTime,
    userId,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log authentication events
 */
export const logAuth = (
  event: 'login' | 'logout' | 'register' | 'failed_login',
  username: string,
  ip?: string,
  userAgent?: string
): void => {
  logger.info(`Auth Event: ${event}`, {
    event,
    username,
    ip,
    userAgent,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log database queries (development only)
 */
export const logQuery = (query: string, params?: any[], duration?: number): void => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Database Query', {
      query,
      params,
      duration: duration ? `${duration}ms` : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Log errors with stack trace
 */
export const logError = (
  error: Error | string,
  context?: string,
  meta?: Record<string, any>
): void => {
  if (error instanceof Error) {
    logger.error(`${context ? `[${context}] ` : ''}${error.message}`, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      ...meta,
      timestamp: new Date().toISOString()
    });
  } else {
    logger.error(`${context ? `[${context}] ` : ''}${error}`, {
      context,
      ...meta,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Log AI/OCR operations
 */
export const logAI = (
  operation: string,
  success: boolean,
  confidence?: number,
  duration?: number,
  meta?: Record<string, any>
): void => {
  logger.info(`AI Operation: ${operation}`, {
    operation,
    success,
    confidence,
    duration: duration ? `${duration}ms` : undefined,
    ...meta,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log business operations (sales, inventory changes, etc.)
 */
export const logBusiness = (
  operation: string,
  entityType: string,
  entityId: string,
  userId: string,
  details?: Record<string, any>
): void => {
  logger.info(`Business Operation: ${operation}`, {
    operation,
    entityType,
    entityId,
    userId,
    ...details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log security events
 */
export const logSecurity = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, any>
): void => {
  const message = `Security Event: ${event}`;
  
  if (severity === 'critical' || severity === 'high') {
    logger.error(message, { event, severity, ...details });
  } else {
    logger.warn(message, { event, severity, ...details });
  }
};

/**
 * Log system events
 */
export const logSystem = (event: string, details?: Record<string, any>): void => {
  logger.info(`System Event: ${event}`, {
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log performance metrics
 */
export const logPerformance = (
  operation: string,
  duration: number,
  threshold?: number,
  meta?: Record<string, any>
): void => {
  const isSlowOperation = threshold && duration > threshold;
  
  const message = `Performance: ${operation} (${duration}ms)${
    isSlowOperation ? ' - SLOW OPERATION' : ''
  }`;

  if (isSlowOperation) {
    logger.warn(message, { operation, duration, threshold, ...meta });
  } else {
    logger.verbose(message, { operation, duration, ...meta });
  }
};

/**
 * Create a child logger with default metadata
 */
export const createChildLogger = (defaultMeta: Record<string, any>) => {
  return logger.child(defaultMeta);
};

/**
 * Log validation errors
 */
export const logValidation = (
  field: string,
  value: any,
  error: string,
  context?: string
): void => {
  logger.warn('Validation Error', {
    field,
    value,
    error,
    context,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log file operations
 */
export const logFile = (
  operation: 'upload' | 'delete' | 'read',
  filename: string,
  success: boolean,
  size?: number,
  error?: string
): void => {
  logger.info(`File Operation: ${operation}`, {
    operation,
    filename,
    success,
    size,
    error,
    timestamp: new Date().toISOString()
  });
};

// ==========================================
// STREAM FOR MORGAN (HTTP LOGGING)
// ==========================================

export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

export const closeLogger = async (): Promise<void> => {
  return new Promise((resolve) => {
    logger.on('finish', () => {
      resolve();
    });
    logger.end();
  });
};

// ==========================================
// EXPORTS
// ==========================================

export default logger;

// Named exports for convenience
export const {
  error,
  warn,
  info,
  http,
  verbose,
  debug,
  silly
} = logger;

// ==========================================
// STARTUP LOG
// ==========================================

if (process.env.NODE_ENV !== 'test') {
  logger.info('Logger initialized', {
    environment: process.env.NODE_ENV || 'development',
    logLevel: level(),
    logDirectory: path.resolve(logDir),
    timestamp: new Date().toISOString()
  });
}