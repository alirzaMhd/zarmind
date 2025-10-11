// ==========================================
// ZARMIND - Upload Middleware (Multer + Helpers)
// ==========================================

import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import sharp from 'sharp';

import { UPLOAD_CONFIG } from '../config/server';
import logger, { logFile } from '../utils/logger';
import { generateRandomString } from '../utils/helpers';

// ==========================================
// DIRECTORY SETUP
// ==========================================

const ensureDir = (dir: string) => {
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  } catch (err) {
    logger.error(`Failed to ensure upload directory: ${dir}`, err);
  }
};

// Ensure all upload directories exist
[
  UPLOAD_CONFIG.UPLOAD_PATH,
  UPLOAD_CONFIG.TEMP_PATH,
  UPLOAD_CONFIG.PRODUCTS_PATH,
  UPLOAD_CONFIG.SCALE_PATH,
  UPLOAD_CONFIG.DOCUMENTS_PATH,
  UPLOAD_CONFIG.AVATARS_PATH,
].forEach(ensureDir);

// ==========================================
// FILENAME + FILTER HELPERS
// ==========================================

const sanitizeFilename = (name: string): string => {
  // Remove directory traversal and unsafe chars
  const base = path.basename(name, path.extname(name));
  const safe = base
    .replace(/[^a-zA-Z0-9_\-\.]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 64);

  return safe || 'file';
};

const uniqueFilename = (originalname: string): string => {
  const ext = path.extname(originalname || '').toLowerCase();
  const name = sanitizeFilename(originalname);
  const stamp = `${Date.now()}-${generateRandomString(6)}`;
  return `${name}-${stamp}${ext}`;
};

const isAllowedExt = (ext: string, allowed: readonly string[] | string[]) => {
  const clean = ext.toLowerCase().replace('.', '');
  return allowed.includes(clean);
};

const isImageMime = (mime: string) => mime.startsWith('image/');

// ==========================================
// MULTER FACTORY
// ==========================================

interface UploaderOptions {
  dest: string;
  allowedExtensions?: readonly string[] | string[];
  maxFileSize?: number;
  preserveOriginalName?: boolean;
}

const createUploader = (opts: UploaderOptions): multer.Multer => {
  const {
    dest,
    allowedExtensions = UPLOAD_CONFIG.ALLOWED_ALL_TYPES,
    maxFileSize = UPLOAD_CONFIG.MAX_FILE_SIZE,
    preserveOriginalName = false,
  } = opts;

  ensureDir(dest);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      try {
        const ext = path.extname(file.originalname || '').toLowerCase();
        const filename = preserveOriginalName
          ? `${sanitizeFilename(file.originalname)}`
          : uniqueFilename(file.originalname || `file${ext || '.bin'}`);
        cb(null, filename);
      } catch (err) {
        cb(err as any, '');
      }
    },
  });

  const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const allowed = isAllowedExt(ext, allowedExtensions);

    // For images, also validate mimetype for extra safety
    if (allowed && isImageMime(file.mimetype)) {
      return cb(null, true);
    }

    if (allowed) return cb(null, true);

    const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname);
    (err as any).message = 'نوع فایل مجاز نیست';
    return cb(err);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxFileSize },
  });
};

// ==========================================
// PRECONFIGURED UPLOADERS
// ==========================================

export const avatarUploader = createUploader({
  dest: UPLOAD_CONFIG.AVATARS_PATH,
  allowedExtensions: UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES,
});

export const productImageUploader = createUploader({
  dest: UPLOAD_CONFIG.PRODUCTS_PATH,
  allowedExtensions: UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES,
});

export const scaleImageUploader = createUploader({
  dest: UPLOAD_CONFIG.SCALE_PATH,
  allowedExtensions: UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES,
});

export const documentUploader = createUploader({
  dest: UPLOAD_CONFIG.DOCUMENTS_PATH,
  allowedExtensions: UPLOAD_CONFIG.ALLOWED_DOCUMENT_TYPES,
});

export const anyUploader = createUploader({
  dest: UPLOAD_CONFIG.UPLOAD_PATH,
  allowedExtensions: UPLOAD_CONFIG.ALLOWED_ALL_TYPES,
});

// ==========================================
// READY-TO-USE MIDDLEWARES
// ==========================================

// Single
export const uploadAvatar = avatarUploader.single('avatar');
export const uploadProductImage = productImageUploader.single('image');
export const uploadScaleImage = scaleImageUploader.single('image');
export const uploadDocumentFile = documentUploader.single('file');

// Multiple (arrays)
export const uploadProductImages = productImageUploader.array('images', 10);

// Fields (example usage: router.post(..., uploadMixedFields, ...))
export const uploadMixedFields = productImageUploader.fields([
  { name: 'images', maxCount: 10 },
  { name: 'thumbnail', maxCount: 1 },
]);

// Factory for custom single field usage
export const createSingleUpload =
  (opts: UploaderOptions, fieldName: string) => createUploader(opts).single(fieldName);

// Factory for multiple files (array)
export const createArrayUpload =
  (opts: UploaderOptions, fieldName: string, maxCount: number = 10) =>
    createUploader(opts).array(fieldName, maxCount);

// ==========================================
// IMAGE OPTIMIZATION (Sharp)
// ==========================================

export interface ImageOptimizeOptions {
  maxWidth?: number;       // Default: 1600
  maxHeight?: number;      // Optional
  quality?: number;        // Default: 80
  format?: 'jpeg' | 'jpg' | 'png' | 'webp'; // Default: keep original
  toWebp?: boolean;        // Convert to webp (overrides format)
  grayscale?: boolean;
  removeMetadata?: boolean;
}

/**
 * Optimize an image file on disk (in-place or as new file).
 * Returns path to optimized file (may be the same as input if overwritten).
 */
export const optimizeImage = async (
  filePath: string,
  options: ImageOptimizeOptions = {}
): Promise<string> => {
  const {
    maxWidth = 1600,
    maxHeight,
    quality = 80,
    toWebp = false,
    format,
    grayscale = false,
    removeMetadata = true,
  } = options;

  try {
    const ext = path.extname(filePath).toLowerCase();
    const dir = path.dirname(filePath);
    const base = path.basename(filePath, ext);

    const image = sharp(filePath);

    const metadata = await image.metadata();

    // Resize only if larger than target
    if ((metadata.width && metadata.width > maxWidth) || (maxHeight && metadata.height && metadata.height > maxHeight)) {
      image.resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    if (grayscale) image.grayscale();
    if (removeMetadata) image.withMetadata({}); // clears metadata when re-encoding

    let outputExt = ext;
    if (toWebp) {
      image.webp({ quality });
      outputExt = '.webp';
    } else if (format) {
      switch (format) {
        case 'jpeg':
        case 'jpg':
          image.jpeg({ quality, mozjpeg: true });
          outputExt = '.jpg';
          break;
        case 'png':
          image.png({ quality });
          outputExt = '.png';
          break;
        case 'webp':
          image.webp({ quality });
          outputExt = '.webp';
          break;
      }
    }

    const outPath = toWebp || format ? path.join(dir, `${base}${outputExt}`) : filePath;

    await image.toFile(outPath);

    // If created a new file format (e.g. webp), optionally remove original
    if (outPath !== filePath) {
      try {
        await fsp.unlink(filePath);
      } catch {
        // ignore
      }
    }

    logFile('upload', path.basename(outPath), true);
    return outPath;
  } catch (error) {
    logger.error('Image optimization failed', { filePath, error });
    return filePath; // fallback to original
  }
};

// ==========================================
// CLEANUP HELPERS
// ==========================================

/**
 * Remove a file from disk safely
 */
export const removeFile = async (filePath?: string): Promise<void> => {
  if (!filePath) return;
  try {
    await fsp.unlink(filePath);
    logFile('delete', path.basename(filePath), true);
  } catch (error) {
    // Ignore missing files
    logger.warn('Failed to remove file (maybe already deleted)', { filePath });
  }
};

/**
 * Middleware to cleanup uploaded file(s) on error
 * Use immediately after upload middleware in the route chain
 */
export const cleanupOnError =
  (fields: Array<'file' | 'files'> = ['file', 'files']) =>
  async (err: any, req: Request, _res: Response, next: NextFunction) => {
    const paths: string[] = [];

    if (fields.includes('file') && (req as any).file?.path) {
      paths.push((req as any).file.path);
    }

    if (fields.includes('files') && Array.isArray((req as any).files)) {
      ((req as any).files as Express.Multer.File[]).forEach((f) => f?.path && paths.push(f.path));
    }

    await Promise.all(paths.map(removeFile));
    next(err);
  };

// ==========================================
// MULTER ERROR HANDLER (Optional)
// ==========================================

/**
 * Use after upload middleware in routes to provide friendly errors.
 * Note: Global error middleware also handles MulterError; this is a convenience handler.
 */
export const multerErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    let message = 'خطا در بارگذاری فایل';
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

// ==========================================
// EXPORT DEFAULT (Group)
// ==========================================

export default {
  // Uploaders (instances)
  avatarUploader,
  productImageUploader,
  scaleImageUploader,
  documentUploader,
  anyUploader,

  // Ready-made middlewares
  uploadAvatar,
  uploadProductImage,
  uploadScaleImage,
  uploadDocumentFile,
  uploadProductImages,
  uploadMixedFields,

  // Factories
  createSingleUpload,
  createArrayUpload,

  // Helpers
  optimizeImage,
  removeFile,
  cleanupOnError,
  multerErrorHandler,
};