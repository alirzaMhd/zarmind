"use strict";
// ==========================================
// ZARMIND - Customer Routes
// ==========================================
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var express_validator_1 = require("express-validator");
var customerController_1 = require("../controllers/customerController");
var validation_middleware_1 = require("../middleware/validation.middleware");
var auth_middleware_1 = require("../middleware/auth.middleware");
var router = (0, express_1.Router)();
// ==========================================
// CRUD
// ==========================================
// Create customer
router.post('/', auth_middleware_1.authenticate, auth_middleware_1.isEmployee, validation_middleware_1.validators.createCustomer, validation_middleware_1.validate, customerController_1.default.createCustomer);
// List customers (with filters/pagination)
router.get('/', auth_middleware_1.authenticate, validation_middleware_1.validators.getCustomers, validation_middleware_1.validate, customerController_1.default.getCustomers);
// Get customer by ID
router.get('/:id', auth_middleware_1.authenticate, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه مشتری نامعتبر است')], validation_middleware_1.validate, customerController_1.default.getCustomer);
// Update customer
router.put('/:id', auth_middleware_1.authenticate, auth_middleware_1.isEmployee, validation_middleware_1.validators.updateCustomer, validation_middleware_1.validate, customerController_1.default.updateCustomer);
// Delete (soft) customer
router.delete('/:id', auth_middleware_1.authenticate, auth_middleware_1.isEmployee, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه مشتری نامعتبر است')], validation_middleware_1.validate, customerController_1.default.deleteCustomer);
// Restore customer
router.patch('/:id/restore', auth_middleware_1.authenticate, auth_middleware_1.isEmployee, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه مشتری نامعتبر است')], validation_middleware_1.validate, customerController_1.default.restoreCustomer);
// ==========================================
// BALANCE & CREDIT
// ==========================================
// Adjust balance
router.patch('/:id/balance', auth_middleware_1.authenticate, auth_middleware_1.isEmployee, [
    (0, express_validator_1.param)('id').isUUID().withMessage('شناسه مشتری نامعتبر است'),
    (0, express_validator_1.body)('type')
        .notEmpty()
        .isIn(['increase', 'decrease', 'set'])
        .withMessage('نوع تغییر مانده نامعتبر است'),
    (0, express_validator_1.body)('amount')
        .notEmpty()
        .withMessage('مبلغ الزامی است')
        .isFloat({ min: 0 })
        .withMessage('مبلغ باید صفر یا بزرگتر باشد')
        .toFloat(),
    (0, express_validator_1.body)('reason')
        .notEmpty()
        .withMessage('دلیل تغییر مانده الزامی است')
        .isString()
        .trim()
        .isLength({ max: 200 })
        .withMessage('دلیل تغییر مانده نباید بیش از 200 کاراکتر باشد'),
], validation_middleware_1.validate, customerController_1.default.adjustBalance);
// Add debt
router.patch('/:id/debt/add', auth_middleware_1.authenticate, auth_middleware_1.isEmployee, [
    (0, express_validator_1.param)('id').isUUID().withMessage('شناسه مشتری نامعتبر است'),
    (0, express_validator_1.body)('amount')
        .notEmpty()
        .withMessage('مبلغ الزامی است')
        .isFloat({ min: 1 })
        .withMessage('مبلغ باید بزرگ‌تر از صفر باشد')
        .toFloat(),
    (0, express_validator_1.body)('reason').optional().isString().trim().isLength({ max: 200 }),
], validation_middleware_1.validate, customerController_1.default.addDebt);
// Reduce debt
router.patch('/:id/debt/reduce', auth_middleware_1.authenticate, auth_middleware_1.isEmployee, [
    (0, express_validator_1.param)('id').isUUID().withMessage('شناسه مشتری نامعتبر است'),
    (0, express_validator_1.body)('amount')
        .notEmpty()
        .withMessage('مبلغ الزامی است')
        .isFloat({ min: 1 })
        .withMessage('مبلغ باید بزرگ‌تر از صفر باشد')
        .toFloat(),
    (0, express_validator_1.body)('reason').optional().isString().trim().isLength({ max: 200 }),
], validation_middleware_1.validate, customerController_1.default.reduceDebt);
// Settle account
router.patch('/:id/settle', auth_middleware_1.authenticate, auth_middleware_1.isEmployee, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه مشتری نامعتبر است')], validation_middleware_1.validate, customerController_1.default.settleAccount);
// Update credit limit (restrict to admin/manager)
router.patch('/:id/credit-limit', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, [
    (0, express_validator_1.param)('id').isUUID().withMessage('شناسه مشتری نامعتبر است'),
    (0, express_validator_1.body)('credit_limit')
        .notEmpty()
        .withMessage('سقف اعتبار الزامی است')
        .isFloat({ min: 0 })
        .withMessage('سقف اعتبار باید صفر یا بزرگتر باشد')
        .toFloat(),
], validation_middleware_1.validate, customerController_1.default.updateCreditLimit);
// Can purchase (check credit limit)
router.get('/:id/can-purchase', auth_middleware_1.authenticate, [
    (0, express_validator_1.param)('id').isUUID().withMessage('شناسه مشتری نامعتبر است'),
    (0, express_validator_1.query)('amount')
        .notEmpty()
        .withMessage('مبلغ الزامی است')
        .isFloat({ min: 1 })
        .withMessage('مبلغ باید بزرگ‌تر از صفر باشد')
        .toFloat(),
], validation_middleware_1.validate, customerController_1.default.canPurchase);
// Available credit
router.get('/:id/available-credit', auth_middleware_1.authenticate, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه مشتری نامعتبر است')], validation_middleware_1.validate, customerController_1.default.getAvailableCredit);
// ==========================================
// LISTS & SEARCH
// ==========================================
// Debtors
router.get('/debtors', auth_middleware_1.authenticate, customerController_1.default.getDebtors);
// Creditors
router.get('/creditors', auth_middleware_1.authenticate, customerController_1.default.getCreditors);
// Search
router.get('/search', auth_middleware_1.authenticate, [
    (0, express_validator_1.query)('q').optional().isString().trim(),
    (0, express_validator_1.query)('query').optional().isString().trim(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
], validation_middleware_1.validate, customerController_1.default.search);
// Advanced search (reuse validators for list)
router.get('/advanced', auth_middleware_1.authenticate, validation_middleware_1.validators.getCustomers, validation_middleware_1.validate, customerController_1.default.advancedSearch);
// Account summary
router.get('/:id/account', auth_middleware_1.authenticate, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه مشتری نامعتبر است')], validation_middleware_1.validate, customerController_1.default.getAccountSummary);
// Purchase history
router.get('/:id/purchase-history', auth_middleware_1.authenticate, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه مشتری نامعتبر است')], validation_middleware_1.validate, customerController_1.default.getPurchaseHistory);
// Transactions history
router.get('/:id/transactions', auth_middleware_1.authenticate, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه مشتری نامعتبر است')], validation_middleware_1.validate, customerController_1.default.getTransactions);
// Lifetime value
router.get('/:id/lifetime-value', auth_middleware_1.authenticate, [(0, express_validator_1.param)('id').isUUID().withMessage('شناسه مشتری نامعتبر است')], validation_middleware_1.validate, customerController_1.default.getLifetimeValue);
// ==========================================
// STATS & REPORTS
// ==========================================
// Statistics
router.get('/statistics', auth_middleware_1.authenticate, customerController_1.default.getStatistics);
// Top customers
router.get('/top', auth_middleware_1.authenticate, [(0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt()], validation_middleware_1.validate, customerController_1.default.getTopCustomers);
// Debtor report
router.get('/debtor-report', auth_middleware_1.authenticate, customerController_1.default.getDebtorReport);
// Near credit limit
router.get('/near-credit-limit', auth_middleware_1.authenticate, [(0, express_validator_1.query)('threshold').optional().isInt({ min: 1, max: 100 }).toInt()], validation_middleware_1.validate, customerController_1.default.getCustomersNearingCreditLimit);
// New customers (this month)
router.get('/new', auth_middleware_1.authenticate, customerController_1.default.getNewCustomers);
// Inactive customers
router.get('/inactive', auth_middleware_1.authenticate, [(0, express_validator_1.query)('days').optional().isInt({ min: 1, max: 3650 }).toInt()], validation_middleware_1.validate, customerController_1.default.getInactiveCustomers);
// ==========================================
// BULK OPERATIONS
// ==========================================
// Bulk set active
router.post('/bulk/active', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, [
    (0, express_validator_1.body)('customer_ids')
        .isArray({ min: 1 })
        .withMessage('لیست شناسه مشتریان الزامی است'),
    (0, express_validator_1.body)('customer_ids.*')
        .isUUID()
        .withMessage('شناسه مشتری نامعتبر است'),
    (0, express_validator_1.body)('is_active')
        .isBoolean()
        .withMessage('وضعیت باید بولین باشد')
        .toBoolean(),
], validation_middleware_1.validate, customerController_1.default.bulkSetActive);
// Bulk update credit limit
router.post('/bulk/credit-limit', auth_middleware_1.authenticate, auth_middleware_1.isAdminOrManager, [
    (0, express_validator_1.body)('customer_ids')
        .isArray({ min: 1 })
        .withMessage('لیست شناسه مشتریان الزامی است'),
    (0, express_validator_1.body)('customer_ids.*')
        .isUUID()
        .withMessage('شناسه مشتری نامعتبر است'),
    (0, express_validator_1.body)('credit_limit')
        .notEmpty()
        .withMessage('سقف اعتبار الزامی است')
        .isFloat({ min: 0 })
        .withMessage('سقف اعتبار باید صفر یا بزرگتر باشد')
        .toFloat(),
], validation_middleware_1.validate, customerController_1.default.bulkUpdateCreditLimit);
// ==========================================
// EXPORT
// ==========================================
exports.default = router;
