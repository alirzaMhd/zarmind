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
    const field = error.detail?.match(/Key KATEX_INLINE_OPEN(.+)KATEX_INLINE_CLOSE=/)?.[1] || 'field';
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
 */
const sendErrorResponse = (
  error: AppError,
  req: Request,
  res: Response
): void => {
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
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
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
 */
export const handleUnhandledRejection = (reason: Error, promise: Promise<any>): void => {
  logError(reason, 'UnhandledRejection', {
    promise: promise.toString(),
  });
  
  // In production, gracefully shutdown
  if (IS_PRODUCTION) {
    logger.error('Unhandled Rejection - Shutting down gracefully...');
    process.exit(1);
  }
};

/**
 * Handle uncaught exceptions
 */
export const handleUncaughtException = (error: Error): void => {
  logError(error, 'UncaughtException');
  
  // Always exit on uncaught exceptions
  logger.error('Uncaught Exception - Shutting down immediately...');
  process.exit(1);
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
 */
export const sendSuccess = <T = any>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = StatusCodes.OK,
  meta?: any
): Response => {
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
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = StatusCodes.BAD_REQUEST,
  errors?: IValidationError[]
): Response => {
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
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  
  // Set header only if not already sent
  if (!res.headersSent) {
    res.setHeader('X-Request-ID', requestId);
  }
  
  next();
};

// ==========================================
// REQUEST TIMING MIDDLEWARE (FIXED)
// ==========================================

/**
 * Track request processing time
 * FIXED: Set headers BEFORE response is sent by intercepting res.end
 */
export const requestTimingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  req.startTime = startTime;
  
  // Intercept res.end to set header BEFORE response is sent
  const originalEnd = res.end;
  let endCalled = false;
  
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    if (!endCalled) {
      endCalled = true;
      const duration = Date.now() - startTime;
      
      // Set header only if not already sent
      if (!res.headersSent) {
        try {
          res.setHeader('X-Response-Time', `${duration}ms`);
        } catch (err) {
          // Silently ignore header errors
        }
      }
      
      // Log slow requests (> 1 second)
      if (duration > 1000) {
        logger.warn(`Slow request: ${req.method} ${req.originalUrl}`, {
          duration,
          statusCode: res.statusCode,
          requestId: req.requestId,
        });
      }
    }
    
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
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