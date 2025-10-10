"use strict";
// ==========================================
// ZARMIND - Image Processing Service (Sharp + Utils)
// ==========================================
//
// Purpose:
// - Load images from file/base64/url into Buffer
// - Preprocess images to improve OCR accuracy (scale reading, receipts, docs)
// - Save optimized/processed images to disk (temp or dedicated folders)
// - Lightweight helpers for common pipelines
//
// Dependencies: sharp, axios
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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeGenericImage = exports.prepareImageForOCR = exports.preprocessForOCR = exports.saveBufferAsImage = exports.loadImageBuffer = void 0;
var fs = require("fs/promises");
var path = require("path");
var axios_1 = require("axios");
var sharp = require("sharp");
var server_1 = require("../config/server");
var logger_1 = require("../utils/logger");
var helpers_1 = require("../utils/helpers");
// ==========================================
// CONSTANTS / DEFAULTS
// ==========================================
var DEFAULTS = {
    resizeWidth: server_1.AI_CONFIG.IMAGE_PREPROCESSING.RESIZE_WIDTH || 1200,
    grayscale: (_a = server_1.AI_CONFIG.IMAGE_PREPROCESSING.GRAYSCALE) !== null && _a !== void 0 ? _a : true,
    normalize: (_b = server_1.AI_CONFIG.IMAGE_PREPROCESSING.NORMALIZE) !== null && _b !== void 0 ? _b : true,
    sharpen: (_c = server_1.AI_CONFIG.IMAGE_PREPROCESSING.SHARPEN) !== null && _c !== void 0 ? _c : true,
    denoise: (_d = server_1.AI_CONFIG.IMAGE_PREPROCESSING.DENOISE) !== null && _d !== void 0 ? _d : true,
};
// Ensure target directories exist at import time
var ensureDir = function (dir) { return __awaiter(void 0, void 0, void 0, function () {
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, fs.mkdir(dir, { recursive: true })];
            case 1:
                _b.sent();
                return [3 /*break*/, 3];
            case 2:
                _a = _b.sent();
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
void ensureDir(server_1.UPLOAD_CONFIG.TEMP_PATH);
void ensureDir(server_1.UPLOAD_CONFIG.SCALE_PATH);
// ==========================================
// UTILS (BASE64 / MIME / EXT)
// ==========================================
// FIXED: Removed named capturing groups for ES2017 compatibility
var dataUrlRegex = /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/;
var extFromMime = function (mime) {
    if (!mime)
        return 'png';
    if (mime.includes('png'))
        return 'png';
    if (mime.includes('webp'))
        return 'webp';
    if (mime.includes('jpeg') || mime.includes('jpg'))
        return 'jpg';
    return 'png';
};
var extFromPathOrMime = function (p, mime) {
    if (p) {
        var ext = path.extname(p).toLowerCase().replace('.', '');
        if (['png', 'jpg', 'jpeg', 'webp'].includes(ext))
            return ext;
    }
    return extFromMime(mime);
};
// FIXED: Updated to use indexed access instead of named groups
var stripBase64Prefix = function (input) {
    var match = input.match(dataUrlRegex);
    if (match) {
        return { mime: match[1], data: match[2] };
    }
    return { data: input };
};
// ==========================================
// LOADING
// ==========================================
/**
 * Load an image into Buffer from base64 | file path | url
 */
var loadImageBuffer = function (params) { return __awaiter(void 0, void 0, void 0, function () {
    var started, imageType, _a, mime_1, data, buffer_1, filePath, buffer_2, url, resp, buffer, contentType, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                started = Date.now();
                imageType = params.imageType;
                // Auto-detect by pattern if not provided
                if (!imageType) {
                    if (params.image.startsWith('http://') || params.image.startsWith('https://')) {
                        imageType = 'url';
                    }
                    else if (params.image.startsWith('data:image/')) {
                        imageType = 'base64';
                    }
                    else {
                        imageType = 'file';
                    }
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, 6, 7]);
                if (imageType === 'base64') {
                    _a = stripBase64Prefix(params.image.trim()), mime_1 = _a.mime, data = _a.data;
                    buffer_1 = Buffer.from(data, 'base64');
                    return [2 /*return*/, { buffer: buffer_1, extGuess: extFromMime(mime_1) }];
                }
                if (!(imageType === 'file')) return [3 /*break*/, 3];
                filePath = params.image;
                return [4 /*yield*/, fs.readFile(filePath)];
            case 2:
                buffer_2 = _b.sent();
                return [2 /*return*/, { buffer: buffer_2, extGuess: extFromPathOrMime(filePath) }];
            case 3:
                url = params.image;
                return [4 /*yield*/, axios_1.default.get(url, { responseType: 'arraybuffer' })];
            case 4:
                resp = _b.sent();
                buffer = Buffer.from(resp.data);
                contentType = resp.headers['content-type'];
                return [2 /*return*/, { buffer: buffer, extGuess: extFromPathOrMime(url, contentType) }];
            case 5:
                error_1 = _b.sent();
                logger_1.default.error('Failed to load image', { sourceType: imageType, error: error_1 });
                throw error_1;
            case 6:
                (0, logger_1.logAI)('load-image', true, undefined, Date.now() - started, { type: imageType });
                return [7 /*endfinally*/];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.loadImageBuffer = loadImageBuffer;
// ==========================================
// SAVING
// ==========================================
/**
 * Save a buffer to disk as an image file.
 */
var saveBufferAsImage = function (buffer_3) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([buffer_3], args_1, true), void 0, function (buffer, options) {
        var dir, ext, prefix, filename, filePath;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dir = options.dir || server_1.UPLOAD_CONFIG.TEMP_PATH;
                    return [4 /*yield*/, ensureDir(dir)];
                case 1:
                    _a.sent();
                    ext = options.ext || 'png';
                    if (options.keepOriginalExt && !options.ext) {
                        ext = 'png';
                    }
                    prefix = options.filenamePrefix || 'img';
                    filename = "".concat(prefix, "-").concat(Date.now(), "-").concat((0, helpers_1.generateRandomString)(6), ".").concat(ext);
                    filePath = path.join(dir, filename);
                    return [4 /*yield*/, fs.writeFile(filePath, buffer)];
                case 2:
                    _a.sent();
                    (0, logger_1.logFile)('upload', filename, true, buffer.byteLength);
                    return [2 /*return*/, filePath];
            }
        });
    });
};
exports.saveBufferAsImage = saveBufferAsImage;
// ==========================================
// PREPROCESSING PIPELINES
// ==========================================
/**
 * Build a Sharp pipeline for OCR enhancement.
 */
var buildOcrPipeline = function (input, opts, steps, debugPaths) { return __awaiter(void 0, void 0, void 0, function () {
    var img, meta, currentWidth, targetWidth;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return __generator(this, function (_k) {
        switch (_k.label) {
            case 0:
                img = sharp(input, { failOnError: false });
                // Auto-rotate based on EXIF
                if ((_a = opts.rotateAuto) !== null && _a !== void 0 ? _a : true) {
                    img = img.rotate();
                    steps.push('rotate:auto');
                }
                return [4 /*yield*/, img.metadata()];
            case 1:
                meta = _k.sent();
                currentWidth = meta.width || 0;
                targetWidth = opts.resizeWidth || DEFAULTS.resizeWidth;
                // Resize to target width (avoid upscaling too much)
                if ((_b = opts.resize) !== null && _b !== void 0 ? _b : true) {
                    if (currentWidth > 0 && currentWidth > targetWidth) {
                        img = img.resize({ width: targetWidth, withoutEnlargement: true });
                        steps.push("resize:".concat(targetWidth));
                    }
                    else if (currentWidth === 0) {
                        // metadata missing; still constrain width
                        img = img.resize({ width: targetWidth, withoutEnlargement: true });
                        steps.push("resize:".concat(targetWidth));
                    }
                }
                // Optional auto-trim (remove uniform borders)
                if ((_c = opts.trim) !== null && _c !== void 0 ? _c : true) {
                    // sharp.trim trims by removing surrounding border
                    img = img.trim();
                    steps.push('trim');
                }
                // Grayscale
                if ((_d = opts.grayscale) !== null && _d !== void 0 ? _d : DEFAULTS.grayscale) {
                    img = img.grayscale();
                    steps.push('grayscale');
                }
                // Normalize histogram
                if ((_e = opts.normalize) !== null && _e !== void 0 ? _e : DEFAULTS.normalize) {
                    img = img.normalize();
                    steps.push('normalize');
                }
                // Boost contrast (simple linear)
                if ((_f = opts.contrast) !== null && _f !== void 0 ? _f : true) {
                    img = img.linear(1.15, -10); // tweak as needed
                    steps.push('contrast:+');
                }
                // Denoise (light)
                if ((_g = opts.denoise) !== null && _g !== void 0 ? _g : DEFAULTS.denoise) {
                    img = img.median(1);
                    steps.push('denoise:median(1)');
                }
                // Sharpen (moderate)
                if ((_h = opts.sharpen) !== null && _h !== void 0 ? _h : DEFAULTS.sharpen) {
                    img = img.sharpen(1);
                    steps.push('sharpen');
                }
                // Threshold for binary images (often helps OCR on LED/LCD digits)
                if ((_j = opts.threshold) !== null && _j !== void 0 ? _j : true) {
                    img = img.threshold(128);
                    steps.push('threshold:128');
                }
                // Invert colors (sometimes necessary, optional)
                if (opts.invert) {
                    img = img.negate();
                    steps.push('invert');
                }
                return [2 /*return*/, img];
        }
    });
}); };
/**
 * Preprocess an image buffer for OCR (scale display / receipts).
 */
var preprocessForOCR = function (input_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([input_1], args_1, true), void 0, function (input, options) {
        var started, steps, debugPaths, opts, img, dbg, dbgPath, buffer, meta2, savedPath, error_2;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    started = Date.now();
                    steps = [];
                    debugPaths = [];
                    opts = __assign({ rotateAuto: true, trim: true, grayscale: DEFAULTS.grayscale, normalize: DEFAULTS.normalize, contrast: true, denoise: DEFAULTS.denoise, sharpen: DEFAULTS.sharpen, threshold: true, resize: true, resizeWidth: DEFAULTS.resizeWidth, saveProcessed: false, saveDebugSteps: false, debugDir: server_1.UPLOAD_CONFIG.TEMP_PATH, processedPrefix: 'ocr' }, options);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 10, , 11]);
                    return [4 /*yield*/, buildOcrPipeline(input, opts, steps, debugPaths)];
                case 2:
                    img = _a.sent();
                    if (!opts.saveDebugSteps) return [3 /*break*/, 5];
                    return [4 /*yield*/, img.clone().png().toBuffer()];
                case 3:
                    dbg = _a.sent();
                    return [4 /*yield*/, (0, exports.saveBufferAsImage)(dbg, {
                            dir: opts.debugDir,
                            filenamePrefix: 'debug-ocr',
                            ext: 'png',
                        })];
                case 4:
                    dbgPath = _a.sent();
                    debugPaths.push(dbgPath);
                    _a.label = 5;
                case 5: return [4 /*yield*/, img.png().toBuffer()];
                case 6:
                    buffer = _a.sent();
                    return [4 /*yield*/, sharp(buffer).metadata()];
                case 7:
                    meta2 = _a.sent();
                    savedPath = void 0;
                    if (!opts.saveProcessed) return [3 /*break*/, 9];
                    return [4 /*yield*/, (0, exports.saveBufferAsImage)(buffer, {
                            dir: opts.debugDir || server_1.UPLOAD_CONFIG.TEMP_PATH,
                            filenamePrefix: opts.processedPrefix || 'ocr',
                            ext: 'png',
                        })];
                case 8:
                    savedPath = _a.sent();
                    _a.label = 9;
                case 9:
                    (0, logger_1.logAI)('preprocess-ocr', true, undefined, Date.now() - started, {
                        steps: steps,
                        width: meta2.width,
                        height: meta2.height,
                        savedPath: savedPath,
                    });
                    return [2 /*return*/, {
                            buffer: buffer,
                            width: meta2.width,
                            height: meta2.height,
                            savedPath: savedPath,
                            steps: steps,
                            debugPaths: debugPaths,
                        }];
                case 10:
                    error_2 = _a.sent();
                    logger_1.default.error('preprocessForOCR failed', { error: error_2 });
                    throw error_2;
                case 11: return [2 /*return*/];
            }
        });
    });
};
exports.preprocessForOCR = preprocessForOCR;
// ==========================================
// COMBINED UTILITIES
// ==========================================
/**
 * Load, preprocess, and optionally save original + processed files.
 * Handy for endpoints that accept file/base64/url and need a ready file.
 */
var prepareImageForOCR = function (input_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([input_1], args_1, true), void 0, function (input, preprocessOptions, saveOriginal) {
        var _a, buffer, extGuess, originalPath, pre;
        if (preprocessOptions === void 0) { preprocessOptions = {}; }
        if (saveOriginal === void 0) { saveOriginal = false; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, exports.loadImageBuffer)(input)];
                case 1:
                    _a = _b.sent(), buffer = _a.buffer, extGuess = _a.extGuess;
                    if (!saveOriginal) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, exports.saveBufferAsImage)(buffer, {
                            dir: server_1.UPLOAD_CONFIG.SCALE_PATH,
                            filenamePrefix: 'original',
                            ext: extGuess,
                        })];
                case 2:
                    originalPath = _b.sent();
                    _b.label = 3;
                case 3: return [4 /*yield*/, (0, exports.preprocessForOCR)(buffer, __assign({ saveProcessed: true, debugDir: server_1.UPLOAD_CONFIG.SCALE_PATH, processedPrefix: 'processed' }, preprocessOptions))];
                case 4:
                    pre = _b.sent();
                    return [2 /*return*/, {
                            originalPath: originalPath,
                            processedPath: pre.savedPath,
                            processedBuffer: pre.buffer,
                            steps: pre.steps,
                            width: pre.width,
                            height: pre.height,
                        }];
            }
        });
    });
};
exports.prepareImageForOCR = prepareImageForOCR;
/**
 * Quick helper to downscale and compress a generic image (not necessarily for OCR).
 */
var optimizeGenericImage = function (input_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([input_1], args_1, true), void 0, function (input, maxWidth, quality, toWebp) {
        var _a, buffer, extGuess, started, img, meta, outBuf, outPath, meta2;
        if (maxWidth === void 0) { maxWidth = 1600; }
        if (quality === void 0) { quality = 80; }
        if (toWebp === void 0) { toWebp = false; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, exports.loadImageBuffer)(input)];
                case 1:
                    _a = _b.sent(), buffer = _a.buffer, extGuess = _a.extGuess;
                    started = Date.now();
                    img = sharp(buffer, { failOnError: false }).rotate();
                    return [4 /*yield*/, img.metadata()];
                case 2:
                    meta = _b.sent();
                    if (meta.width && meta.width > maxWidth) {
                        img = img.resize({ width: maxWidth, withoutEnlargement: true });
                    }
                    if (toWebp) {
                        img = img.webp({ quality: quality });
                    }
                    else if (extGuess === 'jpg' || extGuess === 'jpeg') {
                        img = img.jpeg({ quality: quality, mozjpeg: true });
                    }
                    else if (extGuess === 'png') {
                        img = img.png({ quality: quality });
                    }
                    else if (extGuess === 'webp') {
                        img = img.webp({ quality: quality });
                    }
                    else {
                        img = img.png({ quality: quality });
                    }
                    return [4 /*yield*/, img.toBuffer()];
                case 3:
                    outBuf = _b.sent();
                    return [4 /*yield*/, (0, exports.saveBufferAsImage)(outBuf, {
                            dir: server_1.UPLOAD_CONFIG.UPLOAD_PATH,
                            filenamePrefix: 'optimized',
                            ext: toWebp ? 'webp' : extGuess,
                        })];
                case 4:
                    outPath = _b.sent();
                    return [4 /*yield*/, sharp(outBuf).metadata()];
                case 5:
                    meta2 = _b.sent();
                    (0, logger_1.logAI)('optimize-image', true, undefined, Date.now() - started, {
                        outPath: outPath,
                        width: meta2.width,
                        height: meta2.height,
                    });
                    return [2 /*return*/, { outputPath: outPath, width: meta2.width, height: meta2.height }];
            }
        });
    });
};
exports.optimizeGenericImage = optimizeGenericImage;
// ==========================================
// EXPORTS
// ==========================================
exports.default = {
    // Loading
    loadImageBuffer: exports.loadImageBuffer,
    // Saving
    saveBufferAsImage: exports.saveBufferAsImage,
    // Preprocessing
    preprocessForOCR: exports.preprocessForOCR,
    prepareImageForOCR: exports.prepareImageForOCR,
    // Generic
    optimizeGenericImage: exports.optimizeGenericImage,
};
