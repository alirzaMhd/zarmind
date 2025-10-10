"use strict";
// ==========================================
// ZARMIND - AI Controller (OCR, Scale Reading, Detection)
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
exports.health = exports.detectProduct = exports.scaleReadUpload = exports.scaleRead = void 0;
var error_middleware_1 = require("../middleware/error.middleware");
var aiService_1 = require("../services/aiService");
var ai_1 = require("../config/ai");
var types_1 = require("../types");
// ==========================================
// Helpers
// ==========================================
var parseWeightUnit = function (val) {
    if (!val)
        return undefined;
    var s = String(val).trim().toLowerCase();
    // English
    if (['g', 'gr', 'gram', 'grams'].includes(s))
        return types_1.WeightUnit.GRAM;
    if (['kg', 'kilogram', 'kilograms'].includes(s))
        return types_1.WeightUnit.KILOGRAM;
    if (['mithqal', 'mithgal', 'mithq', 'mesghal'].includes(s))
        return types_1.WeightUnit.MITHQAL;
    if (['oz', 'ozt', 'ounce', 'ounces'].includes(s))
        return types_1.WeightUnit.OUNCE;
    // Persian
    if (['گرم'].includes(s))
        return types_1.WeightUnit.GRAM;
    if (['کیلو', 'کیلوگرم'].includes(s))
        return types_1.WeightUnit.KILOGRAM;
    if (['مثقال'].includes(s))
        return types_1.WeightUnit.MITHQAL;
    if (['اونس'].includes(s))
        return types_1.WeightUnit.OUNCE;
    return undefined;
};
var parseImageType = function (val) {
    if (!val)
        return undefined;
    var s = String(val).trim().toLowerCase();
    if (s === 'base64' || s === 'file' || s === 'url')
        return s;
    return undefined;
};
// ==========================================
// Controllers
// ==========================================
/**
 * POST /api/ai/scale-read
 * Body options:
 * - image: base64 | file path | url (if file is uploaded, it takes precedence)
 * - imageType: 'base64' | 'file' | 'url' (optional; auto-detected otherwise)
 * - preprocessingOptions: IImagePreprocessingOptions (optional)
 * - expectedUnit: 'gram' | 'kilogram' | 'mithqal' | 'ounce' (optional)
 * - convertTo: same as above (optional; default gram)
 * - requireDecimal: boolean (optional)
 */
exports.scaleRead = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var file, result_1, image, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                file = req.file;
                if (!file) return [3 /*break*/, 2];
                return [4 /*yield*/, aiService_1.default.readScaleFromFile(file, {
                        expectedUnit: parseWeightUnit(req.body.expectedUnit),
                        convertTo: parseWeightUnit(req.body.convertTo),
                        preprocessingOptions: req.body.preprocessingOptions,
                    })];
            case 1:
                result_1 = _a.sent();
                return [2 /*return*/, res.sendSuccess(result_1, result_1.success ? 'وزن با موفقیت استخراج شد' : 'استخراج وزن انجام نشد')];
            case 2:
                image = req.body.image;
                if (!image || typeof image !== 'string' || image.trim().length === 0) {
                    throw new types_1.ValidationError('تصویر الزامی است (فایل یا base64 یا URL)');
                }
                return [4 /*yield*/, aiService_1.default.readScale({
                        image: image,
                        imageType: parseImageType(req.body.imageType),
                        preprocessingOptions: req.body.preprocessingOptions,
                        expectedUnit: parseWeightUnit(req.body.expectedUnit),
                        convertTo: parseWeightUnit(req.body.convertTo),
                        requireDecimal: req.body.requireDecimal === true || req.body.requireDecimal === 'true',
                    })];
            case 3:
                result = _a.sent();
                res.sendSuccess(result, result.success ? 'وزن با موفقیت استخراج شد' : 'استخراج وزن انجام نشد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/ai/scale-read/upload
 * Uses upload middleware (e.g., uploadScaleImage.single('image'))
 */
exports.scaleReadUpload = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var file, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                file = req.file;
                if (!file) {
                    throw new types_1.ValidationError('فایل تصویر الزامی است (field: image)');
                }
                return [4 /*yield*/, aiService_1.default.readScaleFromFile(file, {
                        expectedUnit: parseWeightUnit(req.body.expectedUnit),
                        convertTo: parseWeightUnit(req.body.convertTo),
                        preprocessingOptions: req.body.preprocessingOptions,
                    })];
            case 1:
                result = _a.sent();
                res.sendSuccess(result, result.success ? 'وزن با موفقیت استخراج شد' : 'استخراج وزن انجام نشد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/ai/product-detect
 * Body: { image: base64 | url | file path, imageType?: 'base64'|'file'|'url' }
 * Or with upload: attach file (field 'image')
 */
exports.detectProduct = (0, error_middleware_1.asyncHandler)(function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var file, result_2, _a, image, imageType, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                file = req.file;
                if (!file) return [3 /*break*/, 2];
                return [4 /*yield*/, aiService_1.default.detectProductFromImage({
                        image: file.path,
                        imageType: 'file',
                    })];
            case 1:
                result_2 = _b.sent();
                return [2 /*return*/, res.sendSuccess(result_2, 'پردازش تصویر انجام شد')];
            case 2:
                _a = req.body || {}, image = _a.image, imageType = _a.imageType;
                if (!image || typeof image !== 'string' || image.trim().length === 0) {
                    throw new types_1.ValidationError('تصویر الزامی است (فایل یا base64 یا URL)');
                }
                return [4 /*yield*/, aiService_1.default.detectProductFromImage({
                        image: image,
                        imageType: parseImageType(imageType),
                    })];
            case 3:
                result = _b.sent();
                res.sendSuccess(result, 'پردازش تصویر انجام شد');
                return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/ai/health
 * Returns current provider and init status
 */
exports.health = (0, error_middleware_1.asyncHandler)(function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var info;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, ai_1.healthCheckAI)()];
            case 1:
                info = _a.sent();
                res.sendSuccess(info, 'وضعیت AI');
                return [2 /*return*/];
        }
    });
}); });
// ==========================================
// EXPORTS
// ==========================================
exports.default = {
    scaleRead: exports.scaleRead,
    scaleReadUpload: exports.scaleReadUpload,
    detectProduct: exports.detectProduct,
    health: exports.health,
};
