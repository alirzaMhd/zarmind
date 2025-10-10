"use strict";
// ==========================================
// ZARMIND - Error Handling Middleware
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestTimingMiddleware = exports.requestIdMiddleware = exports.attachResponseHelpers = exports.sendNoContent = exports.sendCreated = exports.sendError = exports.sendSuccess = exports.buildJoiValidationError = exports.buildValidationError = exports.handleUncaughtException = exports.handleUnhandledRejection = exports.isOperationalError = exports.errorHandler = exports.notFoundHandler = exports.asyncHandler = void 0;
var multer_1 = require("multer");
var jsonwebtoken_1 = require("jsonwebtoken");
var http_status_codes_1 = require("http-status-codes");
var types_1 = require("../types");
var logger_1 = require("../utils/logger");
var server_1 = require("../config/server");
// ==========================================
// ERROR MESSAGES (Persian & English)
// ==========================================
var ERROR_MESSAGES = {
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
};
// ==========================================
// ASYNC ERROR WRAPPER
// ==========================================
/**
 * Wrapper for async route handlers to catch errors
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
var asyncHandler = function (fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
// ==========================================
// 404 NOT FOUND HANDLER
// ==========================================
/**
 * Handle 404 - Not Found errors
 * Should be placed after all routes
 */
var notFoundHandler = function (req, res, next) {
    var error = new types_1.NotFoundError("Route not found: ".concat(req.method, " ").concat(req.originalUrl));
    (0, logger_1.logError)(error, 'NotFoundHandler', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    });
    next(error);
};
exports.notFoundHandler = notFoundHandler;
// ==========================================
// HANDLE SPECIFIC ERROR TYPES
// ==========================================
/**
 * Handle JWT errors
 */
var handleJWTError = function (error) {
    if (error instanceof jsonwebtoken_1.TokenExpiredError) {
        return new types_1.UnauthorizedError(ERROR_MESSAGES.TOKEN_EXPIRED.fa);
    }
    return new types_1.UnauthorizedError(ERROR_MESSAGES.INVALID_TOKEN.fa);
};
/**
 * Handle Multer (file upload) errors
 */
var handleMulterError = function (error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
        return new types_1.AppError(ERROR_MESSAGES.FILE_TOO_LARGE.fa, http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return new types_1.AppError(ERROR_MESSAGES.INVALID_FILE_TYPE.fa, http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    return new types_1.AppError(error.message, http_status_codes_1.StatusCodes.BAD_REQUEST);
};
/**
 * Handle PostgreSQL database errors
 */
var handleDatabaseError = function (error) {
    var _a, _b;
    // Unique violation (23505)
    if (error.code === '23505') {
        var field = ((_b = (_a = error.detail) === null || _a === void 0 ? void 0 : _a.match(/Key KATEX_INLINE_OPEN(.+)KATEX_INLINE_CLOSE=/)) === null || _b === void 0 ? void 0 : _b[1]) || 'field';
        return new types_1.ConflictError("".concat(ERROR_MESSAGES.DUPLICATE_KEY.fa, " (").concat(field, ")"));
    }
    // Foreign key violation (23503)
    if (error.code === '23503') {
        return new types_1.AppError(ERROR_MESSAGES.FOREIGN_KEY_VIOLATION.fa, http_status_codes_1.StatusCodes.CONFLICT);
    }
    // Not null violation (23502)
    if (error.code === '23502') {
        var column = error.column || 'unknown';
        return new types_1.AppError("\u0641\u06CC\u0644\u062F ".concat(column, " \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A"), http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Check violation (23514)
    if (error.code === '23514') {
        return new types_1.AppError('مقدار وارد شده نامعتبر است', http_status_codes_1.StatusCodes.BAD_REQUEST);
    }
    // Connection errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        return new types_1.AppError(ERROR_MESSAGES.DATABASE_ERROR.fa, http_status_codes_1.StatusCodes.SERVICE_UNAVAILABLE);
    }
    // Generic database error
    return new types_1.AppError(ERROR_MESSAGES.DATABASE_ERROR.fa, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
};
/**
 * Handle validation errors from express-validator or Joi
 */
var handleValidationError = function (error) {
    return new types_1.AppError(error.message || ERROR_MESSAGES.VALIDATION_ERROR.fa, http_status_codes_1.StatusCodes.BAD_REQUEST);
};
/**
 * Handle syntax errors (invalid JSON, etc.)
 */
var handleSyntaxError = function (error) {
    return new types_1.AppError('فرمت داده‌های ارسالی نامعتبر است', http_status_codes_1.StatusCodes.BAD_REQUEST);
};
// ==========================================
// SEND ERROR RESPONSE
// ==========================================
/**
 * Send error response based on environment
 */
var sendErrorResponse = function (error, req, res) {
    var _a;
    var statusCode = error.statusCode || http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR;
    // Base error response
    var errorResponse = {
        success: false,
        error: error.message,
    };
    // Add validation errors if available
    if (error instanceof types_1.ValidationError && ((_a = error.errors) === null || _a === void 0 ? void 0 : _a.length) > 0) {
        errorResponse.errors = error.errors;
    }
    // In development, include stack trace and additional info
    if (!server_1.IS_PRODUCTION) {
        errorResponse.stack = error.stack;
        errorResponse.statusCode = statusCode;
        errorResponse.path = req.originalUrl;
        errorResponse.method = req.method;
        errorResponse.timestamp = new Date().toISOString();
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
var errorHandler = function (err, req, res, next) {
    var _a;
    var error;
    // Handle different error types
    if (err instanceof types_1.AppError) {
        error = err;
    }
    else if (err instanceof jsonwebtoken_1.JsonWebTokenError || err instanceof jsonwebtoken_1.TokenExpiredError) {
        error = handleJWTError(err);
    }
    else if (err instanceof multer_1.MulterError) {
        error = handleMulterError(err);
    }
    else if (err instanceof SyntaxError) {
        error = handleSyntaxError(err);
    }
    else if ('code' in err) {
        // Database errors
        error = handleDatabaseError(err);
    }
    else {
        // Generic error
        error = new types_1.AppError(server_1.IS_PRODUCTION
            ? ERROR_MESSAGES.INTERNAL_SERVER_ERROR.fa
            : err.message, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR);
    }
    // Log error
    (0, logger_1.logError)(err, 'ErrorHandler', {
        statusCode: error.statusCode,
        path: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
        body: req.method !== 'GET' ? req.body : undefined,
        query: req.query,
    });
    // Send error response
    sendErrorResponse(error, req, res);
};
exports.errorHandler = errorHandler;
// ==========================================
// OPERATIONAL ERROR CHECKER
// ==========================================
/**
 * Check if error is operational (known/expected) or programming error
 */
var isOperationalError = function (error) {
    if (error instanceof types_1.AppError) {
        return error.isOperational;
    }
    return false;
};
exports.isOperationalError = isOperationalError;
// ==========================================
// HANDLE UNHANDLED REJECTIONS & EXCEPTIONS
// ==========================================
/**
 * Handle unhandled promise rejections
 */
var handleUnhandledRejection = function (reason, promise) {
    (0, logger_1.logError)(reason, 'UnhandledRejection', {
        promise: promise.toString(),
    });
    // In production, gracefully shutdown
    if (server_1.IS_PRODUCTION) {
        logger_1.default.error('Unhandled Rejection - Shutting down gracefully...');
        process.exit(1);
    }
};
exports.handleUnhandledRejection = handleUnhandledRejection;
/**
 * Handle uncaught exceptions
 */
var handleUncaughtException = function (error) {
    (0, logger_1.logError)(error, 'UncaughtException');
    // Always exit on uncaught exceptions
    logger_1.default.error('Uncaught Exception - Shutting down immediately...');
    process.exit(1);
};
exports.handleUncaughtException = handleUncaughtException;
// ==========================================
// VALIDATION ERROR BUILDER
// ==========================================
/**
 * Build validation error from express-validator errors
 */
var buildValidationError = function (errors) {
    var validationErrors = errors.map(function (err) { return ({
        field: err.param,
        message: err.msg,
    }); });
    return new types_1.ValidationError(ERROR_MESSAGES.VALIDATION_ERROR.fa, validationErrors);
};
exports.buildValidationError = buildValidationError;
/**
 * Build validation error from Joi validation result
 */
var buildJoiValidationError = function (joiError) {
    var _a;
    var validationErrors = ((_a = joiError.details) === null || _a === void 0 ? void 0 : _a.map(function (detail) { return ({
        field: detail.path.join('.'),
        message: detail.message,
    }); })) || [];
    return new types_1.ValidationError(ERROR_MESSAGES.VALIDATION_ERROR.fa, validationErrors);
};
exports.buildJoiValidationError = buildJoiValidationError;
// ==========================================
// ERROR RESPONSE HELPERS
// ==========================================
/**
 * Send success response
 */
var sendSuccess = function (res, data, message, statusCode, meta) {
    if (statusCode === void 0) { statusCode = http_status_codes_1.StatusCodes.OK; }
    var response = {
        success: true,
        data: data,
        message: message,
        meta: meta,
    };
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
/**
 * Send error response
 */
var sendError = function (res, message, statusCode, errors) {
    if (statusCode === void 0) { statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST; }
    var response = {
        success: false,
        error: message,
        errors: errors,
    };
    return res.status(statusCode).json(response);
};
exports.sendError = sendError;
/**
 * Send created response (201)
 */
var sendCreated = function (res, data, message) {
    return (0, exports.sendSuccess)(res, data, message, http_status_codes_1.StatusCodes.CREATED);
};
exports.sendCreated = sendCreated;
/**
 * Send no content response (204)
 */
var sendNoContent = function (res) {
    return res.status(http_status_codes_1.StatusCodes.NO_CONTENT).send();
};
exports.sendNoContent = sendNoContent;
// ==========================================
// ATTACH HELPERS TO RESPONSE OBJECT
// ==========================================
/**
 * Middleware to attach helper methods to response object
 */
var attachResponseHelpers = function (req, res, next) {
    // Attach sendSuccess method
    res.sendSuccess = function (data, message, meta) {
        return (0, exports.sendSuccess)(res, data, message, http_status_codes_1.StatusCodes.OK, meta);
    };
    // Attach sendError method
    res.sendError = function (message, statusCode, errors) {
        if (statusCode === void 0) { statusCode = http_status_codes_1.StatusCodes.BAD_REQUEST; }
        return (0, exports.sendError)(res, message, statusCode, errors);
    };
    next();
};
exports.attachResponseHelpers = attachResponseHelpers;
// ==========================================
// REQUEST ID MIDDLEWARE
// ==========================================
/**
 * Add unique request ID to each request
 */
var requestIdMiddleware = function (req, res, next) {
    var requestId = "".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9));
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
// ==========================================
// REQUEST TIMING MIDDLEWARE
// ==========================================
/**
 * Track request processing time
 */
var requestTimingMiddleware = function (req, res, next) {
    req.startTime = Date.now();
    // Log response when finished
    res.on('finish', function () {
        var duration = Date.now() - (req.startTime || 0);
        res.setHeader('X-Response-Time', "".concat(duration, "ms"));
        // Log slow requests (> 1 second)
        if (duration > 1000) {
            logger_1.default.warn("Slow request: ".concat(req.method, " ").concat(req.originalUrl), {
                duration: duration,
                statusCode: res.statusCode,
                requestId: req.requestId,
            });
        }
    });
    next();
};
exports.requestTimingMiddleware = requestTimingMiddleware;
// ==========================================
// EXPORTS
// ==========================================
exports.default = {
    asyncHandler: exports.asyncHandler,
    errorHandler: exports.errorHandler,
    notFoundHandler: exports.notFoundHandler,
    attachResponseHelpers: exports.attachResponseHelpers,
    requestIdMiddleware: exports.requestIdMiddleware,
    requestTimingMiddleware: exports.requestTimingMiddleware,
    sendSuccess: exports.sendSuccess,
    sendError: exports.sendError,
    sendCreated: exports.sendCreated,
    sendNoContent: exports.sendNoContent,
    buildValidationError: exports.buildValidationError,
    buildJoiValidationError: exports.buildJoiValidationError,
    isOperationalError: exports.isOperationalError,
    handleUnhandledRejection: exports.handleUnhandledRejection,
    handleUncaughtException: exports.handleUncaughtException,
};
// ==========================================
// SETUP GLOBAL ERROR HANDLERS
// ==========================================
if (process.env.NODE_ENV !== 'test') {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', exports.handleUnhandledRejection);
    // Handle uncaught exceptions
    process.on('uncaughtException', exports.handleUncaughtException);
}
