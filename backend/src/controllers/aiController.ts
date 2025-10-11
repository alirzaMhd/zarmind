// ==========================================
// ZARMIND - AI Controller (OCR, Scale Reading, Detection)
// ==========================================

import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware';
import AIService from '../services/aiService';
import { healthCheckAI } from '../config/ai';
import {
  ValidationError,
  WeightUnit,
  IImagePreprocessingOptions,
} from '../types';

// ==========================================
// Helpers
// ==========================================

const parseWeightUnit = (val?: any): WeightUnit | undefined => {
  if (!val) return undefined;
  const s = String(val).trim().toLowerCase();

  // English
  if (['g', 'gr', 'gram', 'grams'].includes(s)) return WeightUnit.GRAM;
  if (['kg', 'kilogram', 'kilograms'].includes(s)) return WeightUnit.KILOGRAM;
  if (['mithqal', 'mithgal', 'mithq', 'mesghal'].includes(s)) return WeightUnit.MITHQAL;
  if (['oz', 'ozt', 'ounce', 'ounces'].includes(s)) return WeightUnit.OUNCE;

  // Persian
  if (['گرم'].includes(s)) return WeightUnit.GRAM;
  if (['کیلو', 'کیلوگرم'].includes(s)) return WeightUnit.KILOGRAM;
  if (['مثقال'].includes(s)) return WeightUnit.MITHQAL;
  if (['اونس'].includes(s)) return WeightUnit.OUNCE;

  return undefined;
};

const parseImageType = (val?: any): 'base64' | 'file' | 'url' | undefined => {
  if (!val) return undefined;
  const s = String(val).trim().toLowerCase();
  if (s === 'base64' || s === 'file' || s === 'url') return s;
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
export const scaleRead = asyncHandler(async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;

  // If a file is provided (multipart), use that path
  if (file) {
    const result = await AIService.readScaleFromFile(file, {
      expectedUnit: parseWeightUnit(req.body.expectedUnit),
      convertTo: parseWeightUnit(req.body.convertTo),
      preprocessingOptions: req.body.preprocessingOptions as IImagePreprocessingOptions | undefined,
    });
    return res.sendSuccess(result, result.success ? 'وزن با موفقیت استخراج شد' : 'استخراج وزن انجام نشد');
  }

  // Otherwise, expect image in body
  const { image } = req.body;
  if (!image || typeof image !== 'string' || image.trim().length === 0) {
    throw new ValidationError('تصویر الزامی است (فایل یا base64 یا URL)');
  }

  const result = await AIService.readScale({
    image,
    imageType: parseImageType(req.body.imageType),
    preprocessingOptions: req.body.preprocessingOptions as IImagePreprocessingOptions | undefined,
    expectedUnit: parseWeightUnit(req.body.expectedUnit),
    convertTo: parseWeightUnit(req.body.convertTo),
    requireDecimal: req.body.requireDecimal === true || req.body.requireDecimal === 'true',
  });

  return res.sendSuccess(result, result.success ? 'وزن با موفقیت استخراج شد' : 'استخراج وزن انجام نشد');
});

/**
 * POST /api/ai/scale-read/upload
 * Uses upload middleware (e.g., uploadScaleImage.single('image'))
 */
export const scaleReadUpload = asyncHandler(async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) {
    throw new ValidationError('فایل تصویر الزامی است (field: image)');
  }

  const result = await AIService.readScaleFromFile(file, {
    expectedUnit: parseWeightUnit(req.body.expectedUnit),
    convertTo: parseWeightUnit(req.body.convertTo),
    preprocessingOptions: req.body.preprocessingOptions as IImagePreprocessingOptions | undefined,
  });

  res.sendSuccess(result, result.success ? 'وزن با موفقیت استخراج شد' : 'استخراج وزن انجام نشد');
});

/**
 * POST /api/ai/product-detect
 * Body: { image: base64 | url | file path, imageType?: 'base64'|'file'|'url' }
 * Or with upload: attach file (field 'image')
 */
export const detectProduct = asyncHandler(async (req: Request, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;

  if (file) {
    const result = await AIService.detectProductFromImage({
      image: file.path,
      imageType: 'file',
    });
    return res.sendSuccess(result, 'پردازش تصویر انجام شد');
  }

  const { image, imageType } = req.body || {};
  if (!image || typeof image !== 'string' || image.trim().length === 0) {
    throw new ValidationError('تصویر الزامی است (فایل یا base64 یا URL)');
  }

  const result = await AIService.detectProductFromImage({
    image,
    imageType: parseImageType(imageType),
  });

  return res.sendSuccess(result, 'پردازش تصویر انجام شد');
});

/**
 * GET /api/ai/health
 * Returns current provider and init status
 */
export const health = asyncHandler(async (_req: Request, res: Response) => {
  const info = await healthCheckAI();
  res.sendSuccess(info, 'وضعیت AI');
});

// ==========================================
// EXPORTS
// ==========================================

export default {
  scaleRead,
  scaleReadUpload,
  detectProduct,
  health,
};