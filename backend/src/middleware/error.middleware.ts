// ==========================================
// ZARMIND - Error Handling Middleware
// ==========================================

import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  IValidationError,
  IApiResponse,
} from '../types';
import logger, { logError } from '../utils/logger';
import { IS_PRODUCTION } from '../config/server';

// ==========================================
// ERROR MESSAGES (Persian & English)
// ==========================================

const ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: {
    fa: 'خطای داخلی سرور',
    en: 'Internal server error',
  },
  NOT_FOUND: {
    fa: 'صفحه یا منبع مورد نظر یافت نشد',
    en: 'The requested resource was not found',
  },
  UNAUTHORIZED: {
    fa: 'احراز هویت انجام نشده است',
    en: 'Unauthorized - Authentication required',
  },
  FORBIDDEN: {
    fa: 'دسترسی به این منبع ممنوع است',
    en: 'Forbidden - Access denied',
  },
  VALIDATION_ERROR: {
    fa: 'اطلاعات وارد شده نامعتبر است',
    en: 'Validation error',
  },
  TOKEN_EXPIRED: {
    fa: 'توکن منقضی شده است. لطفاً دوباره وارد شوید',
    en: 'Token expired - Please login again',
  },
  INVALID_TOKEN: {
    fa: 'توکن نامعتبر است',
    en: 'Invalid token',
  },
  DATABASE_ERROR: {
    fa: 'خطا در ارتباط با پایگاه داده',
    en: 'Database error',
  },
  FILE_TOO_LARGE: {
    fa: 'حجم فایل بیش از حد مجاز است',
    en: 'File too large',
  },
  INVALID_FILE_TYPE: {
    fa: 'نوع فایل مجاز نیست',
    en: 'Invalid file type',
  },
  DUPLICATE_KEY: {
    fa: 'این رکورد قبلاً ثبت شده است',
    en: 'Duplicate entry',
  },
  FOREIGN_KEY_VIOLATION: {
    fa: 'نمی‌توان این رکورد را حذف کرد. ارجاع‌های وابسته موجود است',
    en: 'Cannot delete - Foreign key constraint violation',
  },
  CONFLICT: {
    fa: 'تعارض در داده‌ها',
    en: 'Data conflict',
  },
} as const;

// ==========================================
// ASYNC ERROR WRAPPER
// ==========================================

/**
 * Wrapper for async route handlers to catch errors
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = <T = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
};

// ==========================================
// 404 NOT FOUND HANDLER
// ==========================================

/**
 * Handle 404 - Not Found errors
 * Should be placed after all routes
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(
    `Route not found: ${req.method} ${req.originalUrl}`
  );
  
  logError(error, 'NotFoundHandler', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });
  
  next(error);
};

// ==========================================
// HANDLE SPECIFIC ERROR TYPES
// ==========================================

/**
 * Handle JWT errors
 */
const handleJWTError = (error: JsonWebTokenError | TokenExpiredError): AppError => {
  if (error instanceof TokenExpiredError) {
    return new UnauthorizedError(ERROR_MESSAGES.TOKEN_EXPIRED.fa);
  }
  return new UnauthorizedError(ERROR_MESSAGES.INVALID_TOKEN.fa);
};

/**
 * Handle Multer (file upload) errors
 */
const handleMulterError = (error: MulterError): AppError => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError(ERROR_MESSAGES.FILE_TOO_LARGE.fa, StatusCodes.BAD_REQUEST);
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError(ERROR_MESSAGES.INVALID_FILE_TYPE.fa, StatusCodes.BAD_REQUEST);
  }
  return new AppError(error.message, StatusCodes.BAD_REQUEST);
};

/**
 * Handle PostgreSQL database errors
 */
const handleDatabaseError = (error: any): AppError => {
  // Unique violation (23505)
  if (error.code === '23505') {
    const field = error.detail?.match(/KATEX_INLINE_OPEN(.+)KATEX_INLINE_CLOSE=/)?.[1] || 'field';
    return new ConflictError(
      `${ERROR_MESSAGES.DUPLICATE_KEY.fa} (${field})`
    );
  }
  
  // Foreign key violation (23503)
  if (error.code === '23503') {
    return new AppError(
      ERROR_MESSAGES.FOREIGN_KEY_VIOLATION.fa,
      StatusCodes.CONFLICT
    );
  }
  
  // Not null violation (23502)
  if (error.code === '23502') {
    const column = error.column || 'unknown';
    return new AppError(
      `فیلد ${column} الزامی است`,
      StatusCodes.BAD_REQUEST
    );
  }
  
  // Check violation (23514)
  if (error.code === '23514') {
    return new AppError(
      'مقدار وارد شده نامعتبر است',
      StatusCodes.BAD_REQUEST
    );
  }
  
  // Connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return new AppError(
      ERROR_MESSAGES.DATABASE_ERROR.fa,
      StatusCodes.SERVICE_UNAVAILABLE
    );
  }
  
  // Generic database error
  return new AppError(
    ERROR_MESSAGES.DATABASE_ERROR.fa,
    StatusCodes.INTERNAL_SERVER_ERROR
  );
};

/**
 * Handle syntax errors (invalid JSON, etc.)
 */
const handleSyntaxError = (_error: SyntaxError): AppError => {
  return new AppError(
    'فرمت داده‌های ارسالی نامعتبر است',
    StatusCodes.BAD_REQUEST
  );
};

// ==========================================
// SEND ERROR RESPONSE
// ==========================================

/**
 * Send error response based on environment
 * FIXED: Added safety check for headers already sent
 */
const sendErrorResponse = (
  error: AppError,
  req: Request,
  res: Response
): void => {
  // ✅ CRITICAL: Prevent sending response if headers already sent
  if (res.headersSent) {
    logger.warn('[sendErrorResponse] Response already sent, cannot send error', {
      error: error.message,
      path: req.originalUrl,
    });
    return;
  }
  
  const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  
  // Base error response
  const errorResponse: IApiResponse = {
    success: false,
    error: error.message,
  };
  
  // Add validation errors if available
  if (error instanceof ValidationError && error.errors?.length > 0) {
    errorResponse.errors = error.errors;
  }
  
  // In development, include stack trace and additional info
  if (!IS_PRODUCTION) {
    (errorResponse as any).stack = error.stack;
    (errorResponse as any).statusCode = statusCode;
    (errorResponse as any).path = req.originalUrl;
    (errorResponse as any).method = req.method;
    (errorResponse as any).timestamp = new Date().toISOString();
  }
  
  res.status(statusCode).json(errorResponse);
};

// ==========================================
// MAIN ERROR HANDLER MIDDLEWARE
// ==========================================

/**
 * Central error handling middleware
 * Should be placed after all routes and other middleware
 * FIXED: Added safety check at the very start
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ✅ CRITICAL FIX: Prevent double response
  if (res.headersSent) {
    logger.error('[ErrorHandler] Headers already sent, skipping error response', {
      error: err.message,
      path: req.originalUrl,
      method: req.method,
    });
    return;
  }
  
  let error: AppError;
  
  // Handle different error types
  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    error = handleJWTError(err);
  } else if (err instanceof MulterError) {
    error = handleMulterError(err);
  } else if (err instanceof SyntaxError) {
    error = handleSyntaxError(err);
  } else if ('code' in err) {
    // Database errors
    error = handleDatabaseError(err);
  } else {
    // Generic error
    error = new AppError(
      IS_PRODUCTION
        ? ERROR_MESSAGES.INTERNAL_SERVER_ERROR.fa
        : err.message,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
  
  // Log error
  logError(err, 'ErrorHandler', {
    statusCode: error.statusCode,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.userId,
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
  });
  
  // Send error response
  sendErrorResponse(error, req, res);
};

// ==========================================
// OPERATIONAL ERROR CHECKER
// ==========================================

/**
 * Check if error is operational (known/expected) or programming error
 */
export const isOperationalError = (error: Error | AppError): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

// ==========================================
// HANDLE UNHANDLED REJECTIONS & EXCEPTIONS
// ==========================================

/**
 * Handle unhandled promise rejections
 * FIXED: Don't crash in development
 */
export const handleUnhandledRejection = (reason: Error, promise: Promise<any>): void => {
  logError(reason, 'UnhandledRejection', {
    promise: promise.toString(),
  });
  
  // In production, gracefully shutdown
  if (IS_PRODUCTION) {
    logger.error('Unhandled Rejection - Shutting down gracefully...');
    process.exit(1);
  } else {
    logger.warn('Unhandled Rejection in development - continuing...', {
      reason: reason.message,
      stack: reason.stack,
    });
  }
};

/**
 * Handle uncaught exceptions
 * FIXED: Don't crash in development
 */
export const handleUncaughtException = (error: Error): void => {
  logError(error, 'UncaughtException');
  
  // Always log, but only exit in production
  if (IS_PRODUCTION) {
    logger.error('Uncaught Exception - Shutting down immediately...');
    process.exit(1);
  } else {
    logger.error('Uncaught Exception in development - continuing...', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });
  }
};

// ==========================================
// VALIDATION ERROR BUILDER
// ==========================================

/**
 * Build validation error from express-validator errors
 */
export const buildValidationError = (
  errors: Array<{ param: string; msg: string; value?: any }>
): ValidationError => {
  const validationErrors: IValidationError[] = errors.map((err) => ({
    field: err.param,
    message: err.msg,
  }));
  
  return new ValidationError(
    ERROR_MESSAGES.VALIDATION_ERROR.fa,
    validationErrors
  );
};

/**
 * Build validation error from Joi validation result
 */
export const buildJoiValidationError = (joiError: any): ValidationError => {
  const validationErrors: IValidationError[] = joiError.details?.map((detail: any) => ({
    field: detail.path.join('.'),
    message: detail.message,
  })) || [];
  
  return new ValidationError(
    ERROR_MESSAGES.VALIDATION_ERROR.fa,
    validationErrors
  );
};

// ==========================================
// ERROR RESPONSE HELPERS
// ==========================================

/**
 * Send success response
 * FIXED: Added safety check
 */
export const sendSuccess = <T = any>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = StatusCodes.OK,
  meta?: any
): Response => {
  if (res.headersSent) {
    logger.warn('[sendSuccess] Headers already sent');
    return res;
  }
  
  const response: IApiResponse<T> = {
    success: true,
    data,
    message,
    meta,
  };
  
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * FIXED: Added safety check
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = StatusCodes.BAD_REQUEST,
  errors?: IValidationError[]
): Response => {
  if (res.headersSent) {
    logger.warn('[sendError] Headers already sent');
    return res;
  }
  
  const response: IApiResponse = {
    success: false,
    error: message,
    errors,
  };
  
  return res.status(statusCode).json(response);
};

/**
 * Send created response (201)
 */
export const sendCreated = <T = any>(
  res: Response,
  data: T,
  message?: string
): Response => {
  return sendSuccess(res, data, message, StatusCodes.CREATED);
};

/**
 * Send no content response (204)
 */
export const sendNoContent = (res: Response): Response => {
  if (res.headersSent) {
    logger.warn('[sendNoContent] Headers already sent');
    return res;
  }
  return res.status(StatusCodes.NO_CONTENT).send();
};

// ==========================================
// ATTACH HELPERS TO RESPONSE OBJECT
// ==========================================

/**
 * Middleware to attach helper methods to response object
 */
export const attachResponseHelpers = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Attach sendSuccess method
  res.sendSuccess = function <T = any>(
    data?: T,
    message?: string,
    meta?: any
  ): Response {
    return sendSuccess(res, data, message, StatusCodes.OK, meta);
  };
  
  // Attach sendError method
  res.sendError = function (
    message: string,
    statusCode: number = StatusCodes.BAD_REQUEST,
    errors?: IValidationError[]
  ): Response {
    return sendError(res, message, statusCode, errors);
  };
  
  next();
};

// ==========================================
// REQUEST ID MIDDLEWARE
// ==========================================

/**
 * Add unique request ID to each request
 * FIXED: Safe header setting with try-catch
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  
  // Set header safely
  try {
    if (!res.headersSent) {
      res.setHeader('X-Request-ID', requestId);
    }
  } catch (err) {
    // Silently ignore if headers already sent
    logger.debug('Could not set X-Request-ID header', { requestId });
  }
  
  next();
};

// ==========================================
// REQUEST TIMING MIDDLEWARE (COMPLETELY REWRITTEN)
// ==========================================

/**
 * Track request processing time
 * FIXED: Use 'finish' event instead of overriding res.end
 */
export const requestTimingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  req.startTime = startTime;
  
  // Listen for response finish event
  const onFinish = () => {
    const duration = Date.now() - startTime;
    
    // Log request completion
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.requestId,
      user: req.user?.userId,
    };
    
    // Log based on status code and duration
    if (res.statusCode >= 500) {
      logger.error('Request failed (5xx)', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request error (4xx)', logData);
    } else if (duration > 1000) {
      logger.warn('Slow request (>1s)', logData);
    } else {
      logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    }
  };
  
  // Attach finish listener
  res.on('finish', onFinish);
  
  // Clean up listener on close
  res.on('close', () => {
    res.off('finish', onFinish);
  });
  
  next();
};

// ==========================================
// EXPORTS
// ==========================================

export default {
  asyncHandler,
  errorHandler,
  notFoundHandler,
  attachResponseHelpers,
  requestIdMiddleware,
  requestTimingMiddleware,
  sendSuccess,
  sendError,
  sendCreated,
  sendNoContent,
  buildValidationError,
  buildJoiValidationError,
  isOperationalError,
  handleUnhandledRejection,
  handleUncaughtException,
};

// ==========================================
// SETUP GLOBAL ERROR HANDLERS
// ==========================================

if (process.env.NODE_ENV !== 'test') {
  // Handle unhandled promise rejections
  process.on('unhandledRejection', handleUnhandledRejection);
  
  // Handle uncaught exceptions
  process.on('uncaughtException', handleUncaughtException);
}