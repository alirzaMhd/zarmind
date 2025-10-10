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

import * as path from 'path';
import { ocr, ocrWithTesseract, ocrWithVision, getActiveProvider, isVisionEnabled } from '../config/ai';
import { prepareImageForOCR, LoadImageParams, PreprocessOptions } from './imageProcessing';
import { UPLOAD_CONFIG } from '../config/server';
import logger, { logAI } from '../utils/logger';
import {
  IScaleReadRequest,
  IScaleReadResponse,
  IImagePreprocessingOptions,
  WeightUnit,
  IAIProductDetection,
} from '../types';
import { toEnglishDigits } from '../utils/helpers';

// ==========================================
// TYPES & CONSTANTS
// ==========================================

type OCRProvider = 'tesseract' | 'google-vision';

interface ScaleReadInternalOptions {
  expectedUnit?: WeightUnit;         // default gram
  convertTo?: WeightUnit;            // normalize result to this unit (default gram)
  minWeight?: number;                // basic sanity (after normalization)
  maxWeight?: number;                // basic sanity (after normalization)
  requireDecimal?: boolean;          // prefer values with decimals
  providerFallback?: boolean;        // try second provider if low confidence
}

const DEFAULT_SCALE_OPTIONS: ScaleReadInternalOptions = {
  expectedUnit: WeightUnit.GRAM,
  convertTo: WeightUnit.GRAM,
  minWeight: 0.01,
  maxWeight: 50000, // 50kg upper bound default
  requireDecimal: false, // jewelry scales often 0.01, but not mandatory
  providerFallback: true,
};

// Ambiguous characters often misread in OCR for seven-segment displays
const OCR_CHAR_MAP: Record<string, string> = {
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
export const readScale = async (
  payload: IScaleReadRequest & {
    expectedUnit?: WeightUnit;
    convertTo?: WeightUnit;
    requireDecimal?: boolean;
  }
): Promise<IScaleReadResponse> => {
  const started = Date.now();

  try {
    // 1) Load + preprocess
    const preprocessOptions: PreprocessOptions = {
      // Reasonable defaults for seven-segment displays
      resize: payload.preprocessingOptions?.resize ?? true,
      grayscale: payload.preprocessingOptions?.grayscale ?? true,
      denoise: payload.preprocessingOptions?.denoise ?? true,
      contrast: payload.preprocessingOptions?.contrast ?? true,
      sharpen: payload.preprocessingOptions?.sharpen ?? true,
      threshold: payload.preprocessingOptions?.threshold ?? true,
      trim: true,
      rotateAuto: true,
      saveProcessed: true,
      debugDir: UPLOAD_CONFIG.SCALE_PATH,
      processedPrefix: 'scale',
    };

    const input: LoadImageParams = {
      image: payload.image,
      imageType: payload.imageType || guessInputType(payload.image),
    };

    const pre = await prepareImageForOCR(input, preprocessOptions, true);

    // 2) OCR primary provider
    const primaryProvider: OCRProvider = getActiveProvider();
    const primaryRes = await runOcr(pre.processedBuffer, primaryProvider);

    // 3) Parse weight from OCR text
    let parsed = parseWeightFromText(primaryRes.text, {
      expectedUnit: payload.expectedUnit || DEFAULT_SCALE_OPTIONS.expectedUnit,
      requireDecimal: payload.requireDecimal ?? DEFAULT_SCALE_OPTIONS.requireDecimal,
    });

    // 4) Confidence estimation and fallback if needed
    let confidence = estimateConfidence(primaryRes.confidence ?? 0, parsed);
    let providerUsed: OCRProvider = primaryProvider;
    let finalText = primaryRes.text;

    const shouldFallback =
      (!parsed.weight || confidence < 0.6) &&
      DEFAULT_SCALE_OPTIONS.providerFallback &&
      (primaryProvider === 'tesseract' ? isVisionEnabled() : true);

    if (shouldFallback) {
      const secondaryProvider: OCRProvider = primaryProvider === 'tesseract' ? 'google-vision' : 'tesseract';
      try {
        const secondaryRes = await runOcr(pre.processedBuffer, secondaryProvider);
        const parsed2 = parseWeightFromText(secondaryRes.text, {
          expectedUnit: payload.expectedUnit || DEFAULT_SCALE_OPTIONS.expectedUnit,
          requireDecimal: payload.requireDecimal ?? DEFAULT_SCALE_OPTIONS.requireDecimal,
        });
        const confidence2 = estimateConfidence(secondaryRes.confidence ?? 0, parsed2);

        if (confidence2 > confidence) {
          parsed = parsed2;
          confidence = confidence2;
          providerUsed = secondaryProvider;
          finalText = secondaryRes.text;
        }
      } catch (e) {
        // ignore fallback error
      }
    }

    // 5) Normalize to grams (or requested unit), validate range
    let unit = parsed.unit || payload.expectedUnit || WeightUnit.GRAM;
    let weight = parsed.weight;

    if (typeof weight === 'number') {
      const normalizeTarget = payload.convertTo || DEFAULT_SCALE_OPTIONS.convertTo || WeightUnit.GRAM;
      if (unit !== normalizeTarget) {
        weight = convertWeight(weight, unit, normalizeTarget);
        unit = normalizeTarget;
      }
    }

    if (typeof weight === 'number') {
      // sanity clamp
      const min = DEFAULT_SCALE_OPTIONS.minWeight!;
      const max = DEFAULT_SCALE_OPTIONS.maxWeight!;
      if (weight < min || weight > max) {
        confidence = Math.min(confidence, 0.4);
      }
    }

    const url = toUploadsUrl(pre.processedPath);

    const success = typeof weight === 'number' && weight > 0;
    const response: IScaleReadResponse = {
      success,
      weight,
      unit,
      confidence: round2(confidence),
      rawText: finalText,
      processedImageUrl: url,
      error: success ? undefined : 'نتوانستیم وزن را با اطمینان استخراج کنیم',
    };

    logAI('scale-read', success, confidence, Date.now() - started, {
      provider: providerUsed,
      unit,
      weight,
      url,
    });

    return response;
  } catch (error) {
    logger.error('readScale failed', { error });
    return {
      success: false,
      error: (error as Error).message || 'خطای پردازش تصویر',
    };
  }
};

/**
 * Convenience wrapper for reading scale from an uploaded file (multer).
 */
export const readScaleFromFile = async (
  file: Express.Multer.File,
  options?: {
    expectedUnit?: WeightUnit;
    convertTo?: WeightUnit;
    preprocessingOptions?: IImagePreprocessingOptions;
  }
): Promise<IScaleReadResponse> => {
  return readScale({
    image: file.path,
    imageType: 'file',
    preprocessingOptions: options?.preprocessingOptions,
    ...(options?.expectedUnit ? { expectedUnit: options.expectedUnit } : {}),
    ...(options?.convertTo ? { convertTo: options.convertTo } : {}),
  });
};

// ==========================================
// PUBLIC: PRODUCT DETECTION (PLACEHOLDER)
// ==========================================

/**
 * Detect product type/category from image (placeholder).
 * This can be implemented using a custom model or Vision object detection.
 */
export const detectProductFromImage = async (
  input: LoadImageParams
): Promise<IAIProductDetection> => {
  try {
    // For now, we only optimize the image and return a generic suggestion
    // Future: Use a classifier model (e.g., TF/ONNX) or Google Vision object detection.
    const pre = await prepareImageForOCR(input, { saveProcessed: true }, false);

    return {
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
    };
  } catch (error) {
    logger.error('detectProductFromImage failed', { error });
    return {
      image: input.image,
      detected_type: undefined,
      detected_category: undefined,
      confidence: 0.0,
      suggestions: [],
    };
  }
};

// ==========================================
// INTERNAL: OCR RUNNER
// ==========================================

const runOcr = async (image: Buffer, provider: OCRProvider) => {
  if (provider === 'tesseract') {
    return ocrWithTesseract(image);
  }
  if (provider === 'google-vision') {
    return ocrWithVision(image);
  }
  return ocr(image);
};

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
const parseWeightFromText = (
  text: string,
  options?: { expectedUnit?: WeightUnit; requireDecimal?: boolean }
): { weight?: number; unit?: WeightUnit; candidates?: number[]; unitDetected?: string } => {
  const cleaned = normalizeOcrText(text);
  const tokens = numberCandidates(cleaned);
  const unitDetected = detectUnit(cleaned, tokens.indexOf(tokens[0]));

  // Candidate selection
  const preferred = pickBestCandidate(tokens, {
    requireDecimal: options?.requireDecimal ?? false,
  });

  let unit: WeightUnit | undefined = detectUnit(cleaned) || options?.expectedUnit || WeightUnit.GRAM;
  let weight: number | undefined = preferred;

  // Adjust by unit hints in the text
  const unitFromText = detectUnit(cleaned);
  if (unitFromText) {
    unit = unitFromText;
  }

  // If the detected unit is kg/ounce/mithqal -> conversion handled outside
  return { weight, unit, candidates: tokens, unitDetected: unitFromText ? unitFromText : undefined };
};

/**
 * Normalize OCR text: Persian digits -> English, common OCR confusions fixed, unify separators.
 */
const normalizeOcrText = (text: string): string => {
  // Replace Persian digits to English
  let s = toEnglishDigits(text || '');

  // Map common OCR mistakes
  s = s
    .split('')
    .map((ch) => OCR_CHAR_MAP[ch] ?? ch)
    .join('');

  // Normalize separators
  s = s.replace(/[٬,]/g, ','); // thousands separator
  s = s.replace(/[٫]/g, '.');  // decimal separator

  // Collapse multiple spaces
  s = s.replace(/\s+/g, ' ').trim();

  return s;
};

/**
 * Extract plausible numeric candidates from text.
 */
const numberCandidates = (text: string): number[] => {
  const candidates: number[] = [];

  // Convert all commas that are thousands separators to nothing and keep decimals as dot
  // First, create a working copy where commas that are followed by 3 digits act as thousands separators
  let work = text.replace(/(\d),(?=\d{3}(\D|$))/g, '$1'); // remove thousand commas
  work = work.replace(/,/g, '.'); // any remaining comma -> dot

  // Replace any stray non-numeric/non-dot with space, then split
  work = work.replace(/[^0-9.\-]+/g, ' ');

  const parts = work.split(' ').filter(Boolean);

  for (const p of parts) {
    if (!p) continue;
    // Keep at most one dot and optional leading minus
    const m = p.match(/^-?\d+(?:\.\d+)?$/);
    if (m) {
      const n = parseFloat(m[0]);
      if (isFinite(n)) {
        candidates.push(n);
      }
    }
  }

  // De-duplicate and sort by "preference": decimals first, then by descending value
  const unique = Array.from(new Set(candidates));
  unique.sort((a, b) => {
    const aDec = hasDecimal(a);
    const bDec = hasDecimal(b);
    if (aDec !== bDec) return aDec ? -1 : 1; // decimals first
    return b > a ? 1 : -1; // larger values next
  });

  return unique;
};

const pickBestCandidate = (cands: number[], opts: { requireDecimal: boolean }): number | undefined => {
  if (!cands.length) return undefined;

  if (opts.requireDecimal) {
    const withDec = cands.filter((n) => hasDecimal(n));
    if (withDec.length) {
      return withDec[0];
    }
  }
  return cands[0];
};

const hasDecimal = (n: number) => Math.abs(n % 1) > 0.000001;

/**
 * Detect unit keywords from the text.
 */
const detectUnit = (text: string, _idx?: number): WeightUnit | undefined => {
  const t = text.toLowerCase();

  // grams
  if (/\b(g|gr|grams?)\b/.test(t) || /گرم/.test(t)) {
    return WeightUnit.GRAM;
  }

  // kilograms
  if (/\b(kg|kilograms?)\b/.test(t) || /کیلو/.test(t)) {
    return WeightUnit.KILOGRAM;
  }

  // mithqal (مثقال)
  if (/مثقال/.test(t) || /\bmith?q(al)?\b/.test(t)) {
    return WeightUnit.MITHQAL;
  }

  // ounce (troy)
  if (/\b(oz|ozt|ounce)\b/.test(t) || /اونس/.test(t)) {
    return WeightUnit.OUNCE;
  }

  return undefined;
};

// ==========================================
// INTERNAL: UNIT CONVERSION & CONFIDENCE
// ==========================================

/**
 * Convert weight between units to grams (default) or others.
 */
const convertWeight = (value: number, fromUnit: WeightUnit, toUnit: WeightUnit): number => {
  if (fromUnit === toUnit) return value;

  // Convert source to grams
  let grams = value;
  switch (fromUnit) {
    case WeightUnit.KILOGRAM:
      grams = value * 1000;
      break;
    case WeightUnit.MITHQAL:
      grams = value * 4.608;
      break;
    case WeightUnit.OUNCE:
      grams = value * 31.1035;
      break;
    case WeightUnit.GRAM:
    default:
      grams = value;
  }

  // Convert grams -> target
  switch (toUnit) {
    case WeightUnit.KILOGRAM:
      return grams / 1000;
    case WeightUnit.MITHQAL:
      return grams / 4.608;
    case WeightUnit.OUNCE:
      return grams / 31.1035;
    case WeightUnit.GRAM:
    default:
      return grams;
  }
};

const estimateConfidence = (
  providerConfidence: number,
  parsed: { weight?: number; unit?: WeightUnit; candidates?: number[] }
): number => {
  let score = providerConfidence || 0.5;

  // Bonus if we found a numeric value
  if (typeof parsed.weight === 'number') score += 0.2;

  // Bonus if unit detected
  if (parsed.unit) score += 0.05;

  // Penalize multiple candidates (ambiguity)
  const cands = parsed.candidates || [];
  if (cands.length > 1) score -= Math.min(0.1, (cands.length - 1) * 0.03);

  // Favor 2 or 3 decimal places (common for jewelry scales)
  if (typeof parsed.weight === 'number') {
    const decimals = decimalPlaces(parsed.weight);
    if (decimals === 2 || decimals === 3) score += 0.05;
  }

  // Clamp to [0,1]
  score = Math.max(0, Math.min(1, score));
  return score;
};

const decimalPlaces = (n: number): number => {
  const s = n.toString();
  const idx = s.indexOf('.');
  return idx === -1 ? 0 : s.length - idx - 1;
};

const round2 = (n?: number) => (typeof n === 'number' ? Math.round(n * 100) / 100 : undefined);

// Convert a file path under uploads/* to a public URL (/uploads/...)
const toUploadsUrl = (filePath?: string): string | undefined => {
  if (!filePath) return undefined;
  const norm = filePath.replace(/\\/g, '/');
  const idx = norm.lastIndexOf('/uploads/');
  if (idx >= 0) {
    return norm.substring(idx);
  }
  if (norm.startsWith('uploads/')) {
    return '/' + norm;
  }
  // If saved in scale path, build relative
  if (norm.includes(UPLOAD_CONFIG.SCALE_PATH)) {
    const base = norm.substring(norm.indexOf(UPLOAD_CONFIG.SCALE_PATH));
    return '/' + base;
  }
  // Fallback: return original
  return norm;
};

// Guess input type when not provided explicitly
const guessInputType = (image: string): 'base64' | 'file' | 'url' => {
  if (!image) return 'file';
  if (image.startsWith('http://') || image.startsWith('https://')) return 'url';
  if (image.startsWith('data:image/')) return 'base64';
  return 'file';
};

// ==========================================
// EXPORTS (default grouped)
// ==========================================

export default {
  readScale,
  readScaleFromFile,
  detectProductFromImage,
};