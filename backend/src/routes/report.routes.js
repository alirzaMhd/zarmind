"use strict";
// ==========================================
// ZARMIND - Report Routes
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var reportController_1 = require("../controllers/reportController");
var auth_middleware_1 = require("../middleware/auth.middleware");
var validation_middleware_1 = require("../middleware/validation.middleware");
var router = (0, express_1.Router)();
// ==========================================
// DASHBOARD & QUICK STATS
// ==========================================
/**
 * @route   GET /api/reports/dashboard
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get('/dashboard', auth_middleware_1.authenticate, reportController_1.default.getDashboardStats);
/**
 * @route   GET /api/reports/quick-stats
 * @desc    Get quick stats (widgets)
 * @access  Private
 */
router.get('/quick-stats', auth_middleware_1.authenticate, reportController_1.default.getQuickStats);
// ==========================================
// SALES REPORTS
// ==========================================
/**
 * @route   GET /api/reports/sales
 * @desc    Sales report (optional date range)
 * @access  Private
 */
router.get('/sales', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    (0, express_validator_1.query)('endDate').optional().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
], validation_middleware_1.validate, reportController_1.default.getSalesReport);
/**
 * @route   GET /api/reports/comparative-sales
 * @desc    Comparative sales report (current vs previous)
 * @access  Private
 */
router.get('/comparative-sales', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('currentStart').notEmpty().isISO8601().withMessage('تاریخ شروع (دوره فعلی) نامعتبر است'),
    (0, express_validator_1.query)('currentEnd').notEmpty().isISO8601().withMessage('تاریخ پایان (دوره فعلی) نامعتبر است'),
    (0, express_validator_1.query)('previousStart').notEmpty().isISO8601().withMessage('تاریخ شروع (دوره قبل) نامعتبر است'),
    (0, express_validator_1.query)('previousEnd').notEmpty().isISO8601().withMessage('تاریخ پایان (دوره قبل) نامعتبر است'),
], validation_middleware_1.validate, reportController_1.default.getComparativeSalesReport);
// ==========================================
// INVENTORY REPORTS
// ==========================================
/**
 * @route   GET /api/reports/inventory
 * @desc    Inventory report
 * @access  Private
 */
router.get('/inventory', auth_middleware_1.authenticate, reportController_1.default.getInventoryReport);
// ==========================================
// CUSTOMER REPORTS
// ==========================================
/**
 * @route   GET /api/reports/customers
 * @desc    Customer report
 * @access  Private
 */
router.get('/customers', auth_middleware_1.authenticate, reportController_1.default.getCustomerReport);
// ==========================================
// FINANCIAL / P&L
// ==========================================
/**
 * @route   GET /api/reports/financial
 * @desc    Financial report (optional date range)
 * @access  Private
 */
router.get('/financial', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    (0, express_validator_1.query)('endDate').optional().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
], validation_middleware_1.validate, reportController_1.default.getFinancialReport);
/**
 * @route   GET /api/reports/profit-loss
 * @desc    Profit & Loss report (optional date range)
 * @access  Private
 */
router.get('/profit-loss', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('startDate').optional().isISO8601().withMessage('تاریخ شروع نامعتبر است'),
    (0, express_validator_1.query)('endDate').optional().isISO8601().withMessage('تاریخ پایان نامعتبر است'),
], validation_middleware_1.validate, reportController_1.default.getProfitLossReport);
// ==========================================
// GOLD PRICE TRENDS
// ==========================================
/**
 * @route   GET /api/reports/gold-price-trend
 * @desc    Gold price trend
 * @access  Private
 */
router.get('/gold-price-trend', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('carat')
        .notEmpty()
        .withMessage('عیار الزامی است')
        .isIn(['18', '21', '22', '24'])
        .withMessage('عیار نامعتبر است (18، 21، 22 یا 24)')
        .toInt(),
    (0, express_validator_1.query)('days')
        .optional()
        .isInt({ min: 1, max: 3650 })
        .withMessage('تعداد روز نامعتبر است')
        .toInt(),
], validation_middleware_1.validate, reportController_1.default.getGoldPriceTrend);
// ==========================================
// EXPORT
// ==========================================
/**
 * @route   POST /api/reports/export
 * @desc    Export report JSON
 * @access  Private
 */
router.post('/export', auth_middleware_1.authenticate, [
    (0, express_validator_1.body)('report')
        .optional()
        .isObject()
        .withMessage('داده گزارش باید شیء معتبر باشد'),
], validation_middleware_1.validate, reportController_1.default.exportReport);
// ==========================================
// EXPORT DEFAULT
// ==========================================
exports.default = router;
