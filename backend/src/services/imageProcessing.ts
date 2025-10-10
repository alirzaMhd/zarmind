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

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';

import { AI_CONFIG, UPLOAD_CONFIG } from '../config/server';
import logger, { logAI, logFile } from '../utils/logger';
import { IImagePreprocessingOptions } from '../types';
import { generateRandomString } from '../utils/helpers';

// ==========================================
// TYPES
// ==========================================

export type InputImageType = 'base64' | 'file' | 'url';

export interface LoadImageParams {
  image: string;                  // base64 string | file path | url
  imageType?: InputImageType;     // default: auto-detect
}

export interface SaveImageOptions {
  dir?: string;                   // destination directory
  filenamePrefix?: string;        // filename prefix
  ext?: 'png' | 'jpg' | 'jpeg' | 'webp'; // force format when saving
  keepOriginalExt?: boolean;      // when saving original input
}

export interface PreprocessOptions extends IImagePreprocessingOptions {
  // Extra options
  trim?: boolean;                 // remove uniform borders (auto-crop)
  invert?: boolean;               // invert colors (useful for LED displays)
  normalize?: boolean;            // histogram normalization
  rotateAuto?: boolean;           // auto-rotate based on EXIF orientation
  resizeWidth?: number;           // target width (px)
  saveDebugSteps?: boolean;       // save pipeline steps
  debugDir?: string;              // where to save debug images
  saveProcessed?: boolean;        // save final processed image
  processedPrefix?: string;       // prefix for processed file
}

export interface PreprocessResult {
  buffer: Buffer;                 // processed buffer
  width?: number;
  height?: number;
  savedPath?: string;             // saved path (if saveProcessed)
  steps?: string[];               // descriptions of pipeline steps
  debugPaths?: string[];          // saved debug step files
}

// ==========================================
// CONSTANTS / DEFAULTS
// ==========================================

const DEFAULTS = {
  resizeWidth: AI_CONFIG.IMAGE_PREPROCESSING.RESIZE_WIDTH || 1200,
  grayscale: AI_CONFIG.IMAGE_PREPROCESSING.GRAYSCALE ?? true,
  normalize: AI_CONFIG.IMAGE_PREPROCESSING.NORMALIZE ?? true,
  sharpen: AI_CONFIG.IMAGE_PREPROCESSING.SHARPEN ?? true,
  denoise: AI_CONFIG.IMAGE_PREPROCESSING.DENOISE ?? true,
};

// Ensure target directories exist at import time
const ensureDir = async (dir: string) => {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch { /* ignore */ }
};
void ensureDir(UPLOAD_CONFIG.TEMP_PATH);
void ensureDir(UPLOAD_CONFIG.SCALE_PATH);

// ==========================================
// UTILS (BASE64 / MIME / EXT)
// ==========================================

const dataUrlRegex = /^data:(?<mime>image\/[a-zA-Z0-9+.-]+);base64,(?<data>.+)$/;

const extFromMime = (mime?: string): 'png' | 'jpg' | 'jpeg' | 'webp' => {
  if (!mime) return 'png';
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  return 'png';
};

const extFromPathOrMime = (p?: string, mime?: string): 'png' | 'jpg' | 'jpeg' | 'webp' => {
  if (p) {
    const ext = path.extname(p).toLowerCase().replace('.', '');
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return ext as any;
  }
  return extFromMime(mime);
};

const stripBase64Prefix = (input: string): { mime?: string; data: string } => {
  const match = input.match(dataUrlRegex);
  if (match && match.groups) {
    return { mime: match.groups.mime, data: match.groups.data };
  }
  return { data: input };
};

// ==========================================
// LOADING
// ==========================================

/**
 * Load an image into Buffer from base64 | file path | url
 */
export const loadImageBuffer = async (params: LoadImageParams): Promise<{ buffer: Buffer; extGuess: 'png' | 'jpg' | 'jpeg' | 'webp' }> => {
  const started = Date.now();
  let imageType: InputImageType | undefined = params.imageType;

  // Auto-detect by pattern if not provided
  if (!imageType) {
    if (params.image.startsWith('http://') || params.image.startsWith('https://')) {
      imageType = 'url';
    } else if (params.image.startsWith('data:image/')) {
      imageType = 'base64';
    } else {
      imageType = 'file';
    }
  }

  try {
    if (imageType === 'base64') {
      const { mime, data } = stripBase64Prefix(params.image.trim());
      const buffer = Buffer.from(data, 'base64');
      return { buffer, extGuess: extFromMime(mime) };
    }

    if (imageType === 'file') {
      const filePath = params.image;
      const buffer = await fs.readFile(filePath);
      return { buffer, extGuess: extFromPathOrMime(filePath) };
    }

    // url
    const url = params.image;
    const resp = await axios.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(resp.data);
    const contentType = resp.headers['content-type'] as string | undefined;
    return { buffer, extGuess: extFromPathOrMime(url, contentType) };
  } catch (error) {
    logger.error('Failed to load image', { sourceType: imageType, error });
    throw error;
  } finally {
    logAI('load-image', true, undefined, Date.now() - started, { type: imageType });
  }
};

// ==========================================
// SAVING
// ==========================================

/**
 * Save a buffer to disk as an image file.
 */
export const saveBufferAsImage = async (
  buffer: Buffer,
  options: SaveImageOptions = {}
): Promise<string> => {
  const dir = options.dir || UPLOAD_CONFIG.TEMP_PATH;
  await ensureDir(dir);

  let ext = options.ext || 'png';
  if (options.keepOriginalExt && !options.ext) {
    ext = 'png';
  }

  const prefix = options.filenamePrefix || 'img';
  const filename = `${prefix}-${Date.now()}-${generateRandomString(6)}.${ext}`;
  const filePath = path.join(dir, filename);

  await fs.writeFile(filePath, buffer);
  logFile('upload', filename, true, buffer.byteLength);

  return filePath;
};

// ==========================================
// PREPROCESSING PIPELINES
// ==========================================

/**
 * Build a Sharp pipeline for OCR enhancement.
 */
const buildOcrPipeline = async (
  input: Buffer,
  opts: PreprocessOptions,
  steps: string[],
  debugPaths: string[]
): Promise<sharp.Sharp> => {
  let img = sharp(input, { failOnError: false });

  // Auto-rotate based on EXIF
  if (opts.rotateAuto ?? true) {
    img = img.rotate();
    steps.push('rotate:auto');
  }

  const meta = await img.metadata();
  const currentWidth = meta.width || 0;
  const targetWidth = opts.resizeWidth || DEFAULTS.resizeWidth;

  // Resize to target width (avoid upscaling too much)
  if (opts.resize ?? true) {
    if (currentWidth > 0 && currentWidth > targetWidth) {
      img = img.resize({ width: targetWidth, withoutEnlargement: true });
      steps.push(`resize:${targetWidth}`);
    } else if (currentWidth === 0) {
      // metadata missing; still constrain width
      img = img.resize({ width: targetWidth, withoutEnlargement: true });
      steps.push(`resize:${targetWidth}`);
    }
  }

  // Optional auto-trim (remove uniform borders)
  if (opts.trim ?? true) {
    // sharp.trim trims by removing surrounding border
    img = img.trim();
    steps.push('trim');
  }

  // Grayscale
  if (opts.grayscale ?? DEFAULTS.grayscale) {
    img = img.grayscale();
    steps.push('grayscale');
  }

  // Normalize histogram
  if (opts.normalize ?? DEFAULTS.normalize) {
    img = img.normalize();
    steps.push('normalize');
  }

  // Boost contrast (simple linear)
  if (opts.contrast ?? true) {
    img = img.linear(1.15, -10); // tweak as needed
    steps.push('contrast:+');
  }

  // Denoise (light)
  if (opts.denoise ?? DEFAULTS.denoise) {
    img = img.median(1);
    steps.push('denoise:median(1)');
  }

  // Sharpen (moderate)
  if (opts.sharpen ?? DEFAULTS.sharpen) {
    img = img.sharpen(1);
    steps.push('sharpen');
  }

  // Threshold for binary images (often helps OCR on LED/LCD digits)
  if (opts.threshold ?? true) {
    img = img.threshold(128);
    steps.push('threshold:128');
  }

  // Invert colors (sometimes necessary, optional)
  if (opts.invert) {
    img = img.negate();
    steps.push('invert');
  }

  return img;
};

/**
 * Preprocess an image buffer for OCR (scale display / receipts).
 */
export const preprocessForOCR = async (
  input: Buffer,
  options: PreprocessOptions = {}
): Promise<PreprocessResult> => {
  const started = Date.now();
  const steps: string[] = [];
  const debugPaths: string[] = [];

  const opts: PreprocessOptions = {
    rotateAuto: true,
    trim: true,
    grayscale: DEFAULTS.grayscale,
    normalize: DEFAULTS.normalize,
    contrast: true,
    denoise: DEFAULTS.denoise,
    sharpen: DEFAULTS.sharpen,
    threshold: true,
    resize: true,
    resizeWidth: DEFAULTS.resizeWidth,
    saveProcessed: false,
    saveDebugSteps: false,
    debugDir: UPLOAD_CONFIG.TEMP_PATH,
    processedPrefix: 'ocr',
    ...options,
  };

  try {
    let img = await buildOcrPipeline(input, opts, steps, debugPaths);

    if (opts.saveDebugSteps) {
      // Save snapshot before final output (optional)
      const dbg = await img.clone().png().toBuffer();
      const dbgPath = await saveBufferAsImage(dbg, {
        dir: opts.debugDir,
        filenamePrefix: 'debug-ocr',
        ext: 'png',
      });
      debugPaths.push(dbgPath);
    }

    const buffer = await img.png().toBuffer();
    const meta2 = await sharp(buffer).metadata();
    let savedPath: string | undefined;

    if (opts.saveProcessed) {
      savedPath = await saveBufferAsImage(buffer, {
        dir: opts.debugDir || UPLOAD_CONFIG.TEMP_PATH,
        filenamePrefix: opts.processedPrefix || 'ocr',
        ext: 'png',
      });
    }

    logAI('preprocess-ocr', true, undefined, Date.now() - started, {
      steps,
      width: meta2.width,
      height: meta2.height,
      savedPath,
    });

    return {
      buffer,
      width: meta2.width,
      height: meta2.height,
      savedPath,
      steps,
      debugPaths,
    };
  } catch (error) {
    logger.error('preprocessForOCR failed', { error });
    throw error;
  }
};

// ==========================================
// COMBINED UTILITIES
// ==========================================

/**
 * Load, preprocess, and optionally save original + processed files.
 * Handy for endpoints that accept file/base64/url and need a ready file.
 */
export const prepareImageForOCR = async (
  input: LoadImageParams,
  preprocessOptions: PreprocessOptions = {},
  saveOriginal: boolean = false
): Promise<{
  originalPath?: string;
  processedPath?: string;
  processedBuffer: Buffer;
  steps?: string[];
  width?: number;
  height?: number;
}> => {
  const { buffer, extGuess } = await loadImageBuffer(input);

  let originalPath: string | undefined;
  if (saveOriginal) {
    originalPath = await saveBufferAsImage(buffer, {
      dir: UPLOAD_CONFIG.SCALE_PATH,
      filenamePrefix: 'original',
      ext: extGuess,
    });
  }

  const pre = await preprocessForOCR(buffer, {
    saveProcessed: true,
    debugDir: UPLOAD_CONFIG.SCALE_PATH,
    processedPrefix: 'processed',
    ...preprocessOptions,
  });

  return {
    originalPath,
    processedPath: pre.savedPath,
    processedBuffer: pre.buffer,
    steps: pre.steps,
    width: pre.width,
    height: pre.height,
  };
};

/**
 * Quick helper to downscale and compress a generic image (not necessarily for OCR).
 */
export const optimizeGenericImage = async (
  input: LoadImageParams,
  maxWidth: number = 1600,
  quality: number = 80,
  toWebp: boolean = false
): Promise<{ outputPath: string; width?: number; height?: number }> => {
  const { buffer, extGuess } = await loadImageBuffer(input);
  const started = Date.now();

  let img = sharp(buffer, { failOnError: false }).rotate();
  const meta = await img.metadata();

  if (meta.width && meta.width > maxWidth) {
    img = img.resize({ width: maxWidth, withoutEnlargement: true });
  }

  if (toWebp) {
    img = img.webp({ quality });
  } else if (extGuess === 'jpg' || extGuess === 'jpeg') {
    img = img.jpeg({ quality, mozjpeg: true });
  } else if (extGuess === 'png') {
    img = img.png({ quality });
  } else if (extGuess === 'webp') {
    img = img.webp({ quality });
  } else {
    img = img.png({ quality });
  }

  const outBuf = await img.toBuffer();
  const outPath = await saveBufferAsImage(outBuf, {
    dir: UPLOAD_CONFIG.UPLOAD_PATH,
    filenamePrefix: 'optimized',
    ext: toWebp ? 'webp' : extGuess,
  });

  const meta2 = await sharp(outBuf).metadata();
  logAI('optimize-image', true, undefined, Date.now() - started, {
    outPath,
    width: meta2.width,
    height: meta2.height,
  });

  return { outputPath: outPath, width: meta2.width, height: meta2.height };
};

// ==========================================
// EXPORTS
// ==========================================

export default {
  // Loading
  loadImageBuffer,

  // Saving
  saveBufferAsImage,

  // Preprocessing
  preprocessForOCR,
  prepareImageForOCR,

  // Generic
  optimizeGenericImage,
};