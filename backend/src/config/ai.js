"use strict";
// ==========================================
// ZARMIND - AI Configuration & OCR Providers
// ==========================================
//
// What this module does:
// - Centralizes AI/OCR configuration (provider selection, options)
// - Exposes lazy-loaded singletons for Tesseract.js and Google Vision
// - Provides unified OCR helpers: ocrWithTesseract, ocrWithVision, ocr
// - Graceful init/teardown and basic health checks
//
// Notes:
// - Default provider controlled by env AI_SERVICE=tesseract|google-vision
// - Tesseract confidence is 0..100; we normalize to 0..1 for consistency
// - Google Vision client requires ADC (GOOGLE_APPLICATION_CREDENTIALS) or
//   explicit credentials; API key alone is not supported by official client.
//
// Dependencies: tesseract.js, @google-cloud/vision
// ==========================================
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
exports.shutdownAI = exports.healthCheckAI = exports.ocr = exports.ocrWithVision = exports.getVisionClient = exports.terminateTesseract = exports.ocrWithTesseract = exports.getTesseractWorker = exports.isVisionEnabled = exports.getActiveProvider = void 0;
var fs = require("fs");
var server_1 = require("./server");
var logger_1 = require("../utils/logger");
// Lazy imports to reduce cold-start time
var Tesseract; // tesseract.js (createWorker)
var Vision; // @google-cloud/vision (ImageAnnotatorClient)
// ==========================================
// STATE (SINGLETONS)
// ==========================================
var tesseractWorker = null;
var visionClient = null;
// ==========================================
// PROVIDER SELECTION
// ==========================================
var getActiveProvider = function () {
    return server_1.AI_CONFIG.SERVICE;
};
exports.getActiveProvider = getActiveProvider;
var isVisionEnabled = function () {
    return server_1.AI_CONFIG.GOOGLE_VISION.ENABLED === true;
};
exports.isVisionEnabled = isVisionEnabled;
// ==========================================
// TESSERACT (LAZY INIT)
// ==========================================
/**
 * Initialize and return a singleton Tesseract worker.
 */
var getTesseractWorker = function () { return __awaiter(void 0, void 0, void 0, function () {
    var started, _a, LANG, OEM, PSM, loggerEnabled, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (tesseractWorker)
                    return [2 /*return*/, tesseractWorker];
                started = Date.now();
                _b.label = 1;
            case 1:
                _b.trys.push([1, 7, , 8]);
                if (!Tesseract) {
                    // Dynamic import
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    Tesseract = require('tesseract.js');
                }
                _a = server_1.AI_CONFIG.TESSERACT, LANG = _a.LANG, OEM = _a.OEM, PSM = _a.PSM;
                loggerEnabled = process.env.NODE_ENV !== 'production';
                tesseractWorker = Tesseract.createWorker({
                    // Tesseract logger is noisy; log in dev only
                    logger: loggerEnabled ? function (m) { return logger_1.default.debug('tesseract', m); } : undefined,
                    cacheMethod: 'none',
                });
                return [4 /*yield*/, tesseractWorker.load()];
            case 2:
                _b.sent();
                return [4 /*yield*/, tesseractWorker.loadLanguage(LANG)];
            case 3:
                _b.sent();
                return [4 /*yield*/, tesseractWorker.initialize(LANG)];
            case 4:
                _b.sent();
                if (!tesseractWorker.setParameters) return [3 /*break*/, 6];
                return [4 /*yield*/, tesseractWorker.setParameters({
                        tessedit_char_whitelist: '0123456789.,-',
                        tessedit_pageseg_mode: String(PSM !== null && PSM !== void 0 ? PSM : 7), // default to single line
                        user_defined_dpi: '300',
                        classify_bln_numeric_mode: '1',
                    })];
            case 5:
                _b.sent();
                _b.label = 6;
            case 6:
                (0, logger_1.logAI)('tesseract-init', true, undefined, Date.now() - started, {
                    lang: LANG,
                    psm: PSM,
                    oem: OEM,
                });
                return [2 /*return*/, tesseractWorker];
            case 7:
                error_1 = _b.sent();
                tesseractWorker = null;
                logger_1.default.error('Failed to initialize Tesseract worker', { error: error_1 });
                throw error_1;
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.getTesseractWorker = getTesseractWorker;
/**
 * OCR using Tesseract.js
 */
var ocrWithTesseract = function (image) { return __awaiter(void 0, void 0, void 0, function () {
    var started, worker, result, text, confidenceRaw, confidence;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                started = Date.now();
                return [4 /*yield*/, (0, exports.getTesseractWorker)()];
            case 1:
                worker = _e.sent();
                return [4 /*yield*/, worker.recognize(image)];
            case 2:
                result = _e.sent();
                text = (_b = (_a = result === null || result === void 0 ? void 0 : result.data) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : '';
                confidenceRaw = (_d = (_c = result === null || result === void 0 ? void 0 : result.data) === null || _c === void 0 ? void 0 : _c.confidence) !== null && _d !== void 0 ? _d : 0;
                confidence = Math.max(0, Math.min(1, confidenceRaw / 100));
                (0, logger_1.logAI)('ocr-tesseract', true, confidence, Date.now() - started, {
                    length: text.length,
                });
                return [2 /*return*/, {
                        provider: 'tesseract',
                        text: text,
                        confidence: confidence,
                        raw: result,
                    }];
        }
    });
}); };
exports.ocrWithTesseract = ocrWithTesseract;
/**
 * Shutdown Tesseract worker (graceful).
 */
var terminateTesseract = function () { return __awaiter(void 0, void 0, void 0, function () {
    var err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!tesseractWorker)
                    return [2 /*return*/];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, 4, 5]);
                return [4 /*yield*/, tesseractWorker.terminate()];
            case 2:
                _a.sent();
                return [3 /*break*/, 5];
            case 3:
                err_1 = _a.sent();
                return [3 /*break*/, 5];
            case 4:
                tesseractWorker = null;
                return [7 /*endfinally*/];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.terminateTesseract = terminateTesseract;
// ==========================================
// GOOGLE VISION (LAZY INIT)
// ==========================================
/**
 * Initialize and return a singleton Google Vision client.
 * Requires GOOGLE_APPLICATION_CREDENTIALS or direct credentials.
 */
var getVisionClient = function () { return __awaiter(void 0, void 0, void 0, function () {
    var started, options, jsonStr, creds;
    return __generator(this, function (_a) {
        if (visionClient)
            return [2 /*return*/, visionClient];
        started = Date.now();
        try {
            if (!Vision) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                Vision = require('@google-cloud/vision');
            }
            options = {};
            // Prefer Application Default Credentials
            // If GOOGLE_APPLICATION_CREDENTIALS is set, @google-cloud/vision will use it.
            // Optionally allow keyFilename or credentials via env if provided.
            if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
                options.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
            }
            else if (process.env.GOOGLE_VISION_CREDENTIALS) {
                // Accept raw JSON (or base64-encoded JSON) credentials via env
                try {
                    jsonStr = isBase64(process.env.GOOGLE_VISION_CREDENTIALS)
                        ? Buffer.from(process.env.GOOGLE_VISION_CREDENTIALS, 'base64').toString('utf8')
                        : process.env.GOOGLE_VISION_CREDENTIALS;
                    creds = JSON.parse(jsonStr);
                    options.credentials = creds;
                }
                catch (e) {
                    logger_1.default.warn('Invalid GOOGLE_VISION_CREDENTIALS. Expect raw JSON or base64-JSON.');
                }
            }
            if (server_1.AI_CONFIG.GOOGLE_VISION.PROJECT_ID) {
                options.projectId = server_1.AI_CONFIG.GOOGLE_VISION.PROJECT_ID;
            }
            visionClient = new Vision.ImageAnnotatorClient(options);
            (0, logger_1.logAI)('vision-init', true, undefined, Date.now() - started, options.projectId ? { projectId: options.projectId } : undefined);
            return [2 /*return*/, visionClient];
        }
        catch (error) {
            visionClient = null;
            logger_1.default.error('Failed to initialize Google Vision client', { error: error });
            throw error;
        }
        return [2 /*return*/];
    });
}); };
exports.getVisionClient = getVisionClient;
/**
 * OCR using Google Cloud Vision (Document Text Detection preferred).
 */
var ocrWithVision = function (image) { return __awaiter(void 0, void 0, void 0, function () {
    var started, client, request, response, text, anns, err_2, anns, confidence;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                started = Date.now();
                return [4 /*yield*/, (0, exports.getVisionClient)()];
            case 1:
                client = _c.sent();
                request = {
                    image: {},
                };
                if (Buffer.isBuffer(image)) {
                    request.image.content = image.toString('base64');
                }
                else if (isHttpUrl(image)) {
                    request.image.source = { imageUri: image };
                }
                else {
                    // treat as file path
                    request.image.content = fs.readFileSync(image).toString('base64');
                }
                text = '';
                _c.label = 2;
            case 2:
                _c.trys.push([2, 6, , 8]);
                return [4 /*yield*/, client.documentTextDetection(request)];
            case 3:
                response = (_c.sent())[0];
                text = (_b = (_a = response === null || response === void 0 ? void 0 : response.fullTextAnnotation) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : '';
                if (!!text) return [3 /*break*/, 5];
                return [4 /*yield*/, client.textDetection(request)];
            case 4:
                response = (_c.sent())[0];
                anns = response === null || response === void 0 ? void 0 : response.textAnnotations;
                text = anns && anns.length > 0 ? anns[0].description || '' : '';
                _c.label = 5;
            case 5: return [3 /*break*/, 8];
            case 6:
                err_2 = _c.sent();
                logger_1.default.warn('Vision documentTextDetection failed, trying textDetection...', { err: err_2 });
                return [4 /*yield*/, client.textDetection(request)];
            case 7:
                response = (_c.sent())[0];
                anns = response === null || response === void 0 ? void 0 : response.textAnnotations;
                text = anns && anns.length > 0 ? anns[0].description || '' : '';
                return [3 /*break*/, 8];
            case 8:
                confidence = text ? 0.9 : 0.0;
                (0, logger_1.logAI)('ocr-vision', true, confidence, Date.now() - started, {
                    length: text.length,
                });
                return [2 /*return*/, {
                        provider: 'google-vision',
                        text: text,
                        confidence: confidence,
                        raw: response,
                    }];
        }
    });
}); };
exports.ocrWithVision = ocrWithVision;
// ==========================================
// UNIFIED OCR
// ==========================================
/**
 * Unified OCR helper that uses the active provider, but allows overrides.
 */
var ocr = function (image, provider) { return __awaiter(void 0, void 0, void 0, function () {
    var chosen;
    return __generator(this, function (_a) {
        chosen = provider || (0, exports.getActiveProvider)();
        if (chosen === 'google-vision') {
            if (!(0, exports.isVisionEnabled)()) {
                logger_1.default.warn('Google Vision requested but not enabled; falling back to Tesseract');
                return [2 /*return*/, (0, exports.ocrWithTesseract)(image)];
            }
            return [2 /*return*/, (0, exports.ocrWithVision)(image)];
        }
        // Default: Tesseract
        return [2 /*return*/, (0, exports.ocrWithTesseract)(image)];
    });
}); };
exports.ocr = ocr;
// ==========================================
// HEALTH & UTILITIES
// ==========================================
/**
 * Quick provider health check (initializes if needed).
 */
var healthCheckAI = function () { return __awaiter(void 0, void 0, void 0, function () {
    var provider, err_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                provider = (0, exports.getActiveProvider)();
                _a.label = 1;
            case 1:
                _a.trys.push([1, 6, , 7]);
                if (!(provider === 'tesseract')) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, exports.getTesseractWorker)()];
            case 2:
                _a.sent();
                return [3 /*break*/, 5];
            case 3:
                if (!(provider === 'google-vision' && (0, exports.isVisionEnabled)())) return [3 /*break*/, 5];
                return [4 /*yield*/, (0, exports.getVisionClient)()];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5: return [2 /*return*/, {
                    provider: provider,
                    initialized: true,
                    visionEnabled: (0, exports.isVisionEnabled)(),
                }];
            case 6:
                err_3 = _a.sent();
                return [2 /*return*/, {
                        provider: provider,
                        initialized: false,
                        visionEnabled: (0, exports.isVisionEnabled)(),
                    }];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.healthCheckAI = healthCheckAI;
/**
 * Graceful shutdown of AI resources.
 */
var shutdownAI = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, exports.terminateTesseract)()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.shutdownAI = shutdownAI;
// ==========================================
// HELPERS (INTERNAL)
// ==========================================
function isHttpUrl(value) {
    return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
}
function isBase64(str) {
    try {
        return Buffer.from(str, 'base64').toString('base64') === str.replace(/\s/g, '');
    }
    catch (_a) {
        return false;
    }
}
// ==========================================
// DEFAULT EXPORT (grouped)
// ==========================================
exports.default = {
    // Provider
    getActiveProvider: exports.getActiveProvider,
    isVisionEnabled: exports.isVisionEnabled,
    // Tesseract
    getTesseractWorker: exports.getTesseractWorker,
    ocrWithTesseract: exports.ocrWithTesseract,
    terminateTesseract: exports.terminateTesseract,
    // Vision
    getVisionClient: exports.getVisionClient,
    ocrWithVision: exports.ocrWithVision,
    // Unified OCR
    ocr: exports.ocr,
    // Health & lifecycle
    healthCheckAI: exports.healthCheckAI,
    shutdownAI: exports.shutdownAI,
};
