"use strict";
// ==========================================
// ZARMIND - Upload Middleware (Multer + Helpers)
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
exports.multerErrorHandler = exports.cleanupOnError = exports.removeFile = exports.optimizeImage = exports.createArrayUpload = exports.createSingleUpload = exports.uploadMixedFields = exports.uploadProductImages = exports.uploadDocumentFile = exports.uploadScaleImage = exports.uploadProductImage = exports.uploadAvatar = exports.anyUploader = exports.documentUploader = exports.scaleImageUploader = exports.productImageUploader = exports.avatarUploader = void 0;
var multer = require("multer");
var path = require("path");
var fs = require("fs");
var fsp = require("fs/promises");
var sharp = require("sharp");
var server_1 = require("../config/server");
var logger_1 = require("../utils/logger");
var helpers_1 = require("../utils/helpers");
// ==========================================
// DIRECTORY SETUP
// ==========================================
var ensureDir = function (dir) {
    try {
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
    }
    catch (err) {
        logger_1.default.error("Failed to ensure upload directory: ".concat(dir), err);
    }
};
// Ensure all upload directories exist
[
    server_1.UPLOAD_CONFIG.UPLOAD_PATH,
    server_1.UPLOAD_CONFIG.TEMP_PATH,
    server_1.UPLOAD_CONFIG.PRODUCTS_PATH,
    server_1.UPLOAD_CONFIG.SCALE_PATH,
    server_1.UPLOAD_CONFIG.DOCUMENTS_PATH,
    server_1.UPLOAD_CONFIG.AVATARS_PATH,
].forEach(ensureDir);
// ==========================================
// FILENAME + FILTER HELPERS
// ==========================================
var sanitizeFilename = function (name) {
    // Remove directory traversal and unsafe chars
    var base = path.basename(name, path.extname(name));
    var safe = base
        .replace(/[^a-zA-Z0-9_\-\.]+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 64);
    return safe || 'file';
};
var uniqueFilename = function (originalname) {
    var ext = path.extname(originalname || '').toLowerCase();
    var name = sanitizeFilename(originalname);
    var stamp = "".concat(Date.now(), "-").concat((0, helpers_1.generateRandomString)(6));
    return "".concat(name, "-").concat(stamp).concat(ext);
};
var isAllowedExt = function (ext, allowed) {
    var clean = ext.toLowerCase().replace('.', '');
    return allowed.includes(clean);
};
var isImageMime = function (mime) { return mime.startsWith('image/'); };
var createUploader = function (opts) {
    var dest = opts.dest, _a = opts.allowedExtensions, allowedExtensions = _a === void 0 ? server_1.UPLOAD_CONFIG.ALLOWED_ALL_TYPES : _a, _b = opts.maxFileSize, maxFileSize = _b === void 0 ? server_1.UPLOAD_CONFIG.MAX_FILE_SIZE : _b, _c = opts.preserveOriginalName, preserveOriginalName = _c === void 0 ? false : _c;
    ensureDir(dest);
    var storage = multer.diskStorage({
        destination: function (_req, _file, cb) { return cb(null, dest); },
        filename: function (_req, file, cb) {
            try {
                var ext = path.extname(file.originalname || '').toLowerCase();
                var filename = preserveOriginalName
                    ? "".concat(sanitizeFilename(file.originalname))
                    : uniqueFilename(file.originalname || "file".concat(ext || '.bin'));
                cb(null, filename);
            }
            catch (err) {
                cb(err, '');
            }
        },
    });
    var fileFilter = function (_req, file, cb) {
        var ext = path.extname(file.originalname || '').toLowerCase();
        var allowed = isAllowedExt(ext, allowedExtensions);
        // For images, also validate mimetype for extra safety
        if (allowed && isImageMime(file.mimetype)) {
            return cb(null, true);
        }
        if (allowed)
            return cb(null, true);
        var err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
        err.message = 'نوع فایل مجاز نیست';
        return cb(err);
    };
    return multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: { fileSize: maxFileSize },
    });
};
// ==========================================
// PRECONFIGURED UPLOADERS
// ==========================================
exports.avatarUploader = createUploader({
    dest: server_1.UPLOAD_CONFIG.AVATARS_PATH,
    allowedExtensions: server_1.UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES,
});
exports.productImageUploader = createUploader({
    dest: server_1.UPLOAD_CONFIG.PRODUCTS_PATH,
    allowedExtensions: server_1.UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES,
});
exports.scaleImageUploader = createUploader({
    dest: server_1.UPLOAD_CONFIG.SCALE_PATH,
    allowedExtensions: server_1.UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES,
});
exports.documentUploader = createUploader({
    dest: server_1.UPLOAD_CONFIG.DOCUMENTS_PATH,
    allowedExtensions: server_1.UPLOAD_CONFIG.ALLOWED_DOCUMENT_TYPES,
});
exports.anyUploader = createUploader({
    dest: server_1.UPLOAD_CONFIG.UPLOAD_PATH,
    allowedExtensions: server_1.UPLOAD_CONFIG.ALLOWED_ALL_TYPES,
});
// ==========================================
// READY-TO-USE MIDDLEWARES
// ==========================================
// Single
exports.uploadAvatar = exports.avatarUploader.single('avatar');
exports.uploadProductImage = exports.productImageUploader.single('image');
exports.uploadScaleImage = exports.scaleImageUploader.single('image');
exports.uploadDocumentFile = exports.documentUploader.single('file');
// Multiple (arrays)
exports.uploadProductImages = exports.productImageUploader.array('images', 10);
// Fields (example usage: router.post(..., uploadMixedFields, ...))
exports.uploadMixedFields = exports.productImageUploader.fields([
    { name: 'images', maxCount: 10 },
    { name: 'thumbnail', maxCount: 1 },
]);
// Factory for custom single field usage
var createSingleUpload = function (opts, fieldName) { return createUploader(opts).single(fieldName); };
exports.createSingleUpload = createSingleUpload;
// Factory for multiple files (array)
var createArrayUpload = function (opts, fieldName, maxCount) {
    if (maxCount === void 0) { maxCount = 10; }
    return createUploader(opts).array(fieldName, maxCount);
};
exports.createArrayUpload = createArrayUpload;
/**
 * Optimize an image file on disk (in-place or as new file).
 * Returns path to optimized file (may be the same as input if overwritten).
 */
var optimizeImage = function (filePath_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([filePath_1], args_1, true), void 0, function (filePath, options) {
        var _a, maxWidth, maxHeight, _b, quality, _c, toWebp, format, _d, grayscale, _e, removeMetadata, ext, dir, base, image, metadata, outputExt, outPath, _f, error_1;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _a = options.maxWidth, maxWidth = _a === void 0 ? 1600 : _a, maxHeight = options.maxHeight, _b = options.quality, quality = _b === void 0 ? 80 : _b, _c = options.toWebp, toWebp = _c === void 0 ? false : _c, format = options.format, _d = options.grayscale, grayscale = _d === void 0 ? false : _d, _e = options.removeMetadata, removeMetadata = _e === void 0 ? true : _e;
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 8, , 9]);
                    ext = path.extname(filePath).toLowerCase();
                    dir = path.dirname(filePath);
                    base = path.basename(filePath, ext);
                    image = sharp(filePath);
                    return [4 /*yield*/, image.metadata()];
                case 2:
                    metadata = _g.sent();
                    // Resize only if larger than target
                    if ((metadata.width && metadata.width > maxWidth) || (maxHeight && metadata.height && metadata.height > maxHeight)) {
                        image.resize({
                            width: maxWidth,
                            height: maxHeight,
                            fit: 'inside',
                            withoutEnlargement: true,
                        });
                    }
                    if (grayscale)
                        image.grayscale();
                    if (removeMetadata)
                        image.withMetadata({}); // clears metadata when re-encoding
                    outputExt = ext;
                    if (toWebp) {
                        image.webp({ quality: quality });
                        outputExt = '.webp';
                    }
                    else if (format) {
                        switch (format) {
                            case 'jpeg':
                            case 'jpg':
                                image.jpeg({ quality: quality, mozjpeg: true });
                                outputExt = '.jpg';
                                break;
                            case 'png':
                                image.png({ quality: quality });
                                outputExt = '.png';
                                break;
                            case 'webp':
                                image.webp({ quality: quality });
                                outputExt = '.webp';
                                break;
                        }
                    }
                    outPath = toWebp || format ? path.join(dir, "".concat(base).concat(outputExt)) : filePath;
                    return [4 /*yield*/, image.toFile(outPath)];
                case 3:
                    _g.sent();
                    if (!(outPath !== filePath)) return [3 /*break*/, 7];
                    _g.label = 4;
                case 4:
                    _g.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, fsp.unlink(filePath)];
                case 5:
                    _g.sent();
                    return [3 /*break*/, 7];
                case 6:
                    _f = _g.sent();
                    return [3 /*break*/, 7];
                case 7:
                    (0, logger_1.logFile)('upload', path.basename(outPath), true);
                    return [2 /*return*/, outPath];
                case 8:
                    error_1 = _g.sent();
                    logger_1.default.error('Image optimization failed', { filePath: filePath, error: error_1 });
                    return [2 /*return*/, filePath]; // fallback to original
                case 9: return [2 /*return*/];
            }
        });
    });
};
exports.optimizeImage = optimizeImage;
// ==========================================
// CLEANUP HELPERS
// ==========================================
/**
 * Remove a file from disk safely
 */
var removeFile = function (filePath) { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!filePath)
                    return [2 /*return*/];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fsp.unlink(filePath)];
            case 2:
                _a.sent();
                (0, logger_1.logFile)('delete', path.basename(filePath), true);
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                // Ignore missing files
                logger_1.default.warn('Failed to remove file (maybe already deleted)', { filePath: filePath });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.removeFile = removeFile;
/**
 * Middleware to cleanup uploaded file(s) on error
 * Use immediately after upload middleware in the route chain
 */
var cleanupOnError = function (fields) {
    if (fields === void 0) { fields = ['file', 'files']; }
    return function (err, req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
        var paths;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    paths = [];
                    if (fields.includes('file') && ((_a = req.file) === null || _a === void 0 ? void 0 : _a.path)) {
                        paths.push(req.file.path);
                    }
                    if (fields.includes('files') && Array.isArray(req.files)) {
                        req.files.forEach(function (f) { return (f === null || f === void 0 ? void 0 : f.path) && paths.push(f.path); });
                    }
                    return [4 /*yield*/, Promise.all(paths.map(exports.removeFile))];
                case 1:
                    _b.sent();
                    next(err);
                    return [2 /*return*/];
            }
        });
    }); };
};
exports.cleanupOnError = cleanupOnError;
// ==========================================
// MULTER ERROR HANDLER (Optional)
// ==========================================
/**
 * Use after upload middleware in routes to provide friendly errors.
 * Note: Global error middleware also handles MulterError; this is a convenience handler.
 */
var multerErrorHandler = function (err, _req, res, next) {
    if (err instanceof multer.MulterError) {
        var message = 'خطا در بارگذاری فایل';
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                message = 'حجم فایل بیش از حد مجاز است';
                break;
            case 'LIMIT_FILE_COUNT':
                message = 'تعداد فایل‌های ارسالی بیش از حد مجاز است';
                break;
            case 'LIMIT_PART_COUNT':
            case 'LIMIT_FIELD_KEY':
            case 'LIMIT_FIELD_VALUE':
            case 'LIMIT_FIELD_COUNT':
                message = 'داده‌های فرم ارسال‌شده نامعتبر است';
                break;
            case 'LIMIT_UNEXPECTED_FILE':
                message = 'نوع یا فیلد فایل مجاز نیست';
                break;
        }
        return res.status(400).json({ success: false, error: message });
    }
    return next(err);
};
exports.multerErrorHandler = multerErrorHandler;
// ==========================================
// EXPORT DEFAULT (Group)
// ==========================================
exports.default = {
    // Uploaders (instances)
    avatarUploader: exports.avatarUploader,
    productImageUploader: exports.productImageUploader,
    scaleImageUploader: exports.scaleImageUploader,
    documentUploader: exports.documentUploader,
    anyUploader: exports.anyUploader,
    // Ready-made middlewares
    uploadAvatar: exports.uploadAvatar,
    uploadProductImage: exports.uploadProductImage,
    uploadScaleImage: exports.uploadScaleImage,
    uploadDocumentFile: exports.uploadDocumentFile,
    uploadProductImages: exports.uploadProductImages,
    uploadMixedFields: exports.uploadMixedFields,
    // Factories
    createSingleUpload: exports.createSingleUpload,
    createArrayUpload: exports.createArrayUpload,
    // Helpers
    optimizeImage: exports.optimizeImage,
    removeFile: exports.removeFile,
    cleanupOnError: exports.cleanupOnError,
    multerErrorHandler: exports.multerErrorHandler,
};
