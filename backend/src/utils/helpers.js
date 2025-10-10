"use strict";
// ==========================================
// ZARMIND - Helper Functions
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidFileType = exports.formatFileSize = exports.fileExists = exports.generateUniqueFilename = exports.getFileExtension = exports.removeEmpty = exports.isEmptyObject = exports.omit = exports.pick = exports.deepClone = exports.sortBy = exports.groupBy = exports.chunkArray = exports.removeDuplicates = exports.getPaginationOffset = exports.calculatePagination = exports.sanitizePhoneNumber = exports.validatePostalCode = exports.validateEmail = exports.validateMobileNumber = exports.validateNationalId = exports.getTimeAgo = exports.getDateRange = exports.isToday = exports.getCurrentJalaliDate = exports.fromJalaliDate = exports.toJalaliDateTime = exports.toJalaliDate = exports.getCaratLabel = exports.calculateCaratPurity = exports.calculateGoldWeight = exports.calculateGoldPrice = exports.convertWeight = exports.formatWeight = exports.parsePrice = exports.tomanToRial = exports.rialToToman = exports.formatPrice = exports.formatNumber = exports.sanitizePersian = exports.toPersianDigits = exports.toEnglishDigits = exports.snakeToCamel = exports.camelToSnake = exports.capitalize = exports.truncate = exports.slugify = exports.generateUniqueCode = exports.generateUUID = exports.generateRandomString = void 0;
exports.percentageChange = exports.getPercentage = exports.clamp = exports.roundTo = exports.isNumeric = exports.randomNumber = exports.randomItem = exports.safeJsonParse = exports.retry = exports.sleep = exports.decrypt = exports.encrypt = exports.generateHash = void 0;
var crypto = require("crypto");
var date_fns_jalali_1 = require("date-fns-jalali");
var uuid_1 = require("uuid");
var path = require("path");
var fs = require("fs/promises");
var types_1 = require("../types");
// ==========================================
// STRING UTILITIES
// ==========================================
/**
 * Generate a random string
 */
var generateRandomString = function (length) {
    if (length === void 0) { length = 32; }
    return crypto.randomBytes(length).toString('hex').slice(0, length);
};
exports.generateRandomString = generateRandomString;
/**
 * Generate UUID
 */
var generateUUID = function () {
    return (0, uuid_1.v4)();
};
exports.generateUUID = generateUUID;
/**
 * Generate unique code with prefix
 */
var generateUniqueCode = function (prefix, length) {
    if (length === void 0) { length = 8; }
    var timestamp = Date.now().toString(36).toUpperCase();
    var random = (0, exports.generateRandomString)(length).toUpperCase();
    return "".concat(prefix, "-").concat(timestamp, "-").concat(random.slice(0, 4));
};
exports.generateUniqueCode = generateUniqueCode;
/**
 * Slugify string (convert to URL-friendly format)
 */
var slugify = function (text) {
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
exports.slugify = slugify;
/**
 * Truncate string with ellipsis
 */
var truncate = function (text, length, suffix) {
    if (suffix === void 0) { suffix = '...'; }
    if (text.length <= length)
        return text;
    return text.slice(0, length - suffix.length) + suffix;
};
exports.truncate = truncate;
/**
 * Capitalize first letter
 */
var capitalize = function (text) {
    if (!text)
        return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};
exports.capitalize = capitalize;
/**
 * Convert camelCase to snake_case
 */
var camelToSnake = function (str) {
    return str.replace(/[A-Z]/g, function (letter) { return "_".concat(letter.toLowerCase()); });
};
exports.camelToSnake = camelToSnake;
/**
 * Convert snake_case to camelCase
 */
var snakeToCamel = function (str) {
    return str.replace(/_([a-z])/g, function (_, letter) { return letter.toUpperCase(); });
};
exports.snakeToCamel = snakeToCamel;
// ==========================================
// PERSIAN/ARABIC UTILITIES
// ==========================================
/**
 * Convert Persian/Arabic digits to English
 */
var toEnglishDigits = function (str) {
    var persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    var arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    var englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    var result = str;
    for (var i = 0; i < 10; i++) {
        result = result.replace(new RegExp(persianDigits[i], 'g'), englishDigits[i]);
        result = result.replace(new RegExp(arabicDigits[i], 'g'), englishDigits[i]);
    }
    return result;
};
exports.toEnglishDigits = toEnglishDigits;
/**
 * Convert English digits to Persian
 */
var toPersianDigits = function (str) {
    var persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(str).replace(/\d/g, function (digit) { return persianDigits[parseInt(digit)]; });
};
exports.toPersianDigits = toPersianDigits;
/**
 * Sanitize Persian text (normalize characters)
 */
var sanitizePersian = function (text) {
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
exports.sanitizePersian = sanitizePersian;
// ==========================================
// NUMBER & PRICE FORMATTING
// ==========================================
/**
 * Format number with thousand separators (Persian style)
 */
var formatNumber = function (num, locale) {
    if (locale === void 0) { locale = 'fa-IR'; }
    var number = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(number))
        return '0';
    return new Intl.NumberFormat(locale).format(number);
};
exports.formatNumber = formatNumber;
/**
 * Format price with currency (Toman/Rial)
 */
var formatPrice = function (amount, currency, usePersianDigits) {
    if (currency === void 0) { currency = 'تومان'; }
    if (usePersianDigits === void 0) { usePersianDigits = true; }
    var formatted = (0, exports.formatNumber)(amount);
    var withCurrency = "".concat(formatted, " ").concat(currency);
    return usePersianDigits ? (0, exports.toPersianDigits)(withCurrency) : withCurrency;
};
exports.formatPrice = formatPrice;
/**
 * Convert Rial to Toman
 */
var rialToToman = function (rial) {
    return Math.floor(rial / 10);
};
exports.rialToToman = rialToToman;
/**
 * Convert Toman to Rial
 */
var tomanToRial = function (toman) {
    return toman * 10;
};
exports.tomanToRial = tomanToRial;
/**
 * Parse price string to number (remove separators and text)
 */
var parsePrice = function (priceStr) {
    var cleaned = (0, exports.toEnglishDigits)(priceStr)
        .replace(/[^\d.-]/g, '')
        .trim();
    return parseFloat(cleaned) || 0;
};
exports.parsePrice = parsePrice;
/**
 * Format weight with unit
 */
var formatWeight = function (weight, unit) {
    var _a;
    if (unit === void 0) { unit = types_1.WeightUnit.GRAM; }
    var unitLabels = (_a = {},
        _a[types_1.WeightUnit.GRAM] = 'گرم',
        _a[types_1.WeightUnit.KILOGRAM] = 'کیلوگرم',
        _a[types_1.WeightUnit.MITHQAL] = 'مثقال',
        _a[types_1.WeightUnit.OUNCE] = 'اونس',
        _a);
    return "".concat((0, exports.toPersianDigits)(weight.toFixed(2)), " ").concat(unitLabels[unit]);
};
exports.formatWeight = formatWeight;
// ==========================================
// WEIGHT CONVERSION
// ==========================================
/**
 * Convert weight between units
 */
var convertWeight = function (value, fromUnit, toUnit) {
    // Convert to grams first
    var grams;
    switch (fromUnit) {
        case types_1.WeightUnit.GRAM:
            grams = value;
            break;
        case types_1.WeightUnit.KILOGRAM:
            grams = value * 1000;
            break;
        case types_1.WeightUnit.MITHQAL:
            grams = value * 4.608; // 1 مثقال = 4.608 گرم
            break;
        case types_1.WeightUnit.OUNCE:
            grams = value * 31.1035; // 1 troy ounce = 31.1035 گرم
            break;
        default:
            grams = value;
    }
    // Convert from grams to target unit
    switch (toUnit) {
        case types_1.WeightUnit.GRAM:
            return grams;
        case types_1.WeightUnit.KILOGRAM:
            return grams / 1000;
        case types_1.WeightUnit.MITHQAL:
            return grams / 4.608;
        case types_1.WeightUnit.OUNCE:
            return grams / 31.1035;
        default:
            return grams;
    }
};
exports.convertWeight = convertWeight;
// ==========================================
// GOLD PRICE CALCULATIONS
// ==========================================
/**
 * Calculate gold price based on weight and carat
 */
var calculateGoldPrice = function (weight, carat, pricePerGram, wage, stonePrice) {
    if (wage === void 0) { wage = 0; }
    if (stonePrice === void 0) { stonePrice = 0; }
    var goldPrice = weight * pricePerGram * (carat / 24);
    return Math.round(goldPrice + wage + stonePrice);
};
exports.calculateGoldPrice = calculateGoldPrice;
/**
 * Calculate gold weight from price
 */
var calculateGoldWeight = function (totalPrice, carat, pricePerGram, wage, stonePrice) {
    if (wage === void 0) { wage = 0; }
    if (stonePrice === void 0) { stonePrice = 0; }
    var priceWithoutExtras = totalPrice - wage - stonePrice;
    var weight = priceWithoutExtras / (pricePerGram * (carat / 24));
    return Math.round(weight * 100) / 100; // Round to 2 decimals
};
exports.calculateGoldWeight = calculateGoldWeight;
/**
 * Calculate carat purity
 */
var calculateCaratPurity = function (carat) {
    return (carat / 24) * 100;
};
exports.calculateCaratPurity = calculateCaratPurity;
/**
 * Get carat label (Persian)
 */
var getCaratLabel = function (carat) {
    var labels = {
        18: 'هجده عیار (۷۵٪)',
        21: 'بیست و یک عیار (۸۷.۵٪)',
        22: 'بیست و دو عیار (۹۱.۶٪)',
        24: 'بیست و چهار عیار (۹۹.۹٪)'
    };
    return labels[carat] || "".concat((0, exports.toPersianDigits)(carat), " \u0639\u06CC\u0627\u0631");
};
exports.getCaratLabel = getCaratLabel;
// ==========================================
// DATE & TIME UTILITIES
// ==========================================
/**
 * Format date to Jalali (Persian) calendar
 */
var toJalaliDate = function (date, formatStr) {
    if (formatStr === void 0) { formatStr = 'yyyy/MM/dd'; }
    var dateObj = typeof date === 'string' ? new Date(date) : date;
    return (0, date_fns_jalali_1.format)(dateObj, formatStr);
};
exports.toJalaliDate = toJalaliDate;
/**
 * Format date to Jalali with time
 */
var toJalaliDateTime = function (date) {
    return (0, exports.toJalaliDate)(date, 'yyyy/MM/dd - HH:mm:ss');
};
exports.toJalaliDateTime = toJalaliDateTime;
/**
 * Parse Jalali date string to Date object
 */
var fromJalaliDate = function (jalaliStr, formatStr) {
    if (formatStr === void 0) { formatStr = 'yyyy/MM/dd'; }
    return (0, date_fns_jalali_1.parse)(jalaliStr, formatStr, new Date());
};
exports.fromJalaliDate = fromJalaliDate;
/**
 * Get current Jalali date
 */
var getCurrentJalaliDate = function () {
    return (0, exports.toJalaliDate)(new Date());
};
exports.getCurrentJalaliDate = getCurrentJalaliDate;
/**
 * Check if date is today
 */
var isToday = function (date) {
    var today = new Date();
    return (date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear());
};
exports.isToday = isToday;
/**
 * Get date range (start and end of day)
 */
var getDateRange = function (date) {
    var start = new Date(date);
    start.setHours(0, 0, 0, 0);
    var end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start: start, end: end };
};
exports.getDateRange = getDateRange;
/**
 * Get time ago in Persian
 */
var getTimeAgo = function (date) {
    var now = new Date();
    var seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    var intervals = {
        سال: 31536000,
        ماه: 2592000,
        هفته: 604800,
        روز: 86400,
        ساعت: 3600,
        دقیقه: 60,
        ثانیه: 1
    };
    for (var _i = 0, _a = Object.entries(intervals); _i < _a.length; _i++) {
        var _b = _a[_i], name_1 = _b[0], secondsInInterval = _b[1];
        var interval = Math.floor(seconds / secondsInInterval);
        if (interval >= 1) {
            return "".concat((0, exports.toPersianDigits)(interval), " ").concat(name_1, " \u067E\u06CC\u0634");
        }
    }
    return 'همین الان';
};
exports.getTimeAgo = getTimeAgo;
// ==========================================
// VALIDATION HELPERS
// ==========================================
/**
 * Validate Iranian National ID (کد ملی)
 */
var validateNationalId = function (nationalId) {
    var cleaned = (0, exports.toEnglishDigits)(nationalId).replace(/\D/g, '');
    if (cleaned.length !== 10)
        return false;
    var check = parseInt(cleaned[9]);
    var sum = 0;
    for (var i = 0; i < 9; i++) {
        sum += parseInt(cleaned[i]) * (10 - i);
    }
    var remainder = sum % 11;
    return (remainder < 2 && check === remainder) || (remainder >= 2 && check === 11 - remainder);
};
exports.validateNationalId = validateNationalId;
/**
 * Validate Iranian mobile number
 */
var validateMobileNumber = function (mobile) {
    var cleaned = (0, exports.toEnglishDigits)(mobile).replace(/\D/g, '');
    return /^09\d{9}$/.test(cleaned);
};
exports.validateMobileNumber = validateMobileNumber;
/**
 * Validate email
 */
var validateEmail = function (email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
/**
 * Validate postal code (Iran)
 */
var validatePostalCode = function (postalCode) {
    var cleaned = (0, exports.toEnglishDigits)(postalCode).replace(/\D/g, '');
    return /^\d{10}$/.test(cleaned);
};
exports.validatePostalCode = validatePostalCode;
/**
 * Sanitize phone number (remove spaces, dashes, etc.)
 */
var sanitizePhoneNumber = function (phone) {
    return (0, exports.toEnglishDigits)(phone).replace(/\D/g, '');
};
exports.sanitizePhoneNumber = sanitizePhoneNumber;
// ==========================================
// PAGINATION HELPERS
// ==========================================
/**
 * Calculate pagination metadata
 */
var calculatePagination = function (total, page, limit) {
    if (page === void 0) { page = 1; }
    if (limit === void 0) { limit = 10; }
    var totalPages = Math.ceil(total / limit);
    var currentPage = Math.max(1, Math.min(page, totalPages));
    return {
        page: currentPage,
        limit: limit,
        total: total,
        totalPages: totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1
    };
};
exports.calculatePagination = calculatePagination;
/**
 * Get pagination offset
 */
var getPaginationOffset = function (page, limit) {
    return (Math.max(1, page) - 1) * limit;
};
exports.getPaginationOffset = getPaginationOffset;
// ==========================================
// ARRAY UTILITIES
// ==========================================
/**
 * Remove duplicates from array
 */
var removeDuplicates = function (array) {
    return Array.from(new Set(array));
};
exports.removeDuplicates = removeDuplicates;
/**
 * Chunk array into smaller arrays
 */
var chunkArray = function (array, size) {
    var chunks = [];
    for (var i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};
exports.chunkArray = chunkArray;
/**
 * Group array by key
 */
var groupBy = function (array, key) {
    return array.reduce(function (result, item) {
        var groupKey = String(item[key]);
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
};
exports.groupBy = groupBy;
/**
 * Sort array by key
 */
var sortBy = function (array, key, order) {
    if (order === void 0) { order = 'asc'; }
    return __spreadArray([], array, true).sort(function (a, b) {
        var aVal = a[key];
        var bVal = b[key];
        if (aVal < bVal)
            return order === 'asc' ? -1 : 1;
        if (aVal > bVal)
            return order === 'asc' ? 1 : -1;
        return 0;
    });
};
exports.sortBy = sortBy;
// ==========================================
// OBJECT UTILITIES
// ==========================================
/**
 * Deep clone object
 */
var deepClone = function (obj) {
    return JSON.parse(JSON.stringify(obj));
};
exports.deepClone = deepClone;
/**
 * Pick specific keys from object
 */
var pick = function (obj, keys) {
    var result = {};
    keys.forEach(function (key) {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
};
exports.pick = pick;
/**
 * Omit specific keys from object
 */
var omit = function (obj, keys) {
    var result = __assign({}, obj);
    keys.forEach(function (key) {
        delete result[key];
    });
    return result;
};
exports.omit = omit;
/**
 * Check if object is empty
 */
var isEmptyObject = function (obj) {
    return Object.keys(obj).length === 0;
};
exports.isEmptyObject = isEmptyObject;
/**
 * Remove null/undefined values from object
 */
var removeEmpty = function (obj) {
    return Object.entries(obj).reduce(function (acc, _a) {
        var key = _a[0], value = _a[1];
        if (value !== null && value !== undefined) {
            acc[key] = value;
        }
        return acc;
    }, {});
};
exports.removeEmpty = removeEmpty;
// ==========================================
// FILE UTILITIES
// ==========================================
/**
 * Get file extension
 */
var getFileExtension = function (filename) {
    return path.extname(filename).toLowerCase().replace('.', '');
};
exports.getFileExtension = getFileExtension;
/**
 * Generate unique filename
 */
var generateUniqueFilename = function (originalFilename) {
    var ext = (0, exports.getFileExtension)(originalFilename);
    var timestamp = Date.now();
    var random = (0, exports.generateRandomString)(8);
    return "".concat(timestamp, "-").concat(random, ".").concat(ext);
};
exports.generateUniqueFilename = generateUniqueFilename;
/**
 * Check if file exists
 */
var fileExists = function (filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs.access(filePath)];
            case 1:
                _b.sent();
                return [2 /*return*/, true];
            case 2:
                _a = _b.sent();
                return [2 /*return*/, false];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.fileExists = fileExists;
/**
 * Get file size in human-readable format
 */
var formatFileSize = function (bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0)
        return '0 Bytes';
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};
exports.formatFileSize = formatFileSize;
/**
 * Validate file type
 */
var isValidFileType = function (filename, allowedTypes) {
    var ext = (0, exports.getFileExtension)(filename);
    return allowedTypes.includes(ext);
};
exports.isValidFileType = isValidFileType;
// ==========================================
// ENCRYPTION & HASHING
// ==========================================
/**
 * Generate hash (SHA-256)
 */
var generateHash = function (text) {
    return crypto.createHash('sha256').update(text).digest('hex');
};
exports.generateHash = generateHash;
/**
 * Encrypt text (AES-256)
 */
var encrypt = function (text, key) {
    var iv = crypto.randomBytes(16);
    var cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').slice(0, 32)), iv);
    var encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
};
exports.encrypt = encrypt;
/**
 * Decrypt text (AES-256)
 */
var decrypt = function (encryptedText, key) {
    var parts = encryptedText.split(':');
    var iv = Buffer.from(parts[0], 'hex');
    var encrypted = parts[1];
    var decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').slice(0, 32)), iv);
    var decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
exports.decrypt = decrypt;
// ==========================================
// MISCELLANEOUS
// ==========================================
/**
 * Sleep/delay function
 */
var sleep = function (ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
};
exports.sleep = sleep;
/**
 * Retry function with exponential backoff
 */
var retry = function (fn_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([fn_1], args_1, true), void 0, function (fn, maxRetries, delay) {
        var i, error_1;
        if (maxRetries === void 0) { maxRetries = 3; }
        if (delay === void 0) { delay = 1000; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < maxRetries)) return [3 /*break*/, 7];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 6]);
                    return [4 /*yield*/, fn()];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    error_1 = _a.sent();
                    if (i === maxRetries - 1)
                        throw error_1;
                    return [4 /*yield*/, (0, exports.sleep)(delay * Math.pow(2, i))];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 6:
                    i++;
                    return [3 /*break*/, 1];
                case 7: throw new Error('Max retries reached');
            }
        });
    });
};
exports.retry = retry;
/**
 * Safe JSON parse
 */
var safeJsonParse = function (json, defaultValue) {
    try {
        return JSON.parse(json);
    }
    catch (_a) {
        return defaultValue;
    }
};
exports.safeJsonParse = safeJsonParse;
/**
 * Get random item from array
 */
var randomItem = function (array) {
    return array[Math.floor(Math.random() * array.length)];
};
exports.randomItem = randomItem;
/**
 * Generate random number in range
 */
var randomNumber = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
exports.randomNumber = randomNumber;
/**
 * Check if value is numeric
 */
var isNumeric = function (value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
};
exports.isNumeric = isNumeric;
/**
 * Round to decimal places
 */
var roundTo = function (num, decimals) {
    if (decimals === void 0) { decimals = 2; }
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};
exports.roundTo = roundTo;
/**
 * Clamp number between min and max
 */
var clamp = function (num, min, max) {
    return Math.min(Math.max(num, min), max);
};
exports.clamp = clamp;
/**
 * Get percentage
 */
var getPercentage = function (value, total) {
    if (total === 0)
        return 0;
    return (0, exports.roundTo)((value / total) * 100, 2);
};
exports.getPercentage = getPercentage;
/**
 * Calculate percentage increase/decrease
 */
var percentageChange = function (oldValue, newValue) {
    if (oldValue === 0)
        return newValue > 0 ? 100 : 0;
    return (0, exports.roundTo)(((newValue - oldValue) / oldValue) * 100, 2);
};
exports.percentageChange = percentageChange;
