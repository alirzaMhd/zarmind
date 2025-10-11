// ==========================================
// ZARMIND - Helper Functions
// ==========================================

import * as crypto from 'crypto';
import { format as formatJalali, parse as parseJalali } from 'date-fns-jalali';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';
import { WeightUnit, IPaginationMeta } from '../types';

// ==========================================
// STRING UTILITIES
// ==========================================

/**
 * Generate a random string
 */
export const generateRandomString = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

/**
 * Generate UUID
 */
export const generateUUID = (): string => {
  return uuidv4();
};

/**
 * Generate unique code with prefix
 */
export const generateUniqueCode = (prefix: string, length: number = 8): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = generateRandomString(length).toUpperCase();
  return `${prefix}-${timestamp}-${random.slice(0, 4)}`;
};

/**
 * Slugify string (convert to URL-friendly format)
 */
export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Truncate string with ellipsis
 */
export const truncate = (text: string, length: number, suffix: string = '...'): string => {
  if (text.length <= length) return text;
  return text.slice(0, length - suffix.length) + suffix;
};

/**
 * Capitalize first letter
 */
export const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Convert camelCase to snake_case
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Convert snake_case to camelCase
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// ==========================================
// PERSIAN/ARABIC UTILITIES
// ==========================================

/**
 * Convert Persian/Arabic digits to English
 */
export const toEnglishDigits = (str: string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  let result = str;
  
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i]!, 'g'), englishDigits[i]!);
    result = result.replace(new RegExp(arabicDigits[i]!, 'g'), englishDigits[i]!);
  }
  
  return result;
};

/**
 * Convert English digits to Persian
 */
export const toPersianDigits = (str: string | number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/\d/g, (digit) => persianDigits[parseInt(digit)]!);
};

/**
 * Sanitize Persian text (normalize characters)
 */
export const sanitizePersian = (text: string): string => {
  return text
    .replace(/ك/g, 'ک')
    .replace(/ي/g, 'ی')
    .replace(/ى/g, 'ی')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ی')
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .replace(/آ/g, 'ا')
    .trim();
};

// ==========================================
// NUMBER & PRICE FORMATTING
// ==========================================

/**
 * Format number with thousand separators (Persian style)
 */
export const formatNumber = (num: number | string, locale: string = 'fa-IR'): string => {
  const number = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(number)) return '0';
  
  return new Intl.NumberFormat(locale).format(number);
};

/**
 * Format price with currency (Toman/Rial)
 */
export const formatPrice = (
  amount: number,
  currency: 'تومان' | 'ریال' = 'تومان',
  usePersianDigits: boolean = true
): string => {
  const formatted = formatNumber(amount);
  const withCurrency = `${formatted} ${currency}`;
  
  return usePersianDigits ? toPersianDigits(withCurrency) : withCurrency;
};

/**
 * Convert Rial to Toman
 */
export const rialToToman = (rial: number): number => {
  return Math.floor(rial / 10);
};

/**
 * Convert Toman to Rial
 */
export const tomanToRial = (toman: number): number => {
  return toman * 10;
};

/**
 * Parse price string to number (remove separators and text)
 */
export const parsePrice = (priceStr: string): number => {
  const cleaned = toEnglishDigits(priceStr)
    .replace(/[^\d.-]/g, '')
    .trim();
  
  return parseFloat(cleaned) || 0;
};

/**
 * Format weight with unit
 */
export const formatWeight = (weight: number, unit: WeightUnit = WeightUnit.GRAM): string => {
  const unitLabels = {
    [WeightUnit.GRAM]: 'گرم',
    [WeightUnit.KILOGRAM]: 'کیلوگرم',
    [WeightUnit.MITHQAL]: 'مثقال',
    [WeightUnit.OUNCE]: 'اونس'
  };
  
  return `${toPersianDigits(weight.toFixed(2))} ${unitLabels[unit]}`;
};

// ==========================================
// WEIGHT CONVERSION
// ==========================================

/**
 * Convert weight between units
 */
export const convertWeight = (
  value: number,
  fromUnit: WeightUnit,
  toUnit: WeightUnit
): number => {
  // Convert to grams first
  let grams: number;
  
  switch (fromUnit) {
    case WeightUnit.GRAM:
      grams = value;
      break;
    case WeightUnit.KILOGRAM:
      grams = value * 1000;
      break;
    case WeightUnit.MITHQAL:
      grams = value * 4.608; // 1 مثقال = 4.608 گرم
      break;
    case WeightUnit.OUNCE:
      grams = value * 31.1035; // 1 troy ounce = 31.1035 گرم
      break;
    default:
      grams = value;
  }
  
  // Convert from grams to target unit
  switch (toUnit) {
    case WeightUnit.GRAM:
      return grams;
    case WeightUnit.KILOGRAM:
      return grams / 1000;
    case WeightUnit.MITHQAL:
      return grams / 4.608;
    case WeightUnit.OUNCE:
      return grams / 31.1035;
    default:
      return grams;
  }
};

// ==========================================
// GOLD PRICE CALCULATIONS
// ==========================================

/**
 * Calculate gold price based on weight and carat
 */
export const calculateGoldPrice = (
  weight: number,
  carat: number,
  pricePerGram: number,
  wage: number = 0,
  stonePrice: number = 0
): number => {
  const goldPrice = weight * pricePerGram * (carat / 24);
  return Math.round(goldPrice + wage + stonePrice);
};

/**
 * Calculate gold weight from price
 */
export const calculateGoldWeight = (
  totalPrice: number,
  carat: number,
  pricePerGram: number,
  wage: number = 0,
  stonePrice: number = 0
): number => {
  const priceWithoutExtras = totalPrice - wage - stonePrice;
  const weight = priceWithoutExtras / (pricePerGram * (carat / 24));
  return Math.round(weight * 100) / 100; // Round to 2 decimals
};

/**
 * Calculate carat purity
 */
export const calculateCaratPurity = (carat: number): number => {
  return (carat / 24) * 100;
};

/**
 * Get carat label (Persian)
 */
export const getCaratLabel = (carat: number): string => {
  const labels: Record<number, string> = {
    18: 'هجده عیار (۷۵٪)',
    21: 'بیست و یک عیار (۸۷.۵٪)',
    22: 'بیست و دو عیار (۹۱.۶٪)',
    24: 'بیست و چهار عیار (۹۹.۹٪)'
  };
  
  return labels[carat] || `${toPersianDigits(carat)} عیار`;
};

// ==========================================
// DATE & TIME UTILITIES
// ==========================================

/**
 * Format date to Jalali (Persian) calendar
 */
export const toJalaliDate = (date: Date | string, formatStr: string = 'yyyy/MM/dd'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatJalali(dateObj, formatStr);
};

/**
 * Format date to Jalali with time
 */
export const toJalaliDateTime = (date: Date | string): string => {
  return toJalaliDate(date, 'yyyy/MM/dd - HH:mm:ss');
};

/**
 * Parse Jalali date string to Date object
 */
export const fromJalaliDate = (jalaliStr: string, formatStr: string = 'yyyy/MM/dd'): Date => {
  return parseJalali(jalaliStr, formatStr, new Date());
};

/**
 * Get current Jalali date
 */
export const getCurrentJalaliDate = (): string => {
  return toJalaliDate(new Date());
};

/**
 * Check if date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Get date range (start and end of day)
 */
export const getDateRange = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

/**
 * Get time ago in Persian
 */
export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals: Record<string, number> = {
    سال: 31536000,
    ماه: 2592000,
    هفته: 604800,
    روز: 86400,
    ساعت: 3600,
    دقیقه: 60,
    ثانیه: 1
  };
  
  for (const [name, secondsInInterval] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInInterval);
    if (interval >= 1) {
      return `${toPersianDigits(interval)} ${name} پیش`;
    }
  }
  
  return 'همین الان';
};

// ==========================================
// VALIDATION HELPERS
// ==========================================

/**
 * Validate Iranian National ID (کد ملی)
 */
export const validateNationalId = (nationalId: string): boolean => {
  const cleaned = toEnglishDigits(nationalId).replace(/\D/g, '');
  
  if (cleaned.length !== 10) return false;
  
  const check = parseInt(cleaned[9]!);
  let sum = 0;
  
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]!) * (10 - i);
  }
  
  const remainder = sum % 11;
  
  return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
};

/**
 * Validate Iranian mobile number
 */
export const validateMobileNumber = (mobile: string): boolean => {
  const cleaned = toEnglishDigits(mobile).replace(/\D/g, '');
  return /^09\d{9}$/.test(cleaned);
};

/**
 * Validate email
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate postal code (Iran)
 */
export const validatePostalCode = (postalCode: string): boolean => {
  const cleaned = toEnglishDigits(postalCode).replace(/\D/g, '');
  return /^\d{10}$/.test(cleaned);
};

/**
 * Sanitize phone number (remove spaces, dashes, etc.)
 */
export const sanitizePhoneNumber = (phone: string): string => {
  return toEnglishDigits(phone).replace(/\D/g, '');
};

// ==========================================
// PAGINATION HELPERS
// ==========================================

/**
 * Calculate pagination metadata
 */
export const calculatePagination = (
  total: number,
  page: number = 1,
  limit: number = 10
): IPaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  
  return {
    page: currentPage,
    limit,
    total,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

/**
 * Get pagination offset
 */
export const getPaginationOffset = (page: number, limit: number): number => {
  return (Math.max(1, page) - 1) * limit;
};

// ==========================================
// ARRAY UTILITIES
// ==========================================

/**
 * Remove duplicates from array
 */
export const removeDuplicates = <T>(array: T[]): T[] => {
  return Array.from(new Set(array));
};

/**
 * Chunk array into smaller arrays
 */
export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Group array by key
 */
export const groupBy = <T>(array: T[], key: keyof T): Record<string, T[]> => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

/**
 * Sort array by key
 */
export const sortBy = <T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

// ==========================================
// OBJECT UTILITIES
// ==========================================

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Pick specific keys from object
 */
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> => {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
};

/**
 * Omit specific keys from object
 */
export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach((key) => {
    delete result[key];
  });
  return result as Omit<T, K>;
};

/**
 * Check if object is empty
 */
export const isEmptyObject = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

/**
 * Remove null/undefined values from object
 */
export const removeEmpty = <T extends object>(obj: T): Partial<T> => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
};

// ==========================================
// FILE UTILITIES
// ==========================================

/**
 * Get file extension
 */
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase().replace('.', '');
};

/**
 * Generate unique filename
 */
export const generateUniqueFilename = (originalFilename: string): string => {
  const ext = getFileExtension(originalFilename);
  const timestamp = Date.now();
  const random = generateRandomString(8);
  return `${timestamp}-${random}.${ext}`;
};

/**
 * Check if file exists
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate file type
 */
export const isValidFileType = (
  filename: string,
  allowedTypes: string[]
): boolean => {
  const ext = getFileExtension(filename);
  return allowedTypes.includes(ext);
};

// ==========================================
// ENCRYPTION & HASHING
// ==========================================

/**
 * Generate hash (SHA-256)
 */
export const generateHash = (text: string): string => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Encrypt text (AES-256)
 */
export const encrypt = (text: string, key: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(key.padEnd(32, '0').slice(0, 32)),
    iv
  );
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt text (AES-256)
 */
export const decrypt = (encryptedText: string, key: string): string => {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0]!, 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key.padEnd(32, '0').slice(0, 32)),
    iv
  );
  
  let decrypted = decipher.update(encrypted!, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// ==========================================
// MISCELLANEOUS
// ==========================================

/**
 * Sleep/delay function
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
export const retry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(delay * Math.pow(2, i));
    }
  }
  throw new Error('Max retries reached');
};

/**
 * Safe JSON parse
 */
export const safeJsonParse = <T = any>(json: string, defaultValue: T): T => {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
};

/**
 * Get random item from array
 */
export const randomItem = <T>(array: T[]): T => {
  if (array.length === 0) {
    throw new Error('Cannot get random item from empty array');
  }
  return array[Math.floor(Math.random() * array.length)]!;
};

/**
 * Generate random number in range
 */
export const randomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Check if value is numeric
 */
export const isNumeric = (value: any): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Round to decimal places
 */
export const roundTo = (num: number, decimals: number = 2): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Clamp number between min and max
 */
export const clamp = (num: number, min: number, max: number): number => {
  return Math.min(Math.max(num, min), max);
};

/**
 * Get percentage
 */
export const getPercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return roundTo((value / total) * 100, 2);
};

/**
 * Calculate percentage increase/decrease
 */
export const percentageChange = (oldValue: number, newValue: number): number => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return roundTo(((newValue - oldValue) / oldValue) * 100, 2);
};