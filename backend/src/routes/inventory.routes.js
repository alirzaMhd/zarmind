"use strict";
// ==========================================
// ZARMIND - Inventory Routes
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var path = require("path");
var fs = require("fs");
var multer = require("multer");
var inventoryController_1 = require("../controllers/inventoryController");
var validation_middleware_1 = require("../middleware/validation.middleware");
var auth_middleware_1 = require("../middleware/auth.middleware");
var server_1 = require("../config/server");
var types_1 = require("../types");
var router = (0, express_1.Router)();
// ==========================================
// Multer setup for product images
// ==========================================
var ensureDir = function (dir) {
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
};
ensureDir(server_1.UPLOAD_CONFIG.PRODUCTS_PATH);
var storage = multer.diskStorage({
    destination: function (_req, _file, cb) {
        cb(null, server_1.UPLOAD_CONFIG.PRODUCTS_PATH);
    },
    filename: function (_req, file, cb) {
        var ext = path.extname(file.originalname || '').toLowerCase();
        var name = "".concat(Date.now(), "-").concat(Math.random().toString(36).substring(2, 8)).concat(ext);
        cb(null, name);
    },
});
var imageFileFilter = function (_req, file, cb) {
    var allowed = server_1.UPLOAD_CONFIG.ALLOWED_IMAGE_TYPES;
    var ext = path.extname(file.originalname || '').toLowerCase().replace('.', '');
    var mimeOk = file.mimetype.startsWith('image/');
    if (!mimeOk || !allowed.includes(ext)) { // ✅ FIXED
        return cb(new Error('نوع فایل تصویر مجاز نیست'));
    }
    cb(null, true);
};
var uploadImage = multer({
    storage: storage,
    limits: { fileSize: server_1.UPLOAD_CONFIG.MAX_FILE_SIZE },
    fileFilter: imageFileFilter,
});
// ==========================================
// Helpers
// ==========================================
var isValidCategory = function (val) {
    return val === undefined || Object.values(types_1.ProductCategory).includes(val);
};
var isValidType = function (val) {
    return val === undefined || Object.values(types_1.ProductType).includes(val);
};
// ==========================================
// Routes
// ==========================================
// Create product
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, validation_middleware_1.validators.createProduct, validation_middleware_1.validate, inventoryController_1.default.createProduct);
// Get products (list) - with pagination and filters
router.get('/', auth_middleware_1.authenticate, validation_middleware_1.validators.getProducts, validation_middleware_1.validate, inventoryController_1.default.getProducts);
// Low stock
router.get('/low-stock', auth_middleware_1.authenticate, inventoryController_1.default.getLowStock);
// Out of stock
router.get('/out-of-stock', auth_middleware_1.authenticate, inventoryController_1.default.getOutOfStock);
// Search
router.get('/search', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('q').optional().isString().trim(),
    (0, express_validator_1.query)('query').optional().isString().trim(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
], validation_middleware_1.validate, inventoryController_1.default.search);
// Advanced search (same validators as list)
router.get('/advanced', auth_middleware_1.authenticate, validation_middleware_1.validators.getProducts, validation_middleware_1.validate, inventoryController_1.default.advancedSearch);
// Recalculate prices based on gold price
router.post('/recalculate-prices', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, [
    (0, express_validator_1.body)('category')
        .optional()
        .isIn(Object.values(types_1.ProductCategory))
        .withMessage('دسته‌بندی نامعتبر است'),
], validation_middleware_1.validate, inventoryController_1.default.recalculatePrices);
// Bulk price update (percentage)
router.post('/bulk/price-update', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, [
    (0, express_validator_1.body)('percentage')
        .notEmpty()
        .withMessage('درصد تغییر قیمت الزامی است')
        .isFloat({ min: -100, max: 1000 })
        .withMessage('درصد باید بین -100 تا 1000 باشد')
        .toFloat(),
    (0, express_validator_1.body)('category')
        .optional()
        .custom(function (val) { return isValidCategory(val); })
        .withMessage('دسته‌بندی نامعتبر است'),
    (0, express_validator_1.body)('type')
        .optional()
        .custom(function (val) { return isValidType(val); })
        .withMessage('نوع محصول نامعتبر است'),
], validation_middleware_1.validate, inventoryController_1.default.bulkUpdatePrices);
// Bulk set active status
router.post('/bulk/active', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, [
    (0, express_validator_1.body)('product_ids')
        .isArray({ min: 1 })
        .withMessage('لیست شناسه محصولات الزامی است'),
    (0, express_validator_1.body)('product_ids.*')
        .isUUID()
        .withMessage('شناسه محصول نامعتبر است'),
    (0, express_validator_1.body)('is_active')
        .isBoolean()
        .withMessage('وضعیت باید بولین باشد')
        .toBoolean(),
], validation_middleware_1.validate, inventoryController_1.default.bulkSetActive);
// Gold price - current
router.get('/gold-price/current', auth_middleware_1.authenticate, validation_middleware_1.validators.getGoldPrice, validation_middleware_1.validate, inventoryController_1.default.getCurrentGoldPrice);
// Gold price - set
router.post('/gold-price', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, validation_middleware_1.validators.createGoldPrice, validation_middleware_1.validate, inventoryController_1.default.setGoldPrice);
// Gold price - history
router.get('/gold-price/history', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('carat')
        .notEmpty()
        .withMessage('عیار الزامی است')
        .isIn(['18', '21', '22', '24'])
        .withMessage('عیار نامعتبر است')
        .toInt(),
    (0, express_validator_1.query)('days')
        .optional()
        .isInt({ min: 1, max: 3650 })
        .withMessage('تعداد روز نامعتبر است')
        .toInt(),
], validation_middleware_1.validate, inventoryController_1.default.getGoldPriceHistory);
// Inventory report
router.get('/report', auth_middleware_1.authenticate, inventoryController_1.default.getInventoryReport);
// Inventory statistics
router.get('/statistics', auth_middleware_1.authenticate, inventoryController_1.default.getStatistics);
// Stock alerts
router.get('/alerts', auth_middleware_1.authenticate, inventoryController_1.default.getStockAlerts);
// Product performance
router.get('/:id/performance', auth_middleware_1.authenticate, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه محصول نامعتبر است')], validation_middleware_1.validate, inventoryController_1.default.getProductPerformance);
// Get product by ID with live price calc
router.get('/:id/price', auth_middleware_1.authenticate, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه محصول نامعتبر است')], validation_middleware_1.validate, inventoryController_1.default.getProductWithPrice);
// Get product by ID
router.get('/:id', auth_middleware_1.authenticate, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه محصول نامعتبر است')], validation_middleware_1.validate, inventoryController_1.default.getProduct);
// Update product
router.put('/:id', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, validation_middleware_1.validators.updateProduct, validation_middleware_1.validate, inventoryController_1.default.updateProduct);
// Delete (soft) product
router.delete('/:id', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه محصول نامعتبر است')], validation_middleware_1.validate, inventoryController_1.default.deleteProduct);
// Restore product
router.patch('/:id/restore', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه محصول نامعتبر است')], validation_middleware_1.validate, inventoryController_1.default.restoreProduct);
// Update stock (generic)
router.patch('/:id/stock', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, [
    (0, express_validator_1.param)('id').isUUID().withMessage('شناسه محصول نامعتبر است'),
    (0, express_validator_1.body)('type')
        .notEmpty()
        .isIn(['increase', 'decrease', 'set'])
        .withMessage('نوع تغییر موجودی نامعتبر است'),
    (0, express_validator_1.body)('quantity')
        .notEmpty()
        .withMessage('مقدار موجودی الزامی است')
        .isFloat({ min: 0 })
        .withMessage('مقدار باید عددی و مثبت باشد')
        .toFloat(),
    (0, express_validator_1.body)('reason').optional().isString().trim().isLength({ max: 200 }).withMessage('دلیل نامعتبر است'),
], validation_middleware_1.validate, inventoryController_1.default.updateStock);
// Increase stock
router.patch('/:id/stock/increase', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, [
    (0, express_validator_1.param)('id').isUUID().withMessage('شناسه محصول نامعتبر است'),
    (0, express_validator_1.body)('quantity')
        .notEmpty()
        .withMessage('مقدار الزامی است')
        .isFloat({ min: 1 })
        .withMessage('مقدار باید بزرگتر از صفر باشد')
        .toFloat(),
    (0, express_validator_1.body)('reason').optional().isString().trim().isLength({ max: 200 }),
], validation_middleware_1.validate, inventoryController_1.default.increaseStock);
// Decrease stock
router.patch('/:id/stock/decrease', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, [
    (0, express_validator_1.param)('id').isUUID().withMessage('شناسه محصول نامعتبر است'),
    (0, express_validator_1.body)('quantity')
        .notEmpty()
        .withMessage('مقدار الزامی است')
        .isFloat({ min: 1 })
        .withMessage('مقدار باید بزرگتر از صفر باشد')
        .toFloat(),
    (0, express_validator_1.body)('reason').optional().isString().trim().isLength({ max: 200 }),
], validation_middleware_1.validate, inventoryController_1.default.decreaseStock);
// Set exact stock
router.patch('/:id/stock/set', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, [
    (0, express_validator_1.param)('id').isUUID().withMessage('شناسه محصول نامعتبر است'),
    (0, express_validator_1.body)('quantity')
        .notEmpty()
        .withMessage('مقدار الزامی است')
        .isFloat({ min: 0 })
        .withMessage('مقدار باید صفر یا بزرگتر باشد')
        .toFloat(),
    (0, express_validator_1.body)('reason').optional().isString().trim().isLength({ max: 200 }),
], validation_middleware_1.validate, inventoryController_1.default.setStock);
// Update product image (multipart or image_url)
router.put('/:id/image', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه محصول نامعتبر است')], 
// Try multipart upload; if no file, controller accepts image_url in body
uploadImage.single('image'), validation_middleware_1.validate, inventoryController_1.default.updateImage);
// Remove product image
router.delete('/:id/image', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه محصول نامعتبر است')], validation_middleware_1.validate, inventoryController_1.default.removeImage);
// ==========================================
// EXPORT
// ==========================================
exports.default = router;
