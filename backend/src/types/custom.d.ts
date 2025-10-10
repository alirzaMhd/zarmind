// ==========================================
// ZARMIND - Custom Type Declarations
// ==========================================

// Extend Express Request with custom properties
declare namespace Express {
  export interface Request {
    user?: {
      userId: string;
      username: string;
      role: import('./index').UserRole;
      iat?: number;
      exp?: number;
    };
    file?: {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      destination: string;
      filename: string;
      path: string;
      size: number;
      buffer?: Buffer;
    };
    files?:
      | {
          [fieldname: string]: Express.Multer.File[];
        }
      | Express.Multer.File[];
    requestId?: string;
    startTime?: number;
  }

  export interface Response {
    sendSuccess: <T = any>(data?: T, message?: string, meta?: any) => Response;
    sendError: (message: string, statusCode?: number, errors?: any[]) => Response;
  }
}

// ==========================================
// Node.js Process Environment
// ==========================================

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Server
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      HOST?: string;
      API_PREFIX?: string;

      // Database
      DB_HOST: string;
      DB_PORT: string;
      DB_NAME: string;
      DB_USER: string;
      DB_PASSWORD: string;
      DB_SSL?: string;
      DB_MAX_CONNECTIONS?: string;

      // JWT
      JWT_SECRET: string;
      JWT_EXPIRE: string;
      JWT_REFRESH_SECRET?: string;
      JWT_REFRESH_EXPIRE?: string;

      // AI Services
      AI_SERVICE: 'tesseract' | 'google-vision';
      GOOGLE_VISION_API_KEY?: string;
      GOOGLE_CLOUD_PROJECT_ID?: string;
      TESSERACT_LANG?: string;

      // Upload
      MAX_FILE_SIZE: string;
      UPLOAD_PATH: string;
      ALLOWED_FILE_TYPES?: string;

      // Email (Optional)
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;
      SMTP_FROM?: string;

      // Redis (Optional for caching)
      REDIS_HOST?: string;
      REDIS_PORT?: string;
      REDIS_PASSWORD?: string;

      // Security
      BCRYPT_ROUNDS?: string;
      RATE_LIMIT_WINDOW?: string;
      RATE_LIMIT_MAX?: string;
      CORS_ORIGIN?: string;

      // Logging
      LOG_LEVEL?: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
      LOG_DIR?: string;

      // Others
      FRONTEND_URL?: string;
      SESSION_SECRET?: string;
      ENCRYPTION_KEY?: string;
    }
  }
}

// ==========================================
// Multer File Types
// ==========================================

declare module 'multer' {
  export interface File {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
  }
}

// ==========================================
// JWT Payload Extension
// ==========================================

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    userId?: string;
    username?: string;
    role?: string;
    iat?: number;
    exp?: number;
    [key: string]: any;
  }
}

// ==========================================
// PostgreSQL Pool Extension
// ==========================================

declare module 'pg' {
  export interface QueryResult<T = any> {
    command: string;
    rowCount: number;
    oid: number;
    rows: T[];
    fields: FieldDef[];
  }

  export interface Pool {
    query<T = any>(
      text: string,
      values?: any[]
    ): Promise<QueryResult<T>>;
    connect(): Promise<PoolClient>;
    end(): Promise<void>;
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  }
}

// ==========================================
// Tesseract.js Types
// ==========================================

declare module 'tesseract.js' {
  export interface RecognizeResult {
    data: {
      text: string;
      confidence: number;
      lines: Line[];
      words: Word[];
      symbols: Symbol[];
      hocr: string;
      tsv: string;
      box: string;
      unlv: string;
      sd: string;
    };
  }

  export interface Line {
    text: string;
    confidence: number;
    baseline: Baseline;
    bbox: BBox;
    words: Word[];
  }

  export interface Word {
    text: string;
    confidence: number;
    baseline: Baseline;
    bbox: BBox;
    symbols: Symbol[];
  }

  export interface Symbol {
    text: string;
    confidence: number;
    baseline: Baseline;
    bbox: BBox;
  }

  export interface BBox {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  }

  export interface Baseline {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    has_baseline: boolean;
  }

  export function recognize(
    image: string | Buffer,
    lang?: string,
    options?: any
  ): Promise<RecognizeResult>;

  export function detect(image: string | Buffer): Promise<any>;

  export const createWorker: (options?: any) => Worker;

  export class Worker {
    load(): Promise<void>;
    loadLanguage(lang: string): Promise<void>;
    initialize(lang: string): Promise<void>;
    recognize(image: string | Buffer): Promise<RecognizeResult>;
    detect(image: string | Buffer): Promise<any>;
    terminate(): Promise<void>;
  }
}

// ==========================================
// Sharp Image Processing
// ==========================================

declare module 'sharp' {
  interface Sharp {
    resize(width?: number, height?: number, options?: any): Sharp;
    grayscale(grayscale?: boolean): Sharp;
    normalize(normalize?: boolean): Sharp;
    sharpen(sigma?: number, flat?: number, jagged?: number): Sharp;
    threshold(threshold?: number, options?: any): Sharp;
    negate(negate?: boolean): Sharp;
    median(size?: number): Sharp;
    blur(sigma?: number): Sharp;
    toBuffer(): Promise<Buffer>;
    toFile(filename: string): Promise<any>;
  }

  function sharp(input?: string | Buffer): Sharp;
  export = sharp;
}

// ==========================================
// Google Cloud Vision
// ==========================================

declare module '@google-cloud/vision' {
  export interface TextAnnotation {
    description: string;
    locale?: string;
    boundingPoly?: BoundingPoly;
  }

  export interface BoundingPoly {
    vertices: Vertex[];
  }

  export interface Vertex {
    x: number;
    y: number;
  }

  export class ImageAnnotatorClient {
    constructor(options?: any);
    textDetection(request: any): Promise<any[]>;
    documentTextDetection(request: any): Promise<any[]>;
  }
}

// ==========================================
// Date-fns Jalali
// ==========================================

declare module 'date-fns-jalali' {
  export function format(date: Date | number, formatStr: string): string;
  export function parse(dateString: string, formatString: string, referenceDate: Date): Date;
  export function isValid(date: any): boolean;
  export function addDays(date: Date | number, amount: number): Date;
  export function subDays(date: Date | number, amount: number): Date;
  export function startOfDay(date: Date | number): Date;
  export function endOfDay(date: Date | number): Date;
  export function startOfMonth(date: Date | number): Date;
  export function endOfMonth(date: Date | number): Date;
  export function startOfYear(date: Date | number): Date;
  export function endOfYear(date: Date | number): Date;
}

// ==========================================
// Winston Logger Extension
// ==========================================

declare module 'winston' {
  export interface Logger {
    error(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    info(message: string, meta?: any): void;
    http(message: string, meta?: any): void;
    verbose(message: string, meta?: any): void;
    debug(message: string, meta?: any): void;
    silly(message: string, meta?: any): void;
  }
}

// ==========================================
// Custom Utility Types
// ==========================================

declare global {
  type AsyncFunction<T = any> = (...args: any[]) => Promise<T>;
  
  type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
  
  type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

  type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
  };

  type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
  };

  type ValueOf<T> = T[keyof T];

  type NonEmptyArray<T> = [T, ...T[]];

  type StringKeys<T> = Extract<keyof T, string>;

  type NumericKeys<T> = Extract<keyof T, number>;

  // Database query result helper
  type DbResult<T> = {
    rows: T[];
    rowCount: number;
  };

  // API response helper
  type ApiSuccess<T = any> = {
    success: true;
    data: T;
    message?: string;
    meta?: any;
  };

  type ApiError = {
    success: false;
    error: string;
    errors?: any[];
    statusCode?: number;
  };

  type ApiResponse<T = any> = ApiSuccess<T> | ApiError;
}

// ==========================================
// Module Augmentation for Custom Methods
// ==========================================

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      userId: string;
      username: string;
      role: string;
    };
    requestId?: string;
  }

  interface Response {
    sendSuccess: <T = any>(data?: T, message?: string, meta?: any) => Response;
    sendError: (message: string, statusCode?: number, errors?: any[]) => Response;
  }
}

// ==========================================
// Array Extensions
// ==========================================

interface Array<T> {
  /**
   * Returns the first element of the array or undefined
   */
  first(): T | undefined;
  
  /**
   * Returns the last element of the array or undefined
   */
  last(): T | undefined;
  
  /**
   * Checks if array is empty
   */
  isEmpty(): boolean;
  
  /**
   * Checks if array is not empty
   */
  isNotEmpty(): boolean;
}

// ==========================================
// String Extensions
// ==========================================

interface String {
  /**
   * Convert Persian/Arabic digits to English
   */
  toPersianDigits(): string;
  
  /**
   * Convert English digits to Persian
   */
  toEnglishDigits(): string;
  
  /**
   * Truncate string with ellipsis
   */
  truncate(length: number, suffix?: string): string;
}

// ==========================================
// Number Extensions
// ==========================================

interface Number {
  /**
   * Format number as Persian price (with separators)
   */
  toPersianPrice(): string;
  
  /**
   * Format number with thousand separators
   */
  toLocaleNumber(): string;
}

// ==========================================
// Date Extensions
// ==========================================

interface Date {
  /**
   * Convert to Persian/Jalali date string
   */
  toJalali(format?: string): string;
  
  /**
   * Check if date is today
   */
  isToday(): boolean;
  
  /**
   * Check if date is in the past
   */
  isPast(): boolean;
  
  /**
   * Check if date is in the future
   */
  isFuture(): boolean;
}

// ==========================================
// Exports
// ==========================================

export {};