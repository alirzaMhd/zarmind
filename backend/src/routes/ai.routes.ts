// ==========================================
// ZARMIND - AI Routes (OCR, Scale Reading, Detection)
// ==========================================

import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import aiController from '../controllers/aiController';
import { authenticate } from '../middleware/auth.middleware';
import {
  uploadScaleImage,
  multerErrorHandler,
} from '../middleware/upload.middleware';
import { AI_RATE_LIMIT_OPTIONS } from '../config/server';

const router = Router();

// ==========================================
// Rate Limiter (AI endpoints are heavier)
// ==========================================
const aiLimiter = rateLimit(AI_RATE_LIMIT_OPTIONS as any);

// ==========================================
// Health
// ==========================================

/**
 * @route   GET /api/ai/health
 * @desc    Get AI provider and initialization status
 * @access  Private
 */
router.get('/health', authenticate, aiLimiter, aiController.aiHealth);

// ==========================================
// Scale Reading (OCR)
// Supports: multipart (file field: 'image') OR JSON body with base64/url
// ==========================================

/**
 * @route   POST /api/ai/scale-read
 * @desc    Read weight from a scale image (OCR). Accepts multipart or JSON.
 * @access  Private
 */
router.post(
  '/scale-read',
  authenticate,
  aiLimiter,
  // Upload middleware will be no-op if no file provided
  uploadScaleImage,
  // Friendly Multer error responses (if any)
  multerErrorHandler,
  aiController.scaleRead
);

// Optional alias for explicit upload path (same controller)
router.post(
  '/scale-read/upload',
  authenticate,
  aiLimiter,
  uploadScaleImage,
  multerErrorHandler,
  aiController.scaleRead
);

// ==========================================
// Product Detection (Placeholder)
// Supports: multipart (file field: 'image') OR JSON body with base64/url
// ==========================================

/**
 * @route   POST /api/ai/product-detect
 * @desc    Detect product type/category from image (experimental/placeholder)
 * @access  Private
 */
router.post(
  '/product-detect',
  authenticate,
  aiLimiter,
  uploadScaleImage, // reuse image uploader; acceptable for generic images
  multerErrorHandler,
  aiController.detectProduct
);

// ==========================================
// EXPORT
// ==========================================

export default router;