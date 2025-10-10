"use strict";
// ==========================================
// ZARMIND - Logger Utility
// ==========================================
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.silly = exports.debug = exports.verbose = exports.http = exports.info = exports.warn = exports.error = exports.closeLogger = exports.stream = exports.logFile = exports.logValidation = exports.createChildLogger = exports.logPerformance = exports.logSystem = exports.logSecurity = exports.logBusiness = exports.logAI = exports.logError = exports.logQuery = exports.logAuth = exports.logRequest = void 0;
var winston = require("winston");
var DailyRotateFile = require("winston-daily-rotate-file");
var path = require("path");
var fs = require("fs");
// ==========================================
// LOG DIRECTORY SETUP
// ==========================================
var logDir = process.env.LOG_DIR || 'logs';
// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}
// ==========================================
// LOG LEVELS
// ==========================================
var levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
};
var colors = {
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
var level = function () {
    var env = process.env.NODE_ENV || 'development';
    var isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : (process.env.LOG_LEVEL || 'info');
};
// ==========================================
// LOG FORMATS
// ==========================================
// Format for development (colorful, readable)
var devFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.colorize({ all: true }), winston.format.printf(function (info) {
    var timestamp = info.timestamp, level = info.level, message = info.message, meta = __rest(info, ["timestamp", "level", "message"]);
    var metaString = Object.keys(meta).length ? "\n".concat(JSON.stringify(meta, null, 2)) : '';
    return "[".concat(timestamp, "] ").concat(level, ": ").concat(message).concat(metaString);
}));
// Format for production (JSON, structured)
var prodFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.splat(), winston.format.json());
// Format for files (detailed)
var fileFormat = winston.format.combine(winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston.format.errors({ stack: true }), winston.format.uncolorize(), winston.format.json());
// ==========================================
// TRANSPORTS
// ==========================================
var transports = [];
// Console Transport
if (process.env.NODE_ENV !== 'production') {
    transports.push(new winston.transports.Console({
        format: devFormat
    }));
}
else {
    transports.push(new winston.transports.Console({
        format: prodFormat
    }));
}
// Error Log File (Daily Rotation)
transports.push(new DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true
}));
// Combined Log File (Daily Rotation)
transports.push(new DailyRotateFile({
    filename: path.join(logDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '30d',
    zippedArchive: true
}));
// HTTP Log File (Daily Rotation)
transports.push(new DailyRotateFile({
    filename: path.join(logDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    format: fileFormat,
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
}));
// Debug Log File (Development only)
if (process.env.NODE_ENV !== 'production') {
    transports.push(new DailyRotateFile({
        filename: path.join(logDir, 'debug-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'debug',
        format: fileFormat,
        maxSize: '20m',
        maxFiles: '7d',
        zippedArchive: true
    }));
}
// ==========================================
// LOGGER INSTANCE
// ==========================================
var logger = winston.createLogger({
    level: level(),
    levels: levels,
    format: prodFormat,
    transports: transports,
    exitOnError: false
});
// ==========================================
// HELPER FUNCTIONS
// ==========================================
/**
 * Log HTTP request
 */
var logRequest = function (method, url, statusCode, responseTime, userId) {
    var message = "".concat(method, " ").concat(url, " ").concat(statusCode, " ").concat(responseTime, "ms");
    logger.http(message, {
        method: method,
        url: url,
        statusCode: statusCode,
        responseTime: responseTime,
        userId: userId,
        timestamp: new Date().toISOString()
    });
};
exports.logRequest = logRequest;
/**
 * Log authentication events
 */
var logAuth = function (event, username, ip, userAgent) {
    logger.info("Auth Event: ".concat(event), {
        event: event,
        username: username,
        ip: ip,
        userAgent: userAgent,
        timestamp: new Date().toISOString()
    });
};
exports.logAuth = logAuth;
/**
 * Log database queries (development only)
 */
var logQuery = function (query, params, duration) {
    if (process.env.NODE_ENV === 'development') {
        logger.debug('Database Query', {
            query: query,
            params: params,
            duration: duration ? "".concat(duration, "ms") : undefined,
            timestamp: new Date().toISOString()
        });
    }
};
exports.logQuery = logQuery;
/**
 * Log errors with stack trace
 */
var logError = function (error, context, meta) {
    if (error instanceof Error) {
        logger.error("".concat(context ? "[".concat(context, "] ") : '').concat(error.message), __assign(__assign({ error: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }, context: context }, meta), { timestamp: new Date().toISOString() }));
    }
    else {
        logger.error("".concat(context ? "[".concat(context, "] ") : '').concat(error), __assign(__assign({ context: context }, meta), { timestamp: new Date().toISOString() }));
    }
};
exports.logError = logError;
/**
 * Log AI/OCR operations
 */
var logAI = function (operation, success, confidence, duration, meta) {
    logger.info("AI Operation: ".concat(operation), __assign(__assign({ operation: operation, success: success, confidence: confidence, duration: duration ? "".concat(duration, "ms") : undefined }, meta), { timestamp: new Date().toISOString() }));
};
exports.logAI = logAI;
/**
 * Log business operations (sales, inventory changes, etc.)
 */
var logBusiness = function (operation, entityType, entityId, userId, details) {
    logger.info("Business Operation: ".concat(operation), __assign(__assign({ operation: operation, entityType: entityType, entityId: entityId, userId: userId }, details), { timestamp: new Date().toISOString() }));
};
exports.logBusiness = logBusiness;
/**
 * Log security events
 */
var logSecurity = function (event, severity, details) {
    var message = "Security Event: ".concat(event);
    if (severity === 'critical' || severity === 'high') {
        logger.error(message, __assign({ event: event, severity: severity }, details));
    }
    else {
        logger.warn(message, __assign({ event: event, severity: severity }, details));
    }
};
exports.logSecurity = logSecurity;
/**
 * Log system events
 */
var logSystem = function (event, details) {
    logger.info("System Event: ".concat(event), __assign(__assign({ event: event }, details), { timestamp: new Date().toISOString() }));
};
exports.logSystem = logSystem;
/**
 * Log performance metrics
 */
var logPerformance = function (operation, duration, threshold, meta) {
    var isSlowOperation = threshold && duration > threshold;
    var message = "Performance: ".concat(operation, " (").concat(duration, "ms)").concat(isSlowOperation ? ' - SLOW OPERATION' : '');
    if (isSlowOperation) {
        logger.warn(message, __assign({ operation: operation, duration: duration, threshold: threshold }, meta));
    }
    else {
        logger.verbose(message, __assign({ operation: operation, duration: duration }, meta));
    }
};
exports.logPerformance = logPerformance;
/**
 * Create a child logger with default metadata
 */
var createChildLogger = function (defaultMeta) {
    return logger.child(defaultMeta);
};
exports.createChildLogger = createChildLogger;
/**
 * Log validation errors
 */
var logValidation = function (field, value, error, context) {
    logger.warn('Validation Error', {
        field: field,
        value: value,
        error: error,
        context: context,
        timestamp: new Date().toISOString()
    });
};
exports.logValidation = logValidation;
/**
 * Log file operations
 */
var logFile = function (operation, filename, success, size, error) {
    logger.info("File Operation: ".concat(operation), {
        operation: operation,
        filename: filename,
        success: success,
        size: size,
        error: error,
        timestamp: new Date().toISOString()
    });
};
exports.logFile = logFile;
// ==========================================
// STREAM FOR MORGAN (HTTP LOGGING)
// ==========================================
exports.stream = {
    write: function (message) {
        logger.http(message.trim());
    }
};
// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
var closeLogger = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve) {
                logger.on('finish', function () {
                    resolve();
                });
                logger.end();
            })];
    });
}); };
exports.closeLogger = closeLogger;
// ==========================================
// EXPORTS
// ==========================================
exports.default = logger;
// Named exports for convenience
exports.error = logger.error, exports.warn = logger.warn, exports.info = logger.info, exports.http = logger.http, exports.verbose = logger.verbose, exports.debug = logger.debug, exports.silly = logger.silly;
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
