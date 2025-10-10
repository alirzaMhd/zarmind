"use strict";
// ==========================================
// ZARMIND - AI Service (OCR, Scale Reading, Vision)
// ==========================================
//
// Responsibilities:
// - Read weight from scale images (photo/screenshot/URL/base64)
// - Preprocess images to improve OCR accuracy
// - Use active OCR provider (Tesseract or Google Vision) with fallback
// - Return normalized result in grams with confidence score
// - Provide simple (placeholder) product detection API surface
//
// Dependencies: ./config/ai, ./services/imageProcessing, sharp
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectProductFromImage = exports.readScaleFromFile = exports.readScale = void 0;
var ai_1 = require("../config/ai");
var imageProcessing_1 = require("./imageProcessing");
var server_1 = require("../config/server");
var logger_1 = require("../utils/logger");
var types_1 = require("../types");
var helpers_1 = require("../utils/helpers");
var DEFAULT_SCALE_OPTIONS = {
    expectedUnit: types_1.WeightUnit.GRAM,
    convertTo: types_1.WeightUnit.GRAM,
    minWeight: 0.01,
    maxWeight: 50000, // 50kg upper bound default
    requireDecimal: false, // jewelry scales often 0.01, but not mandatory
    providerFallback: true,
};
// Ambiguous characters often misread in OCR for seven-segment displays
var OCR_CHAR_MAP = {
    O: '0',
    o: '0',
    Q: '0',
    D: '0',
    S: '5',
    s: '5',
    B: '8',
    I: '1',
    l: '1',
    Z: '2',
    z: '2',
    '،': ',', // Arabic comma
    '٫': '.', // Arabic decimal separator
};
// ==========================================
// PUBLIC: READ SCALE
// ==========================================
/**
 * Read weight value from a scale image (base64/file/url).
 * - Preprocess image for OCR
 * - Use active provider; fallback to alternative if low confidence
 * - Normalize to grams unless specified otherwise
 */
var readScale = function (payload) { return __awaiter(void 0, void 0, void 0, function () {
    var started, preprocessOptions, input, pre, primaryProvider, primaryRes, parsed, confidence, providerUsed, finalText, shouldFallback, secondaryProvider, secondaryRes, parsed2, confidence2, e_1, unit, weight, normalizeTarget, min, max, url, success, response, error_1;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    return __generator(this, function (_s) {
        switch (_s.label) {
            case 0:
                started = Date.now();
                _s.label = 1;
            case 1:
                _s.trys.push([1, 8, , 9]);
                preprocessOptions = {
                    // Reasonable defaults for seven-segment displays
                    resize: (_b = (_a = payload.preprocessingOptions) === null || _a === void 0 ? void 0 : _a.resize) !== null && _b !== void 0 ? _b : true,
                    grayscale: (_d = (_c = payload.preprocessingOptions) === null || _c === void 0 ? void 0 : _c.grayscale) !== null && _d !== void 0 ? _d : true,
                    denoise: (_f = (_e = payload.preprocessingOptions) === null || _e === void 0 ? void 0 : _e.denoise) !== null && _f !== void 0 ? _f : true,
                    contrast: (_h = (_g = payload.preprocessingOptions) === null || _g === void 0 ? void 0 : _g.contrast) !== null && _h !== void 0 ? _h : true,
                    sharpen: (_k = (_j = payload.preprocessingOptions) === null || _j === void 0 ? void 0 : _j.sharpen) !== null && _k !== void 0 ? _k : true,
                    threshold: (_m = (_l = payload.preprocessingOptions) === null || _l === void 0 ? void 0 : _l.threshold) !== null && _m !== void 0 ? _m : true,
                    trim: true,
                    rotateAuto: true,
                    saveProcessed: true,
                    debugDir: server_1.UPLOAD_CONFIG.SCALE_PATH,
                    processedPrefix: 'scale',
                };
                input = {
                    image: payload.image,
                    imageType: payload.imageType || guessInputType(payload.image),
                };
                return [4 /*yield*/, (0, imageProcessing_1.prepareImageForOCR)(input, preprocessOptions, true)];
            case 2:
                pre = _s.sent();
                primaryProvider = (0, ai_1.getActiveProvider)();
                return [4 /*yield*/, runOcr(pre.processedBuffer, primaryProvider)];
            case 3:
                primaryRes = _s.sent();
                parsed = parseWeightFromText(primaryRes.text, {
                    expectedUnit: payload.expectedUnit || DEFAULT_SCALE_OPTIONS.expectedUnit,
                    requireDecimal: (_o = payload.requireDecimal) !== null && _o !== void 0 ? _o : DEFAULT_SCALE_OPTIONS.requireDecimal,
                });
                confidence = estimateConfidence((_p = primaryRes.confidence) !== null && _p !== void 0 ? _p : 0, parsed);
                providerUsed = primaryProvider;
                finalText = primaryRes.text;
                shouldFallback = (!parsed.weight || confidence < 0.6) &&
                    DEFAULT_SCALE_OPTIONS.providerFallback &&
                    (primaryProvider === 'tesseract' ? (0, ai_1.isVisionEnabled)() : true);
                if (!shouldFallback) return [3 /*break*/, 7];
                secondaryProvider = primaryProvider === 'tesseract' ? 'google-vision' : 'tesseract';
                _s.label = 4;
            case 4:
                _s.trys.push([4, 6, , 7]);
                return [4 /*yield*/, runOcr(pre.processedBuffer, secondaryProvider)];
            case 5:
                secondaryRes = _s.sent();
                parsed2 = parseWeightFromText(secondaryRes.text, {
                    expectedUnit: payload.expectedUnit || DEFAULT_SCALE_OPTIONS.expectedUnit,
                    requireDecimal: (_q = payload.requireDecimal) !== null && _q !== void 0 ? _q : DEFAULT_SCALE_OPTIONS.requireDecimal,
                });
                confidence2 = estimateConfidence((_r = secondaryRes.confidence) !== null && _r !== void 0 ? _r : 0, parsed2);
                if (confidence2 > confidence) {
                    parsed = parsed2;
                    confidence = confidence2;
                    providerUsed = secondaryProvider;
                    finalText = secondaryRes.text;
                }
                return [3 /*break*/, 7];
            case 6:
                e_1 = _s.sent();
                return [3 /*break*/, 7];
            case 7:
                unit = parsed.unit || payload.expectedUnit || types_1.WeightUnit.GRAM;
                weight = parsed.weight;
                if (typeof weight === 'number') {
                    normalizeTarget = payload.convertTo || DEFAULT_SCALE_OPTIONS.convertTo || types_1.WeightUnit.GRAM;
                    if (unit !== normalizeTarget) {
                        weight = convertWeight(weight, unit, normalizeTarget);
                        unit = normalizeTarget;
                    }
                }
                if (typeof weight === 'number') {
                    min = DEFAULT_SCALE_OPTIONS.minWeight;
                    max = DEFAULT_SCALE_OPTIONS.maxWeight;
                    if (weight < min || weight > max) {
                        confidence = Math.min(confidence, 0.4);
                    }
                }
                url = toUploadsUrl(pre.processedPath);
                success = typeof weight === 'number' && weight > 0;
                response = {
                    success: success,
                    weight: weight,
                    unit: unit,
                    confidence: round2(confidence),
                    rawText: finalText,
                    processedImageUrl: url,
                    error: success ? undefined : 'نتوانستیم وزن را با اطمینان استخراج کنیم',
                };
                (0, logger_1.logAI)('scale-read', success, confidence, Date.now() - started, {
                    provider: providerUsed,
                    unit: unit,
                    weight: weight,
                    url: url,
                });
                return [2 /*return*/, response];
            case 8:
                error_1 = _s.sent();
                logger_1.default.error('readScale failed', { error: error_1 });
                return [2 /*return*/, {
                        success: false,
                        error: error_1.message || 'خطای پردازش تصویر',
                    }];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.readScale = readScale;
/**
 * Convenience wrapper for reading scale from an uploaded file (multer).
 */
var readScaleFromFile = function (file, options) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, (0, exports.readScale)(__assign(__assign({ image: file.path, imageType: 'file', preprocessingOptions: options === null || options === void 0 ? void 0 : options.preprocessingOptions }, ((options === null || options === void 0 ? void 0 : options.expectedUnit) ? { expectedUnit: options.expectedUnit } : {})), ((options === null || options === void 0 ? void 0 : options.convertTo) ? { convertTo: options.convertTo } : {})))];
    });
}); };
exports.readScaleFromFile = readScaleFromFile;
// ==========================================
// PUBLIC: PRODUCT DETECTION (PLACEHOLDER)
// ==========================================
/**
 * Detect product type/category from image (placeholder).
 * This can be implemented using a custom model or Vision object detection.
 */
var detectProductFromImage = function (input) { return __awaiter(void 0, void 0, void 0, function () {
    var pre, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, imageProcessing_1.prepareImageForOCR)(input, { saveProcessed: true }, false)];
            case 1:
                pre = _a.sent();
                return [2 /*return*/, {
                        image: pre.processedPath || '',
                        detected_type: undefined,
                        detected_category: undefined,
                        confidence: 0.0,
                        suggestions: [
                            'ring',
                            'necklace',
                            'bracelet',
                            'earring',
                            'bangle',
                            'pendant',
                            'coin',
                            'bar',
                        ],
                    }];
            case 2:
                error_2 = _a.sent();
                logger_1.default.error('detectProductFromImage failed', { error: error_2 });
                return [2 /*return*/, {
                        image: input.image,
                        detected_type: undefined,
                        detected_category: undefined,
                        confidence: 0.0,
                        suggestions: [],
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.detectProductFromImage = detectProductFromImage;
// ==========================================
// INTERNAL: OCR RUNNER
// ==========================================
var runOcr = function (image, provider) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (provider === 'tesseract') {
            return [2 /*return*/, (0, ai_1.ocrWithTesseract)(image)];
        }
        if (provider === 'google-vision') {
            return [2 /*return*/, (0, ai_1.ocrWithVision)(image)];
        }
        return [2 /*return*/, (0, ai_1.ocr)(image)];
    });
}); };
// ==========================================
// INTERNAL: TEXT PARSING
// ==========================================
/**
 * Parse numeric weight and unit (g, kg, mithqal, ounce) from OCR text.
 * Heuristics:
 * - Normalize Persian/Arabic digits
 * - Correct common OCR misreads (O=>0, S=>5, I/l=>1, B=>8, Z=>2)
 * - Prefer numbers with decimals if requireDecimal = true
 * - Use nearby unit keywords (g, gr, kg, مثقال, اونس, oz)
 */
var parseWeightFromText = function (text, options) {
    var _a;
    var cleaned = normalizeOcrText(text);
    var tokens = numberCandidates(cleaned);
    var unitDetected = detectUnit(cleaned, tokens.indexOf(tokens[0]));
    // Candidate selection
    var preferred = pickBestCandidate(tokens, {
        requireDecimal: (_a = options === null || options === void 0 ? void 0 : options.requireDecimal) !== null && _a !== void 0 ? _a : false,
    });
    var unit = detectUnit(cleaned) || (options === null || options === void 0 ? void 0 : options.expectedUnit) || types_1.WeightUnit.GRAM;
    var weight = preferred;
    // Adjust by unit hints in the text
    var unitFromText = detectUnit(cleaned);
    if (unitFromText) {
        unit = unitFromText;
    }
    // If the detected unit is kg/ounce/mithqal -> conversion handled outside
    return { weight: weight, unit: unit, candidates: tokens, unitDetected: unitFromText ? unitFromText : undefined };
};
/**
 * Normalize OCR text: Persian digits -> English, common OCR confusions fixed, unify separators.
 */
var normalizeOcrText = function (text) {
    // Replace Persian digits to English
    var s = (0, helpers_1.toEnglishDigits)(text || '');
    // Map common OCR mistakes
    s = s
        .split('')
        .map(function (ch) { var _a; return (_a = OCR_CHAR_MAP[ch]) !== null && _a !== void 0 ? _a : ch; })
        .join('');
    // Normalize separators
    s = s.replace(/[٬,]/g, ','); // thousands separator
    s = s.replace(/[٫]/g, '.'); // decimal separator
    // Collapse multiple spaces
    s = s.replace(/\s+/g, ' ').trim();
    return s;
};
/**
 * Extract plausible numeric candidates from text.
 */
var numberCandidates = function (text) {
    var candidates = [];
    // Convert all commas that are thousands separators to nothing and keep decimals as dot
    // First, create a working copy where commas that are followed by 3 digits act as thousands separators
    var work = text.replace(/(\d),(?=\d{3}(\D|$))/g, '$1'); // remove thousand commas
    work = work.replace(/,/g, '.'); // any remaining comma -> dot
    // Replace any stray non-numeric/non-dot with space, then split
    work = work.replace(/[^0-9.\-]+/g, ' ');
    var parts = work.split(' ').filter(Boolean);
    for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
        var p = parts_1[_i];
        if (!p)
            continue;
        // Keep at most one dot and optional leading minus
        var m = p.match(/^-?\d+(?:\.\d+)?$/);
        if (m) {
            var n = parseFloat(m[0]);
            if (isFinite(n)) {
                candidates.push(n);
            }
        }
    }
    // De-duplicate and sort by "preference": decimals first, then by descending value
    var unique = Array.from(new Set(candidates));
    unique.sort(function (a, b) {
        var aDec = hasDecimal(a);
        var bDec = hasDecimal(b);
        if (aDec !== bDec)
            return aDec ? -1 : 1; // decimals first
        return b > a ? 1 : -1; // larger values next
    });
    return unique;
};
var pickBestCandidate = function (cands, opts) {
    if (!cands.length)
        return undefined;
    if (opts.requireDecimal) {
        var withDec = cands.filter(function (n) { return hasDecimal(n); });
        if (withDec.length) {
            return withDec[0];
        }
    }
    return cands[0];
};
var hasDecimal = function (n) { return Math.abs(n % 1) > 0.000001; };
/**
 * Detect unit keywords from the text.
 */
var detectUnit = function (text, _idx) {
    var t = text.toLowerCase();
    // grams
    if (/\b(g|gr|grams?)\b/.test(t) || /گرم/.test(t)) {
        return types_1.WeightUnit.GRAM;
    }
    // kilograms
    if (/\b(kg|kilograms?)\b/.test(t) || /کیلو/.test(t)) {
        return types_1.WeightUnit.KILOGRAM;
    }
    // mithqal (مثقال)
    if (/مثقال/.test(t) || /\bmith?q(al)?\b/.test(t)) {
        return types_1.WeightUnit.MITHQAL;
    }
    // ounce (troy)
    if (/\b(oz|ozt|ounce)\b/.test(t) || /اونس/.test(t)) {
        return types_1.WeightUnit.OUNCE;
    }
    return undefined;
};
// ==========================================
// INTERNAL: UNIT CONVERSION & CONFIDENCE
// ==========================================
/**
 * Convert weight between units to grams (default) or others.
 */
var convertWeight = function (value, fromUnit, toUnit) {
    if (fromUnit === toUnit)
        return value;
    // Convert source to grams
    var grams = value;
    switch (fromUnit) {
        case types_1.WeightUnit.KILOGRAM:
            grams = value * 1000;
            break;
        case types_1.WeightUnit.MITHQAL:
            grams = value * 4.608;
            break;
        case types_1.WeightUnit.OUNCE:
            grams = value * 31.1035;
            break;
        case types_1.WeightUnit.GRAM:
        default:
            grams = value;
    }
    // Convert grams -> target
    switch (toUnit) {
        case types_1.WeightUnit.KILOGRAM:
            return grams / 1000;
        case types_1.WeightUnit.MITHQAL:
            return grams / 4.608;
        case types_1.WeightUnit.OUNCE:
            return grams / 31.1035;
        case types_1.WeightUnit.GRAM:
        default:
            return grams;
    }
};
var estimateConfidence = function (providerConfidence, parsed) {
    var score = providerConfidence || 0.5;
    // Bonus if we found a numeric value
    if (typeof parsed.weight === 'number')
        score += 0.2;
    // Bonus if unit detected
    if (parsed.unit)
        score += 0.05;
    // Penalize multiple candidates (ambiguity)
    var cands = parsed.candidates || [];
    if (cands.length > 1)
        score -= Math.min(0.1, (cands.length - 1) * 0.03);
    // Favor 2 or 3 decimal places (common for jewelry scales)
    if (typeof parsed.weight === 'number') {
        var decimals = decimalPlaces(parsed.weight);
        if (decimals === 2 || decimals === 3)
            score += 0.05;
    }
    // Clamp to [0,1]
    score = Math.max(0, Math.min(1, score));
    return score;
};
var decimalPlaces = function (n) {
    var s = n.toString();
    var idx = s.indexOf('.');
    return idx === -1 ? 0 : s.length - idx - 1;
};
var round2 = function (n) { return (typeof n === 'number' ? Math.round(n * 100) / 100 : undefined); };
// Convert a file path under uploads/* to a public URL (/uploads/...)
var toUploadsUrl = function (filePath) {
    if (!filePath)
        return undefined;
    var norm = filePath.replace(/\\/g, '/');
    var idx = norm.lastIndexOf('/uploads/');
    if (idx >= 0) {
        return norm.substring(idx);
    }
    if (norm.startsWith('uploads/')) {
        return '/' + norm;
    }
    // If saved in scale path, build relative
    if (norm.includes(server_1.UPLOAD_CONFIG.SCALE_PATH)) {
        var base = norm.substring(norm.indexOf(server_1.UPLOAD_CONFIG.SCALE_PATH));
        return '/' + base;
    }
    // Fallback: return original
    return norm;
};
// Guess input type when not provided explicitly
var guessInputType = function (image) {
    if (!image)
        return 'file';
    if (image.startsWith('http://') || image.startsWith('https://'))
        return 'url';
    if (image.startsWith('data:image/'))
        return 'base64';
    return 'file';
};
// ==========================================
// EXPORTS (default grouped)
// ==========================================
exports.default = {
    readScale: exports.readScale,
    readScaleFromFile: exports.readScaleFromFile,
    detectProductFromImage: exports.detectProductFromImage,
};
