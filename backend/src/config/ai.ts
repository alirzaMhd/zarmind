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

import * as fs from 'fs';
import { AI_CONFIG } from './server';
import logger, { logAI } from '../utils/logger';

// Lazy imports to reduce cold-start time
let Tesseract: any; // tesseract.js (createWorker)
let Vision: any; // @google-cloud/vision (ImageAnnotatorClient)

// ==========================================
// TYPES
// ==========================================

export type OCRProvider = 'tesseract' | 'google-vision';

export interface OcrResult {
  provider: OCRProvider;
  text: string;
  confidence?: number; // normalized: 0..1
  raw?: any; // raw provider response for debugging
}

// ==========================================
// STATE (SINGLETONS)
// ==========================================

let tesseractWorker: any | null = null;
let visionClient: any | null = null;

// ==========================================
// PROVIDER SELECTION
// ==========================================

export const getActiveProvider = (): OCRProvider => {
  return AI_CONFIG.SERVICE;
};

export const isVisionEnabled = (): boolean => {
  return AI_CONFIG.GOOGLE_VISION.ENABLED === true;
};

// ==========================================
// TESSERACT (LAZY INIT)
// ==========================================

/**
 * Initialize and return a singleton Tesseract worker.
 */
export const getTesseractWorker = async (): Promise<any> => {
  if (tesseractWorker) return tesseractWorker;

  const started = Date.now();
  try {
    if (!Tesseract) {
      // Dynamic import
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      Tesseract = require('tesseract.js');
    }

    const { LANG, OEM, PSM } = AI_CONFIG.TESSERACT;

    const loggerEnabled = process.env.NODE_ENV !== 'production';
    tesseractWorker = Tesseract.createWorker({
      // Tesseract logger is noisy; log in dev only
      logger: loggerEnabled ? (m: any) => logger.debug('tesseract', m) : undefined,
      cacheMethod: 'none',
    });

    await tesseractWorker.load();
    await tesseractWorker.loadLanguage(LANG);
    await tesseractWorker.initialize(LANG);

    // Set recognition parameters
    // numeric whitelist, pageseg mode, dpi, etc.
    if (tesseractWorker.setParameters) {
      await tesseractWorker.setParameters({
        tessedit_char_whitelist: '0123456789.,-',
        tessedit_pageseg_mode: String(PSM ?? 7), // default to single line
        user_defined_dpi: '300',
        classify_bln_numeric_mode: '1',
      });
    }

    logAI('tesseract-init', true, undefined, Date.now() - started, {
      lang: LANG,
      psm: PSM,
      oem: OEM,
    });

    return tesseractWorker;
  } catch (error) {
    tesseractWorker = null;
    logger.error('Failed to initialize Tesseract worker', { error });
    throw error;
  }
};

/**
 * OCR using Tesseract.js
 */
export const ocrWithTesseract = async (
  image: string | Buffer
): Promise<OcrResult> => {
  const started = Date.now();
  const worker = await getTesseractWorker();

  const result = await worker.recognize(image);
  const text: string = result?.data?.text ?? '';
  const confidenceRaw: number = result?.data?.confidence ?? 0;
  const confidence = Math.max(0, Math.min(1, confidenceRaw / 100)); // normalize 0..1

  logAI('ocr-tesseract', true, confidence, Date.now() - started, {
    length: text.length,
  });

  return {
    provider: 'tesseract',
    text,
    confidence,
    raw: result,
  };
};

/**
 * Shutdown Tesseract worker (graceful).
 */
export const terminateTesseract = async (): Promise<void> => {
  if (!tesseractWorker) return;
  try {
    await tesseractWorker.terminate();
  } catch (err) {
    // ignore
  } finally {
    tesseractWorker = null;
  }
};

// ==========================================
// GOOGLE VISION (LAZY INIT)
// ==========================================

/**
 * Initialize and return a singleton Google Vision client.
 * Requires GOOGLE_APPLICATION_CREDENTIALS or direct credentials.
 */
export const getVisionClient = async (): Promise<any> => {
  if (visionClient) return visionClient;

  const started = Date.now();
  try {
    if (!Vision) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      Vision = require('@google-cloud/vision');
    }

    const options: Record<string, any> = {};
    // Prefer Application Default Credentials
    // If GOOGLE_APPLICATION_CREDENTIALS is set, @google-cloud/vision will use it.
    // Optionally allow keyFilename or credentials via env if provided.
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
      options.keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    } else if (process.env.GOOGLE_VISION_CREDENTIALS) {
      // Accept raw JSON (or base64-encoded JSON) credentials via env
      try {
        const jsonStr = isBase64(process.env.GOOGLE_VISION_CREDENTIALS)
          ? Buffer.from(process.env.GOOGLE_VISION_CREDENTIALS, 'base64').toString('utf8')
          : process.env.GOOGLE_VISION_CREDENTIALS;
        const creds = JSON.parse(jsonStr);
        options.credentials = creds;
      } catch (e) {
        logger.warn('Invalid GOOGLE_VISION_CREDENTIALS. Expect raw JSON or base64-JSON.');
      }
    }

    if (AI_CONFIG.GOOGLE_VISION.PROJECT_ID) {
      options.projectId = AI_CONFIG.GOOGLE_VISION.PROJECT_ID;
    }

    visionClient = new Vision.ImageAnnotatorClient(options);

    logAI('vision-init', true, undefined, Date.now() - started, options.projectId ? { projectId: options.projectId } : undefined);

    return visionClient;
  } catch (error) {
    visionClient = null;
    logger.error('Failed to initialize Google Vision client', { error });
    throw error;
  }
};

/**
 * OCR using Google Cloud Vision (Document Text Detection preferred).
 */
export const ocrWithVision = async (
  image: string | Buffer
): Promise<OcrResult> => {
  const started = Date.now();
  const client = await getVisionClient();

  // Build request
  const request: any = {
    image: {},
  };

  if (Buffer.isBuffer(image)) {
    request.image.content = image.toString('base64');
  } else if (isHttpUrl(image)) {
    request.image.source = { imageUri: image };
  } else {
    // treat as file path
    request.image.content = fs.readFileSync(image).toString('base64');
  }

  // Prefer documentTextDetection for dense text; fallback to textDetection
  let response, text = '';
  try {
    [response] = await client.documentTextDetection(request);
    text = response?.fullTextAnnotation?.text ?? '';
    if (!text) {
      [response] = await client.textDetection(request);
      const anns = response?.textAnnotations;
      text = anns && anns.length > 0 ? anns[0].description || '' : '';
    }
  } catch (err) {
    logger.warn('Vision documentTextDetection failed, trying textDetection...', { err });
    [response] = await client.textDetection(request);
    const anns = response?.textAnnotations;
    text = anns && anns.length > 0 ? anns[0].description || '' : '';
  }

  // Vision API does not provide a single global confidence for full text.
  // Estimate confidence as 0.9 if we got any text; 0.0 otherwise.
  const confidence = text ? 0.9 : 0.0;

  logAI('ocr-vision', true, confidence, Date.now() - started, {
    length: text.length,
  });

  return {
    provider: 'google-vision',
    text,
    confidence,
    raw: response,
  };
};

// ==========================================
// UNIFIED OCR
// ==========================================

/**
 * Unified OCR helper that uses the active provider, but allows overrides.
 */
export const ocr = async (
  image: string | Buffer,
  provider?: OCRProvider
): Promise<OcrResult> => {
  const chosen = provider || getActiveProvider();

  if (chosen === 'google-vision') {
    if (!isVisionEnabled()) {
      logger.warn('Google Vision requested but not enabled; falling back to Tesseract');
      return ocrWithTesseract(image);
    }
    return ocrWithVision(image);
  }

  // Default: Tesseract
  return ocrWithTesseract(image);
};

// ==========================================
// HEALTH & UTILITIES
// ==========================================

/**
 * Quick provider health check (initializes if needed).
 */
export const healthCheckAI = async (): Promise<{
  provider: OCRProvider;
  initialized: boolean;
  visionEnabled: boolean;
}> => {
  const provider = getActiveProvider();
  try {
    if (provider === 'tesseract') {
      await getTesseractWorker();
    } else if (provider === 'google-vision' && isVisionEnabled()) {
      await getVisionClient();
    }
    return {
      provider,
      initialized: true,
      visionEnabled: isVisionEnabled(),
    };
  } catch (err) {
    return {
      provider,
      initialized: false,
      visionEnabled: isVisionEnabled(),
    };
  }
};

/**
 * Graceful shutdown of AI resources.
 */
export const shutdownAI = async (): Promise<void> => {
  await terminateTesseract();
  // Vision client does not need explicit shutdown
};

// ==========================================
// HELPERS (INTERNAL)
// ==========================================

function isHttpUrl(value: any): boolean {
  return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
}

function isBase64(str: string): boolean {
  try {
    return Buffer.from(str, 'base64').toString('base64') === str.replace(/\s/g, '');
  } catch {
    return false;
  }
}

// ==========================================
// DEFAULT EXPORT (grouped)
// ==========================================

export default {
  // Provider
  getActiveProvider,
  isVisionEnabled,

  // Tesseract
  getTesseractWorker,
  ocrWithTesseract,
  terminateTesseract,

  // Vision
  getVisionClient,
  ocrWithVision,

  // Unified OCR
  ocr,

  // Health & lifecycle
  healthCheckAI,
  shutdownAI,
};