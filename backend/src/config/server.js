"use strict";
// ==========================================
// ZARMIND - Server Configuration
// ==========================================
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALIDATION_CONFIG = exports.FEATURES = exports.MONITORING_CONFIG = exports.CACHE_CONFIG = exports.SECURITY_CONFIG = exports.BUSINESS_CONFIG = exports.AI_CONFIG = exports.SESSION_CONFIG = exports.REDIS_CONFIG = exports.EMAIL_CONFIG = exports.LOG_CONFIG = exports.TIMEOUT_CONFIG = exports.PAGINATION_CONFIG = exports.BCRYPT_CONFIG = exports.JWT_CONFIG = exports.UPLOAD_CONFIG = exports.COMPRESSION_CONFIG = exports.COOKIE_CONFIG = exports.BODY_PARSER_CONFIG = exports.HELMET_OPTIONS = exports.AI_RATE_LIMIT_OPTIONS = exports.UPLOAD_RATE_LIMIT_OPTIONS = exports.AUTH_RATE_LIMIT_OPTIONS = exports.RATE_LIMIT_OPTIONS = exports.CORS_OPTIONS = exports.SERVER_CONFIG = exports.IS_TEST = exports.IS_DEVELOPMENT = exports.IS_PRODUCTION = exports.NODE_ENV = void 0;
// ==========================================
// ENVIRONMENT VARIABLES
// ==========================================
exports.NODE_ENV = process.env.NODE_ENV || 'development';
exports.IS_PRODUCTION = exports.NODE_ENV === 'production';
exports.IS_DEVELOPMENT = exports.NODE_ENV === 'development';
exports.IS_TEST = exports.NODE_ENV === 'test';
// ==========================================
// SERVER CONFIGURATION
// ==========================================
exports.SERVER_CONFIG = {
    PORT: parseInt(process.env.PORT || '3000', 10),
    HOST: process.env.HOST || 'localhost',
    API_PREFIX: process.env.API_PREFIX || '/api',
    BASE_URL: process.env.BASE_URL || "http://localhost:".concat(process.env.PORT || 3000),
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8080',
    TRUST_PROXY: exports.IS_PRODUCTION,
};
// ==========================================
// CORS CONFIGURATION
// ==========================================
var allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(function (origin) { return origin.trim(); })
    : [
        'http://localhost:8080',
        'http://localhost:3000',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:3000',
    ];
exports.CORS_OPTIONS = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin)
            return callback(null, true);
        if (exports.IS_DEVELOPMENT) {
            // Allow all origins in development
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Allow-Headers',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Total-Count'],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200,
};
// ==========================================
// RATE LIMITING
// ==========================================
var RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10); // 15 minutes
var RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
exports.RATE_LIMIT_OPTIONS = {
    windowMs: RATE_LIMIT_WINDOW,
    max: RATE_LIMIT_MAX,
    message: {
        success: false,
        error: 'تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً بعداً تلاش کنید.',
        message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: function (req) {
        return req.ip || req.socket.remoteAddress || 'unknown';
    },
    handler: function (req, res) {
        res.status(429).json({
            success: false,
            error: 'تعداد درخواست‌های شما بیش از حد مجاز است.',
            message: 'Too many requests, please try again later.',
            retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000),
        });
    },
};
// Stricter rate limit for authentication endpoints
exports.AUTH_RATE_LIMIT_OPTIONS = {
    windowMs: 900000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
        success: false,
        error: 'تلاش‌های ورود بیش از حد. لطفاً 15 دقیقه صبر کنید.',
        message: 'Too many login attempts, please try again after 15 minutes.',
    },
    skipSuccessfulRequests: true,
};
// Rate limit for file uploads
exports.UPLOAD_RATE_LIMIT_OPTIONS = {
    windowMs: 900000, // 15 minutes
    max: 20, // 20 uploads per window
    message: {
        success: false,
        error: 'تعداد آپلود فایل بیش از حد مجاز است.',
        message: 'Too many file uploads, please try again later.',
    },
};
// Rate limit for AI operations (OCR)
exports.AI_RATE_LIMIT_OPTIONS = {
    windowMs: 60000, // 1 minute
    max: 10, // 10 AI requests per minute
    message: {
        success: false,
        error: 'تعداد درخواست‌های هوش مصنوعی بیش از حد است.',
        message: 'Too many AI requests, please try again later.',
    },
};
// ==========================================
// HELMET SECURITY CONFIGURATION
// ==========================================
exports.HELMET_OPTIONS = {
    contentSecurityPolicy: exports.IS_PRODUCTION
        ? {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        }
        : false, // Disable in development for easier debugging
    crossOriginEmbedderPolicy: !exports.IS_DEVELOPMENT,
    crossOriginOpenerPolicy: !exports.IS_DEVELOPMENT,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: exports.IS_PRODUCTION
        ? {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
        }
        : false,
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
};
// ==========================================
// BODY PARSER CONFIGURATION
// ==========================================
exports.BODY_PARSER_CONFIG = {
    JSON: {
        limit: '10mb',
        strict: true,
        type: 'application/json',
    },
    URLENCODED: {
        extended: true,
        limit: '10mb',
        parameterLimit: 10000,
    },
};
// ==========================================
// COOKIE PARSER CONFIGURATION
// ==========================================
exports.COOKIE_CONFIG = {
    SECRET: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'zarmind-secret-key',
    OPTIONS: {
        httpOnly: true,
        secure: exports.IS_PRODUCTION,
        sameSite: exports.IS_PRODUCTION ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
        signed: true,
    },
};
// ==========================================
// COMPRESSION CONFIGURATION
// ==========================================
exports.COMPRESSION_CONFIG = {
    level: 6, // Compression level (0-9)
    threshold: 1024, // Only compress responses larger than 1KB
    filter: function (req, res) {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return true;
    },
};
// ==========================================
// FILE UPLOAD CONFIGURATION
// ==========================================
var parseSize = function (size) {
    var units = {
        B: 1,
        KB: 1024,
        MB: 1024 * 1024,
        GB: 1024 * 1024 * 1024,
    };
    var match = size.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
    if (!match)
        return 5 * 1024 * 1024; // Default 5MB
    var value = parseFloat(match[1]);
    var unit = match[2].toUpperCase();
    return value * (units[unit] || 1);
};
exports.UPLOAD_CONFIG = {
    MAX_FILE_SIZE: parseSize(process.env.MAX_FILE_SIZE || '5MB'),
    UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads',
    ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'],
    ALLOWED_DOCUMENT_TYPES: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
    ALLOWED_ALL_TYPES: [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'bmp',
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
    ],
    TEMP_PATH: 'uploads/temp',
    PRODUCTS_PATH: 'uploads/products',
    SCALE_PATH: 'uploads/scale',
    DOCUMENTS_PATH: 'uploads/documents',
    AVATARS_PATH: 'uploads/avatars',
};
// ==========================================
// JWT CONFIGURATION
// ==========================================
exports.JWT_CONFIG = {
    SECRET: process.env.JWT_SECRET || 'zarmind-jwt-secret-change-this',
    EXPIRE: process.env.JWT_EXPIRE || '7d',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'zarmind-refresh-secret',
    REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
    ALGORITHM: 'HS256',
    ISSUER: 'zarmind',
    AUDIENCE: 'zarmind-users',
};
// ==========================================
// BCRYPT CONFIGURATION
// ==========================================
exports.BCRYPT_CONFIG = {
    ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
};
// ==========================================
// PAGINATION DEFAULTS
// ==========================================
exports.PAGINATION_CONFIG = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MIN_LIMIT: 1,
};
// ==========================================
// REQUEST TIMEOUT
// ==========================================
exports.TIMEOUT_CONFIG = {
    REQUEST_TIMEOUT: 30000, // 30 seconds
    UPLOAD_TIMEOUT: 300000, // 5 minutes for file uploads
    AI_TIMEOUT: 60000, // 1 minute for AI operations
};
// ==========================================
// LOGGING CONFIGURATION
// ==========================================
exports.LOG_CONFIG = {
    LEVEL: process.env.LOG_LEVEL || (exports.IS_PRODUCTION ? 'info' : 'debug'),
    DIR: process.env.LOG_DIR || 'logs',
    MAX_SIZE: '20m',
    MAX_FILES: '30d',
    DATE_PATTERN: 'YYYY-MM-DD',
};
// ==========================================
// EMAIL CONFIGURATION (Optional)
// ==========================================
exports.EMAIL_CONFIG = {
    ENABLED: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
    SMTP: {
        HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
        PORT: parseInt(process.env.SMTP_PORT || '587', 10),
        SECURE: process.env.SMTP_PORT === '465',
        AUTH: {
            USER: process.env.SMTP_USER || '',
            PASS: process.env.SMTP_PASS || '',
        },
    },
    FROM: process.env.SMTP_FROM || 'noreply@zarmind.com',
    FROM_NAME: 'Zarmind - سیستم زرمند',
};
// ==========================================
// REDIS CONFIGURATION (Optional - for caching)
// ==========================================
exports.REDIS_CONFIG = {
    ENABLED: !!(process.env.REDIS_HOST),
    HOST: process.env.REDIS_HOST || 'localhost',
    PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    PASSWORD: process.env.REDIS_PASSWORD || undefined,
    DB: 0,
    KEY_PREFIX: 'zarmind:',
    RETRY_STRATEGY: function (times) {
        var delay = Math.min(times * 50, 2000);
        return delay;
    },
};
// ==========================================
// SESSION CONFIGURATION (if using sessions)
// ==========================================
exports.SESSION_CONFIG = {
    SECRET: process.env.SESSION_SECRET || 'zarmind-session-secret',
    NAME: 'zarmind.sid',
    RESAVE: false,
    SAVE_UNINITIALIZED: false,
    COOKIE: {
        secure: exports.IS_PRODUCTION,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: exports.IS_PRODUCTION ? 'strict' : 'lax',
    },
};
// ==========================================
// AI SERVICE CONFIGURATION
// ==========================================
exports.AI_CONFIG = {
    SERVICE: (process.env.AI_SERVICE || 'tesseract'),
    TESSERACT: {
        LANG: process.env.TESSERACT_LANG || 'eng',
        OEM: 3, // LSTM neural net mode
        PSM: 7, // Single text line mode (good for scales)
    },
    GOOGLE_VISION: {
        ENABLED: !!(process.env.GOOGLE_VISION_API_KEY || process.env.GOOGLE_CLOUD_PROJECT_ID),
        API_KEY: process.env.GOOGLE_VISION_API_KEY || '',
        PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
    },
    IMAGE_PREPROCESSING: {
        RESIZE_WIDTH: 1200,
        GRAYSCALE: true,
        NORMALIZE: true,
        SHARPEN: true,
        DENOISE: true,
    },
};
// ==========================================
// BUSINESS CONFIGURATION
// ==========================================
exports.BUSINESS_CONFIG = {
    DEFAULT_CURRENCY: 'تومان',
    DEFAULT_WEIGHT_UNIT: 'gram',
    SUPPORTED_CARATS: [18, 21, 22, 24],
    TAX_RATE: parseFloat(process.env.TAX_RATE || '0.09'), // 9% VAT
    INVOICE_PREFIX: 'ZM',
    RECEIPT_PREFIX: 'RC',
    DEFAULT_LANGUAGE: 'fa',
    TIMEZONE: 'Asia/Tehran',
};
// ==========================================
// SECURITY CONFIGURATION
// ==========================================
exports.SECURITY_CONFIG = {
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'zarmind-encryption-key-32chars',
    PASSWORD_MIN_LENGTH: 6,
    PASSWORD_MAX_LENGTH: 128,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCK_TIME: 15 * 60 * 1000, // 15 minutes
    TOKEN_BLACKLIST_ENABLED: true,
    IP_WHITELIST: ((_a = process.env.IP_WHITELIST) === null || _a === void 0 ? void 0 : _a.split(',')) || [],
    IP_BLACKLIST: ((_b = process.env.IP_BLACKLIST) === null || _b === void 0 ? void 0 : _b.split(',')) || [],
};
// ==========================================
// CACHE CONFIGURATION
// ==========================================
exports.CACHE_CONFIG = {
    ENABLED: exports.IS_PRODUCTION,
    TTL: {
        SHORT: 60, // 1 minute
        MEDIUM: 300, // 5 minutes
        LONG: 3600, // 1 hour
        DAY: 86400, // 24 hours
    },
    KEYS: {
        GOLD_PRICE: 'gold_price:',
        PRODUCT: 'product:',
        CUSTOMER: 'customer:',
        USER: 'user:',
        REPORT: 'report:',
    },
};
// ==========================================
// MONITORING CONFIGURATION
// ==========================================
exports.MONITORING_CONFIG = {
    ENABLED: exports.IS_PRODUCTION,
    HEALTH_CHECK_PATH: '/health',
    METRICS_PATH: '/metrics',
    STATUS_PATH: '/status',
};
// ==========================================
// FEATURE FLAGS
// ==========================================
exports.FEATURES = {
    AI_SCALE_READING: true,
    AI_PRODUCT_DETECTION: false, // Future feature
    EMAIL_NOTIFICATIONS: exports.EMAIL_CONFIG.ENABLED,
    SMS_NOTIFICATIONS: false, // Future feature
    MULTI_LANGUAGE: false, // Future feature
    ADVANCED_REPORTS: true,
    EXPORT_EXCEL: true,
    EXPORT_PDF: true,
    QR_CODE_GENERATION: true,
    BARCODE_SCANNING: false, // Future feature
};
// ==========================================
// VALIDATION CONFIGURATION
// ==========================================
exports.VALIDATION_CONFIG = {
    NATIONAL_ID_REQUIRED: false,
    PHONE_REQUIRED: true,
    EMAIL_REQUIRED: false,
    STRICT_MODE: exports.IS_PRODUCTION,
};
// ==========================================
// EXPORT ALL CONFIGURATIONS
// ==========================================
exports.default = {
    SERVER: exports.SERVER_CONFIG,
    CORS: exports.CORS_OPTIONS,
    RATE_LIMIT: exports.RATE_LIMIT_OPTIONS,
    HELMET: exports.HELMET_OPTIONS,
    BODY_PARSER: exports.BODY_PARSER_CONFIG,
    COOKIE: exports.COOKIE_CONFIG,
    COMPRESSION: exports.COMPRESSION_CONFIG,
    UPLOAD: exports.UPLOAD_CONFIG,
    JWT: exports.JWT_CONFIG,
    BCRYPT: exports.BCRYPT_CONFIG,
    PAGINATION: exports.PAGINATION_CONFIG,
    TIMEOUT: exports.TIMEOUT_CONFIG,
    LOG: exports.LOG_CONFIG,
    EMAIL: exports.EMAIL_CONFIG,
    REDIS: exports.REDIS_CONFIG,
    SESSION: exports.SESSION_CONFIG,
    AI: exports.AI_CONFIG,
    BUSINESS: exports.BUSINESS_CONFIG,
    SECURITY: exports.SECURITY_CONFIG,
    CACHE: exports.CACHE_CONFIG,
    MONITORING: exports.MONITORING_CONFIG,
    FEATURES: exports.FEATURES,
    VALIDATION: exports.VALIDATION_CONFIG,
    ENV: {
        NODE_ENV: exports.NODE_ENV,
        IS_PRODUCTION: exports.IS_PRODUCTION,
        IS_DEVELOPMENT: exports.IS_DEVELOPMENT,
        IS_TEST: exports.IS_TEST,
    },
};
