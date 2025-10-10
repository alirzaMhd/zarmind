"use strict";
// ==========================================
// ZARMIND - AI Routes (OCR, Scale Reading, Detection)
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var express_rate_limit_1 = require("express-rate-limit");
var aiController_1 = require("../controllers/aiController");
var auth_middleware_1 = require("../middleware/auth.middleware");
var upload_middleware_1 = require("../middleware/upload.middleware");
var server_1 = require("../config/server");
var router = (0, express_1.Router)();
// ==========================================
// Rate Limiter (AI endpoints are heavier)
// ==========================================
var aiLimiter = (0, express_rate_limit_1.default)(server_1.AI_RATE_LIMIT_OPTIONS);
// ==========================================
// Health
// ==========================================
/**
 * @route   GET /api/ai/health
 * @desc    Get AI provider and initialization status
 * @access  Private
 */
router.get('/health', auth_middleware_1.authenticate, aiLimiter, aiController_1.default.health);
// ==========================================
// Scale Reading (OCR)
// Supports: multipart (file field: 'image') OR JSON body with base64/url
// ==========================================
/**
 * @route   POST /api/ai/scale-read
 * @desc    Read weight from a scale image (OCR). Accepts multipart or JSON.
 * @access  Private
 */
router.post('/scale-read', auth_middleware_1.authenticate, aiLimiter, 
// Upload middleware will be no-op if no file provided
upload_middleware_1.uploadScaleImage, 
// Friendly Multer error responses (if any)
upload_middleware_1.multerErrorHandler, aiController_1.default.scaleRead);
// Optional alias for explicit upload path (same controller)
router.post('/scale-read/upload', auth_middleware_1.authenticate, aiLimiter, upload_middleware_1.uploadScaleImage, upload_middleware_1.multerErrorHandler, aiController_1.default.scaleRead);
// ==========================================
// Product Detection (Placeholder)
// Supports: multipart (file field: 'image') OR JSON body with base64/url
// ==========================================
/**
 * @route   POST /api/ai/product-detect
 * @desc    Detect product type/category from image (experimental/placeholder)
 * @access  Private
 */
router.post('/product-detect', auth_middleware_1.authenticate, aiLimiter, upload_middleware_1.uploadScaleImage, // reuse image uploader; acceptable for generic images
upload_middleware_1.multerErrorHandler, aiController_1.default.detectProduct);
// ==========================================
// EXPORT
// ==========================================
exports.default = router;
