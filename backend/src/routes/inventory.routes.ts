// ==========================================
// ZARMIND - Inventory Routes
// ==========================================

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

import inventoryController from '../controllers/inventoryController';
import { validators, validate } from '../middleware/validation.middleware';
import {
  authenticate,
  isAdminOrManager,
  isEmployee,
} from '../middleware/auth.middleware';
import { UPLOAD_CONFIG } from '../config/server';
import { ProductCategory, ProductType } from '../types';

const router = Router();

// ==========================================
// Multer setup for product images
// ==========================================

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

ensureDir(UPLOAD_CONFIG.PRODUCTS_PATH);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_CONFIG.PRODUCTS_PATH);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, name);
  },
});

const imageFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowed = UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES;
  const ext = path.extname(file.originalname || '').toLowerCase().replace('.', '');
  const mimeOk = file.mimetype.startsWith('image/');
  if (!mimeOk || !allowed.includes(ext)) {
    return cb(new Error('نوع فایل تصویر مجاز نیست'));
  }
  cb(null, true);
};

const uploadImage = multer({
  storage,
  limits: { fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE },
  fileFilter: imageFileFilter,
});

// ==========================================
// Helpers
// ==========================================

const isValidCategory = (val: any) =>
  val === undefined || Object.values(ProductCategory).includes(val);
const isValidType = (val: any) =>
  val === undefined || Object.values(ProductType).includes(val);

// ==========================================
// Routes
// ==========================================

// Create product
router.post(
  '/',
  authenticate,
  isAdminOrManager,
  validators.createProduct,
  validate,
  inventoryController.createProduct
);

// Get products (list) - with pagination and filters
router.get(
  '/',
  authenticate,
  validators.getProducts,
  validate,
  inventoryController.getProducts
);

// Low stock
router.get(
  '/low-stock',
  authenticate,
  inventoryController.getLowStock
);

// Out of stock
router.get(
  '/out-of-stock',
  authenticate,
  inventoryController.getOutOfStock
);

// Search
router.get(
  '/search',
  authenticate,
  [
    query('q').optional().isString().trim(),
    query('query').optional().isString().trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  validate,
  inventoryController.search
);

// Advanced search (same validators as list)
router.get(
  '/advanced',
  authenticate,
  validators.getProducts,
  validate,
  inventoryController.advancedSearch
);

// Recalculate prices based on gold price
router.post(
  '/recalculate-prices',
  authenticate,
  isAdminOrManager,
  [
    body('category')
      .optional()
      .isIn(Object.values(ProductCategory))
      .withMessage('دسته‌بندی نامعتبر است'),
  ],
  validate,
  inventoryController.recalculatePrices
);

// Bulk price update (percentage)
router.post(
  '/bulk/price-update',
  authenticate,
  isAdminOrManager,
  [
    body('percentage')
      .notEmpty()
      .withMessage('درصد تغییر قیمت الزامی است')
      .isFloat({ min: -100, max: 1000 })
      .withMessage('درصد باید بین -100 تا 1000 باشد')
      .toFloat(),
    body('category')
      .optional()
      .custom((val) => isValidCategory(val))
      .withMessage('دسته‌بندی نامعتبر است'),
    body('type')
      .optional()
      .custom((val) => isValidType(val))
      .withMessage('نوع محصول نامعتبر است'),
  ],
  validate,
  inventoryController.bulkUpdatePrices
);

// Bulk set active status
router.post(
  '/bulk/active',
  authenticate,
  isAdminOrManager,
  [
    body('product_ids')
      .isArray({ min: 1 })
      .withMessage('لیست شناسه محصولات الزامی است'),
    body('product_ids.*')
      .isUUID()
      .withMessage('شناسه محصول نامعتبر است'),
    body('is_active')
      .isBoolean()
      .withMessage('وضعیت باید بولین باشد')
      .toBoolean(),
  ],
  validate,
  inventoryController.bulkSetActive
);

// Gold price - current
router.get(
  '/gold-price/current',
  authenticate,
  validators.getGoldPrice,
  validate,
  inventoryController.getCurrentGoldPrice
);

// Gold price - set
router.post(
  '/gold-price',
  authenticate,
  isAdminOrManager,
  validators.createGoldPrice,
  validate,
  inventoryController.setGoldPrice
);

// Gold price - history
router.get(
  '/gold-price/history',
  authenticate,
  [
    query('carat')
      .notEmpty()
      .withMessage('عیار الزامی است')
      .isIn(['18', '21', '22', '24'])
      .withMessage('عیار نامعتبر است')
      .toInt(),
    query('days')
      .optional()
      .isInt({ min: 1, max: 3650 })
      .withMessage('تعداد روز نامعتبر است')
      .toInt(),
  ],
  validate,
  inventoryController.getGoldPriceHistory
);

// Inventory report
router.get(
  '/report',
  authenticate,
  inventoryController.getInventoryReport
);

// Inventory statistics
router.get(
  '/statistics',
  authenticate,
  inventoryController.getStatistics
);

// Stock alerts
router.get(
  '/alerts',
  authenticate,
  inventoryController.getStockAlerts
);

// Product performance
router.get(
  '/:id/performance',
  authenticate,
  [param('id').isUUID().withMessage('شناسه محصول نامعتبر است')],
  validate,
  inventoryController.getProductPerformance
);

// Get product by ID with live price calc
router.get(
  '/:id/price',
  authenticate,
  [param('id').isUUID().withMessage('شناسه محصول نامعتبر است')],
  validate,
  inventoryController.getProductWithPrice
);

// Get product by ID
router.get(
  '/:id',
  authenticate,
  [param('id').isUUID().withMessage('شناسه محصول نامعتبر است')],
  validate,
  inventoryController.getProduct
);

// Update product
router.put(
  '/:id',
  authenticate,
  isAdminOrManager,
  validators.updateProduct,
  validate,
  inventoryController.updateProduct
);

// Delete (soft) product
router.delete(
  '/:id',
  authenticate,
  isAdminOrManager,
  [param('id').isUUID().withMessage('شناسه محصول نامعتبر است')],
  validate,
  inventoryController.deleteProduct
);

// Restore product
router.patch(
  '/:id/restore',
  authenticate,
  isAdminOrManager,
  [param('id').isUUID().withMessage('شناسه محصول نامعتبر است')],
  validate,
  inventoryController.restoreProduct
);

// Update stock (generic)
router.patch(
  '/:id/stock',
  authenticate,
  isAdminOrManager,
  [
    param('id').isUUID().withMessage('شناسه محصول نامعتبر است'),
    body('type')
      .notEmpty()
      .isIn(['increase', 'decrease', 'set'])
      .withMessage('نوع تغییر موجودی نامعتبر است'),
    body('quantity')
      .notEmpty()
      .withMessage('مقدار موجودی الزامی است')
      .isFloat({ min: 0 })
      .withMessage('مقدار باید عددی و مثبت باشد')
      .toFloat(),
    body('reason').optional().isString().trim().isLength({ max: 200 }).withMessage('دلیل نامعتبر است'),
  ],
  validate,
  inventoryController.updateStock
);

// Increase stock
router.patch(
  '/:id/stock/increase',
  authenticate,
  isAdminOrManager,
  [
    param('id').isUUID().withMessage('شناسه محصول نامعتبر است'),
    body('quantity')
      .notEmpty()
      .withMessage('مقدار الزامی است')
      .isFloat({ min: 1 })
      .withMessage('مقدار باید بزرگتر از صفر باشد')
      .toFloat(),
    body('reason').optional().isString().trim().isLength({ max: 200 }),
  ],
  validate,
  inventoryController.increaseStock
);

// Decrease stock
router.patch(
  '/:id/stock/decrease',
  authenticate,
  isAdminOrManager,
  [
    param('id').isUUID().withMessage('شناسه محصول نامعتبر است'),
    body('quantity')
      .notEmpty()
      .withMessage('مقدار الزامی است')
      .isFloat({ min: 1 })
      .withMessage('مقدار باید بزرگتر از صفر باشد')
      .toFloat(),
    body('reason').optional().isString().trim().isLength({ max: 200 }),
  ],
  validate,
  inventoryController.decreaseStock
);

// Set exact stock
router.patch
(
  '/:id/stock/set',
  authenticate,
  isAdminOrManager,
  [
    param('id').isUUID().withMessage('شناسه محصول نامعتبر است'),
    body('quantity')
      .notEmpty()
      .withMessage('مقدار الزامی است')
      .isFloat({ min: 0 })
      .withMessage('مقدار باید صفر یا بزرگتر باشد')
      .toFloat(),
    body('reason').optional().isString().trim().isLength({ max: 200 }),
  ],
  validate,
  inventoryController.setStock
);

// Update product image (multipart or image_url)
router.put(
  '/:id/image',
  authenticate,
  isAdminOrManager,
  [param('id').isUUID().withMessage('شناسه محصول نامعتبر است')],
  // Try multipart upload; if no file, controller accepts image_url in body
  uploadImage.single('image'),
  validate,
  inventoryController.updateImage
);

// Remove product image
router.delete(
  '/:id/image',
  authenticate,
  isAdminOrManager,
  [param('id').isUUID().withMessage('شناسه محصول نامعتبر است')],
  validate,
  inventoryController.removeImage
);

// ==========================================
// EXPORT
// ==========================================

export default router;