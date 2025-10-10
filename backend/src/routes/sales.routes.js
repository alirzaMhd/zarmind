"use strict";
// ==========================================
// ZARMIND - Sales Routes
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var salesController_1 = require("../controllers/salesController");
var validation_middleware_1 = require("../middleware/validation.middleware");
var auth_middleware_1 = require("../middleware/auth.middleware");
var types_1 = require("../types");
var router = (0, express_1.Router)();
// ==========================================
// HELPERS
// ==========================================
var isValidEnum = function (val, enumObj) {
    return Object.values(enumObj).includes(val);
};
// ==========================================
// CRUD
// ==========================================
// Create sale
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.isEmployee, validation_middleware_1.validators.createSale, validation_middleware_1.validate, salesController_1.default.createSale);
// List sales (with filters/pagination)
router.get('/', auth_middleware_1.authenticate, validation_middleware_1.validators.getSales, validation_middleware_1.validate, salesController_1.default.getSales);
// ==========================================
// REPORTS & ANALYTICS
// ==========================================
// Sales report
router.get('/report', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    (0, express_validator_1.query)('endDate').optional().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
], validation_middleware_1.validate, salesController_1.default.getSalesReport);
// Sales performance (today/week/month/year)
router.get('/performance', auth_middleware_1.authenticate, salesController_1.default.getPerformance);
// Today sales
router.get('/today', auth_middleware_1.authenticate, salesController_1.default.getTodaySales);
// Today revenue
router.get('/today/revenue', auth_middleware_1.authenticate, salesController_1.default.getTodayRevenue);
// Recent sales
router.get('/recent', auth_middleware_1.authenticate, [(0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt()], validation_middleware_1.validate, salesController_1.default.getRecentSales);
// Sales statistics
router.get('/statistics', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    (0, express_validator_1.query)('endDate').optional().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
], validation_middleware_1.validate, salesController_1.default.getStatistics);
// Sales by date range
router.get('/range', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('startDate').notEmpty().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    (0, express_validator_1.query)('endDate').notEmpty().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
], validation_middleware_1.validate, salesController_1.default.getSalesByDateRange);
// Best selling products
router.get('/best-products', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    (0, express_validator_1.query)('endDate').optional().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
], validation_middleware_1.validate, salesController_1.default.getBestSellingProducts);
// Sales trend
router.get('/trend', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('period')
        .optional()
        .isIn(['daily', 'weekly', 'monthly'])
        .withMessage('دوره نامعتبر است (daily | weekly | monthly)'),
    (0, express_validator_1.query)('days').optional().isInt({ min: 1, max: 3650 }).toInt(),
], validation_middleware_1.validate, salesController_1.default.getSalesTrend);
// Conversion rate (drafts to completed)
router.get('/conversion', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    (0, express_validator_1.query)('endDate').optional().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
], validation_middleware_1.validate, salesController_1.default.getConversionRate);
// Pending payments
router.get('/pending-payments', auth_middleware_1.authenticate, salesController_1.default.getPendingPayments);
// Overdue payments
router.get('/overdue-payments', auth_middleware_1.authenticate, [(0, express_validator_1.query)('days').optional().isInt({ min: 1, max: 3650 }).toInt()], validation_middleware_1.validate, salesController_1.default.getOverduePayments);
// Sales by customer
router.get('/customer/:customer_id', auth_middleware_1.authenticate, [(0, express_validator_1.param)('customer_id').isUUID().withMessage('شناسه مشتری نامعتبر است')], validation_middleware_1.validate, salesController_1.default.getSalesByCustomer);
// Receipt by transaction id
router.get('/receipt/:transaction_id', auth_middleware_1.authenticate, [(0, express_validator_1.param)('transaction_id').isUUID().withMessage('شناسه تراکنش نامعتبر است')], validation_middleware_1.validate, salesController_1.default.generateReceipt);
// Generate invoice
router.get('/:id/invoice', auth_middleware_1.authenticate, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه فروش نامعتبر است')], validation_middleware_1.validate, salesController_1.default.generateInvoice);
// Get sale by sale number
router.get('/number/:sale_number', auth_middleware_1.authenticate, [(0, express_validator_1.param)('sale_number').isString().trim().isLength({ min: 1, max: 100 })], validation_middleware_1.validate, salesController_1.default.getSaleByNumber);
// ==========================================
// SINGLE SALE CRUD (placed AFTER specific routes)
// ==========================================
// Get sale by ID
router.get('/:id', auth_middleware_1.authenticate, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه فروش نامعتبر است')], validation_middleware_1.validate, salesController_1.default.getSale);
// Update sale
router.put('/:id', auth_middleware_1.authenticate, auth_middleware_1.isEmployee, validation_middleware_1.validators.updateSale, validation_middleware_1.validate, salesController_1.default.updateSale);
// Update sale status
router.patch('/:id/status', auth_middleware_1.authenticate, auth_middleware_1.isEmployee, [
    (0, express_validator_1.param)('id').isUUID().withMessage('شناسه فروش نامعتبر است'),
    (0, express_validator_1.body)('status')
        .notEmpty()
        .custom(function (val) { return isValidEnum(val, types_1.SaleStatus); })
        .withMessage('وضعیت فروش نامعتبر است'),
], validation_middleware_1.validate, salesController_1.default.updateSaleStatus);
// Cancel sale
router.post('/:id/cancel', auth_middleware_1.authenticate, auth_middleware_1.isEmployee, [
    (0, express_validator_1.param)('id').isUUID().withMessage('شناسه فروش نامعتبر است'),
    (0, express_validator_1.body)('reason').optional().isString().trim().isLength({ max: 300 }),
], validation_middleware_1.validate, salesController_1.default.cancelSale);
// Delete sale (draft only)
router.delete('/:id', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه فروش نامعتبر است')], validation_middleware_1.validate, salesController_1.default.deleteSale);
// Add payment to sale
router.post('/:id/payments', auth_middleware_1.authenticate, auth_middleware_1.isEmployee, [
    (0, express_validator_1.param)('id').isUUID().withMessage('شناسه فروش نامعتبر است'),
    (0, express_validator_1.body)('amount')
        .notEmpty()
        .withMessage('مبلغ الزامی است')
        .isFloat({ min: 0.01 })
        .withMessage('مبلغ باید بزرگ‌تر از صفر باشد')
        .toFloat(),
    (0, express_validator_1.body)('payment_method')
        .notEmpty()
        .custom(function (val) { return isValidEnum(val, types_1.PaymentMethod); })
        .withMessage('روش پرداخت نامعتبر است'),
    (0, express_validator_1.body)('reference_number').optional().isString().trim().isLength({ max: 100 }),
    (0, express_validator_1.body)('notes').optional().isString().trim().isLength({ max: 500 }),
], validation_middleware_1.validate, salesController_1.default.addPayment);
// ==========================================
// EXPORT
// ==========================================
exports.default = router;
