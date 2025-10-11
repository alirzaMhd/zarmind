// ==========================================
// ZARMIND - Server Configuration
// ==========================================

import { CorsOptions } from 'cors';
import { Options as RateLimitOptions } from 'express-rate-limit';

// ==========================================
// ENVIRONMENT VARIABLES
// ==========================================

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';
export const IS_DEVELOPMENT = NODE_ENV === 'development';
export const IS_TEST = NODE_ENV === 'test';

// ==========================================
// SERVER CONFIGURATION
// ==========================================

export const SERVER_CONFIG = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || 'localhost',
  API_PREFIX: process.env.API_PREFIX || '/api',
  BASE_URL: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8080',
  TRUST_PROXY: IS_PRODUCTION,
} as const;

// ==========================================
// CORS CONFIGURATION
// ==========================================

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'http://localhost:8080',
      'http://localhost:3000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3000',
    ];

export const CORS_OPTIONS: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (IS_DEVELOPMENT) {
      // Allow all origins in development
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
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

const RATE_LIMIT_WINDOW = parseInt(
  process.env.RATE_LIMIT_WINDOW || '900000',
  10
); // 15 minutes
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);

export const RATE_LIMIT_OPTIONS: Partial<RateLimitOptions> = {
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
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: 'تعداد درخواست‌های شما بیش از حد مجاز است.',
      message: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000),
    });
  },
};

// Stricter rate limit for authentication endpoints
export const AUTH_RATE_LIMIT_OPTIONS: Partial<RateLimitOptions> = {
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
export const UPLOAD_RATE_LIMIT_OPTIONS: Partial<RateLimitOptions> = {
  windowMs: 900000, // 15 minutes
  max: 20, // 20 uploads per window
  message: {
    success: false,
    error: 'تعداد آپلود فایل بیش از حد مجاز است.',
    message: 'Too many file uploads, please try again later.',
  },
};

// Rate limit for AI operations (OCR)
export const AI_RATE_LIMIT_OPTIONS: Partial<RateLimitOptions> = {
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

export const HELMET_OPTIONS = {
  contentSecurityPolicy: IS_PRODUCTION
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
    : false,
  crossOriginEmbedderPolicy: !IS_DEVELOPMENT,
  crossOriginOpenerPolicy: !IS_DEVELOPMENT,
  crossOriginResourcePolicy: { policy: 'cross-origin' as const },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' as const },
  hidePoweredBy: true,
  hsts: IS_PRODUCTION
    ? {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      }
    : false,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' as const },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },
  xssFilter: true,
};

// ==========================================
// BODY PARSER CONFIGURATION
// ==========================================

export const BODY_PARSER_CONFIG = {
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
} as const;

// ==========================================
// COOKIE PARSER CONFIGURATION
// ==========================================

export const COOKIE_CONFIG = {
  SECRET: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'zarmind-secret-key',
  OPTIONS: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? ('strict' as const) : ('lax' as const),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
    signed: true,
  },
} as const;

// ==========================================
// COMPRESSION CONFIGURATION
// ==========================================

export const COMPRESSION_CONFIG = {
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req: any, _res: any) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return true;
  },
};

// ==========================================
// FILE UPLOAD CONFIGURATION
// ==========================================

const parseSize = (size: string): number => {
  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  const match = size.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
  if (!match) return 5 * 1024 * 1024; // Default 5MB

  const value = parseFloat(match[1]!);
  const unit = match[2]!.toUpperCase();

  return value * (units[unit] || 1);
};

export const UPLOAD_CONFIG = {
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
} as const;

// ==========================================
// JWT CONFIGURATION
// ==========================================

export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'zarmind-jwt-secret-change-this',
  EXPIRE: process.env.JWT_EXPIRE || '7d',
  REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'zarmind-refresh-secret',
  REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '30d',
  ALGORITHM: 'HS256' as const,
  ISSUER: 'zarmind',
  AUDIENCE: 'zarmind-users',
} as const;

// ==========================================
// BCRYPT CONFIGURATION
// ==========================================

export const BCRYPT_CONFIG = {
  ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
} as const;

// ==========================================
// PAGINATION DEFAULTS
// ==========================================

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

// ==========================================
// REQUEST TIMEOUT
// ==========================================

export const TIMEOUT_CONFIG = {
  REQUEST_TIMEOUT: 30000, // 30 seconds
  UPLOAD_TIMEOUT: 300000, // 5 minutes for file uploads
  AI_TIMEOUT: 60000, // 1 minute for AI operations
} as const;

// ==========================================
// LOGGING CONFIGURATION
// ==========================================

export const LOG_CONFIG = {
  LEVEL: process.env.LOG_LEVEL || (IS_PRODUCTION ? 'info' : 'debug'),
  DIR: process.env.LOG_DIR || 'logs',
  MAX_SIZE: '20m',
  MAX_FILES: '30d',
  DATE_PATTERN: 'YYYY-MM-DD',
} as const;

// ==========================================
// EMAIL CONFIGURATION (Optional)
// ==========================================

export const EMAIL_CONFIG = {
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
} as const;

// ==========================================
// REDIS CONFIGURATION (Optional - for caching)
// ==========================================

export const REDIS_CONFIG = {
  ENABLED: !!(process.env.REDIS_HOST),
  HOST: process.env.REDIS_HOST || 'localhost',
  PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  PASSWORD: process.env.REDIS_PASSWORD || undefined,
  DB: 0,
  KEY_PREFIX: 'zarmind:',
  RETRY_STRATEGY: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// ==========================================
// SESSION CONFIGURATION (if using sessions)
// ==========================================

export const SESSION_CONFIG = {
  SECRET: process.env.SESSION_SECRET || 'zarmind-session-secret',
  NAME: 'zarmind.sid',
  RESAVE: false,
  SAVE_UNINITIALIZED: false,
  COOKIE: {
    secure: IS_PRODUCTION,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: IS_PRODUCTION ? ('strict' as const) : ('lax' as const),
  },
} as const;

// ==========================================
// AI SERVICE CONFIGURATION
// ==========================================

export const AI_CONFIG = {
  SERVICE: (process.env.AI_SERVICE || 'tesseract') as 'tesseract' | 'google-vision',
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
} as const;

// ==========================================
// BUSINESS CONFIGURATION
// ==========================================

export const BUSINESS_CONFIG = {
  DEFAULT_CURRENCY: 'تومان',
  DEFAULT_WEIGHT_UNIT: 'gram',
  SUPPORTED_CARATS: [18, 21, 22, 24],
  TAX_RATE: parseFloat(process.env.TAX_RATE || '0.09'), // 9% VAT
  INVOICE_PREFIX: 'ZM',
  RECEIPT_PREFIX: 'RC',
  DEFAULT_LANGUAGE: 'fa',
  TIMEZONE: 'Asia/Tehran',
} as const;

// ==========================================
// SECURITY CONFIGURATION
// ==========================================

export const SECURITY_CONFIG = {
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'zarmind-encryption-key-32chars',
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 128,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_TIME: 15 * 60 * 1000, // 15 minutes
  TOKEN_BLACKLIST_ENABLED: true,
  IP_WHITELIST: process.env.IP_WHITELIST?.split(',') || [],
  IP_BLACKLIST: process.env.IP_BLACKLIST?.split(',') || [],
} as const;

// ==========================================
// CACHE CONFIGURATION
// ==========================================

export const CACHE_CONFIG = {
  ENABLED: IS_PRODUCTION,
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
} as const;

// ==========================================
// MONITORING CONFIGURATION
// ==========================================

export const MONITORING_CONFIG = {
  ENABLED: IS_PRODUCTION,
  HEALTH_CHECK_PATH: '/health',
  METRICS_PATH: '/metrics',
  STATUS_PATH: '/status',
} as const;

// ==========================================
// FEATURE FLAGS
// ==========================================

export const FEATURES = {
  AI_SCALE_READING: true,
  AI_PRODUCT_DETECTION: false, // Future feature
  EMAIL_NOTIFICATIONS: EMAIL_CONFIG.ENABLED,
  SMS_NOTIFICATIONS: false, // Future feature
  MULTI_LANGUAGE: false, // Future feature
  ADVANCED_REPORTS: true,
  EXPORT_EXCEL: true,
  EXPORT_PDF: true,
  QR_CODE_GENERATION: true,
  BARCODE_SCANNING: false, // Future feature
} as const;

// ==========================================
// VALIDATION CONFIGURATION
// ==========================================

export const VALIDATION_CONFIG = {
  NATIONAL_ID_REQUIRED: false,
  PHONE_REQUIRED: true,
  EMAIL_REQUIRED: false,
  STRICT_MODE: IS_PRODUCTION,
} as const;

// ==========================================
// EXPORT ALL CONFIGURATIONS
// ==========================================

export default {
  SERVER: SERVER_CONFIG,
  CORS: CORS_OPTIONS,
  RATE_LIMIT: RATE_LIMIT_OPTIONS,
  HELMET: HELMET_OPTIONS,
  BODY_PARSER: BODY_PARSER_CONFIG,
  COOKIE: COOKIE_CONFIG,
  COMPRESSION: COMPRESSION_CONFIG,
  UPLOAD: UPLOAD_CONFIG,
  JWT: JWT_CONFIG,
  BCRYPT: BCRYPT_CONFIG,
  PAGINATION: PAGINATION_CONFIG,
  TIMEOUT: TIMEOUT_CONFIG,
  LOG: LOG_CONFIG,
  EMAIL: EMAIL_CONFIG,
  REDIS: REDIS_CONFIG,
  SESSION: SESSION_CONFIG,
  AI: AI_CONFIG,
  BUSINESS: BUSINESS_CONFIG,
  SECURITY: SECURITY_CONFIG,
  CACHE: CACHE_CONFIG,
  MONITORING: MONITORING_CONFIG,
  FEATURES,
  VALIDATION: VALIDATION_CONFIG,
  ENV: {
    NODE_ENV,
    IS_PRODUCTION,
    IS_DEVELOPMENT,
    IS_TEST,
  },
};