"use strict";
// ==========================================
// ZARMIND - Validation Middleware
// ==========================================
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validators = exports.sanitizePersianDigits = exports.requiredIf = exports.intRangeValidator = exports.positiveNumberValidator = exports.persianTextValidator = exports.imageUploadValidators = exports.updateSettingValidators = exports.reportValidators = exports.scaleReadValidators = exports.getGoldPriceValidators = exports.createGoldPriceValidators = exports.getTransactionsValidators = exports.getTransactionValidators = exports.createTransactionValidators = exports.getSalesValidators = exports.getSaleValidators = exports.updateSaleValidators = exports.createSaleValidators = exports.getProductsValidators = exports.getProductValidators = exports.updateProductValidators = exports.createProductValidators = exports.getCustomersValidators = exports.getCustomerValidators = exports.updateCustomerValidators = exports.createCustomerValidators = exports.registerValidators = exports.loginValidators = exports.getUsersValidators = exports.getUserValidators = exports.updatePasswordValidators = exports.updateUserValidators = exports.createUserValidators = exports.dateRangeValidators = exports.searchValidator = exports.paginationValidators = exports.uuidValidator = exports.validate = void 0;
var express_validator_1 = require("express-validator");
var error_middleware_1 = require("./error.middleware");
var types_1 = require("../types");
var helpers_1 = require("../utils/helpers");
// ==========================================
// VALIDATION RESULT HANDLER
// ==========================================
/**
 * Middleware to check validation results
 */
var validate = function (req, res, next) {
    var errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        var formattedErrors = errors.array().map(function (err) { return ({
            param: err.path || err.param,
            msg: err.msg,
            value: err.value,
        }); });
        throw (0, error_middleware_1.buildValidationError)(formattedErrors);
    }
    next();
};
exports.validate = validate;
// ==========================================
// COMMON VALIDATORS
// ==========================================
/**
 * UUID validator
 */
var uuidValidator = function (field) {
    if (field === void 0) { field = 'id'; }
    return (0, express_validator_1.param)(field)
        .isUUID()
        .withMessage("".concat(field, " \u0628\u0627\u06CC\u062F \u06CC\u06A9 UUID \u0645\u0639\u062A\u0628\u0631 \u0628\u0627\u0634\u062F"));
};
exports.uuidValidator = uuidValidator;
/**
 * Pagination validators
 */
exports.paginationValidators = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('شماره صفحه باید عدد مثبت باشد')
        .toInt(),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('تعداد آیتم‌ها باید بین 1 تا 100 باشد')
        .toInt(),
    (0, express_validator_1.query)('sortBy')
        .optional()
        .isString()
        .trim(),
    (0, express_validator_1.query)('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('ترتیب مرتب‌سازی باید asc یا desc باشد'),
];
/**
 * Search validator
 */
exports.searchValidator = (0, express_validator_1.query)('search')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('عبارت جستجو باید بین 1 تا 255 کاراکتر باشد');
/**
 * Date range validators
 */
exports.dateRangeValidators = [
    (0, express_validator_1.query)('startDate')
        .optional()
        .isISO8601()
        .withMessage('تاریخ شروع نامعتبر است')
        .toDate(),
    (0, express_validator_1.query)('endDate')
        .optional()
        .isISO8601()
        .withMessage('تاریخ پایان نامعتبر است')
        .toDate(),
];
// ==========================================
// USER VALIDATORS
// ==========================================
exports.createUserValidators = [
    (0, express_validator_1.body)('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('نام کاربری باید بین 3 تا 50 کاراکتر باشد')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد، - و _ باشد'),
    (0, express_validator_1.body)('email')
        .trim()
        .isEmail()
        .withMessage('ایمیل نامعتبر است')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6, max: 128 })
        .withMessage('رمز عبور باید بین 6 تا 128 کاراکتر باشد'),
    (0, express_validator_1.body)('full_name')
        .trim()
        .notEmpty()
        .withMessage('نام کامل الزامی است')
        .isLength({ min: 2, max: 255 })
        .withMessage('نام کامل باید بین 2 تا 255 کاراکتر باشد'),
    (0, express_validator_1.body)('role')
        .optional()
        .isIn(Object.values(types_1.UserRole))
        .withMessage('نقش کاربر نامعتبر است'),
    (0, express_validator_1.body)('phone')
        .optional()
        .custom(function (value) {
        if (value && !(0, helpers_1.validateMobileNumber)(value)) {
            throw new Error('شماره تلفن نامعتبر است');
        }
        return true;
    }),
    (0, express_validator_1.body)('is_active')
        .optional()
        .isBoolean()
        .withMessage('وضعیت فعال بودن باید true یا false باشد'),
];
exports.updateUserValidators = [
    (0, exports.uuidValidator)('id'),
    (0, express_validator_1.body)('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('ایمیل نامعتبر است')
        .normalizeEmail(),
    (0, express_validator_1.body)('full_name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 255 })
        .withMessage('نام کامل باید بین 2 تا 255 کاراکتر باشد'),
    (0, express_validator_1.body)('role')
        .optional()
        .isIn(Object.values(types_1.UserRole))
        .withMessage('نقش کاربر نامعتبر است'),
    (0, express_validator_1.body)('phone')
        .optional()
        .custom(function (value) {
        if (value && !(0, helpers_1.validateMobileNumber)(value)) {
            throw new Error('شماره تلفن نامعتبر است');
        }
        return true;
    }),
    (0, express_validator_1.body)('is_active')
        .optional()
        .isBoolean()
        .withMessage('وضعیت فعال بودن باید true یا false باشد'),
];
exports.updatePasswordValidators = [
    (0, exports.uuidValidator)('id'),
    (0, express_validator_1.body)('currentPassword')
        .notEmpty()
        .withMessage('رمز عبور فعلی الزامی است'),
    (0, express_validator_1.body)('newPassword')
        .isLength({ min: 6, max: 128 })
        .withMessage('رمز عبور جدید باید بین 6 تا 128 کاراکتر باشد'),
    (0, express_validator_1.body)('confirmPassword')
        .custom(function (value, _a) {
        var req = _a.req;
        if (value !== req.body.newPassword) {
            throw new Error('تکرار رمز عبور مطابقت ندارد');
        }
        return true;
    }),
];
exports.getUserValidators = [(0, exports.uuidValidator)('id')];
exports.getUsersValidators = __spreadArray(__spreadArray([], exports.paginationValidators, true), [
    exports.searchValidator,
    (0, express_validator_1.query)('role')
        .optional()
        .isIn(Object.values(types_1.UserRole))
        .withMessage('نقش کاربر نامعتبر است'),
    (0, express_validator_1.query)('is_active')
        .optional()
        .isBoolean()
        .withMessage('وضعیت فعال بودن باید true یا false باشد')
        .toBoolean(),
], false);
// ==========================================
// AUTH VALIDATORS
// ==========================================
exports.loginValidators = [
    (0, express_validator_1.body)('username')
        .trim()
        .notEmpty()
        .withMessage('نام کاربری الزامی است'),
    (0, express_validator_1.body)('password')
        .notEmpty()
        .withMessage('رمز عبور الزامی است'),
];
exports.registerValidators = exports.createUserValidators;
// ==========================================
// CUSTOMER VALIDATORS
// ==========================================
exports.createCustomerValidators = [
    (0, express_validator_1.body)('full_name')
        .trim()
        .notEmpty()
        .withMessage('نام کامل الزامی است')
        .isLength({ min: 2, max: 255 })
        .withMessage('نام کامل باید بین 2 تا 255 کاراکتر باشد'),
    (0, express_validator_1.body)('phone')
        .trim()
        .notEmpty()
        .withMessage('شماره تلفن الزامی است')
        .custom(function (value) {
        if (!(0, helpers_1.validateMobileNumber)(value)) {
            throw new Error('شماره تلفن نامعتبر است');
        }
        return true;
    }),
    (0, express_validator_1.body)('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('ایمیل نامعتبر است')
        .normalizeEmail(),
    (0, express_validator_1.body)('national_id')
        .optional()
        .custom(function (value) {
        if (value && !(0, helpers_1.validateNationalId)(value)) {
            throw new Error('کد ملی نامعتبر است');
        }
        return true;
    }),
    (0, express_validator_1.body)('address')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('آدرس نباید بیشتر از 1000 کاراکتر باشد'),
    (0, express_validator_1.body)('city')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('نام شهر نباید بیشتر از 100 کاراکتر باشد'),
    (0, express_validator_1.body)('postal_code')
        .optional()
        .isLength({ min: 10, max: 10 })
        .withMessage('کد پستی باید 10 رقم باشد'),
    (0, express_validator_1.body)('birth_date')
        .optional()
        .isISO8601()
        .withMessage('تاریخ تولد نامعتبر است')
        .toDate(),
    (0, express_validator_1.body)('credit_limit')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('سقف اعتبار باید عدد مثبت باشد')
        .toFloat(),
    (0, express_validator_1.body)('notes')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('یادداشت نباید بیشتر از 2000 کاراکتر باشد'),
];
exports.updateCustomerValidators = __spreadArray([
    (0, exports.uuidValidator)('id')
], exports.createCustomerValidators.map(function (validator) {
    // Make all fields optional for update
    var chain = validator;
    return chain.optional();
}), true);
exports.getCustomerValidators = [(0, exports.uuidValidator)('id')];
exports.getCustomersValidators = __spreadArray(__spreadArray([], exports.paginationValidators, true), [
    exports.searchValidator,
    (0, express_validator_1.query)('city')
        .optional()
        .trim(),
    (0, express_validator_1.query)('hasDebt')
        .optional()
        .isBoolean()
        .toBoolean(),
    (0, express_validator_1.query)('hasCredit')
        .optional()
        .isBoolean()
        .toBoolean(),
    (0, express_validator_1.query)('is_active')
        .optional()
        .isBoolean()
        .toBoolean(),
], false);
// ==========================================
// PRODUCT VALIDATORS
// ==========================================
exports.createProductValidators = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage('نام محصول الزامی است')
        .isLength({ min: 2, max: 255 })
        .withMessage('نام محصول باید بین 2 تا 255 کاراکتر باشد'),
    (0, express_validator_1.body)('name_en')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('نام انگلیسی نباید بیشتر از 255 کاراکتر باشد'),
    (0, express_validator_1.body)('category')
        .notEmpty()
        .withMessage('دسته‌بندی الزامی است')
        .isIn(Object.values(types_1.ProductCategory))
        .withMessage('دسته‌بندی نامعتبر است'),
    (0, express_validator_1.body)('type')
        .notEmpty()
        .withMessage('نوع محصول الزامی است')
        .isIn(Object.values(types_1.ProductType))
        .withMessage('نوع محصول نامعتبر است'),
    (0, express_validator_1.body)('carat')
        .notEmpty()
        .withMessage('عیار الزامی است')
        .isIn([18, 21, 22, 24])
        .withMessage('عیار باید 18، 21، 22 یا 24 باشد')
        .toInt(),
    (0, express_validator_1.body)('weight')
        .notEmpty()
        .withMessage('وزن الزامی است')
        .isFloat({ min: 0.001 })
        .withMessage('وزن باید عدد مثبت باشد')
        .toFloat(),
    (0, express_validator_1.body)('wage')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('اجرت باید عدد مثبت باشد')
        .toFloat(),
    (0, express_validator_1.body)('stone_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('قیمت نگین باید عدد مثبت باشد')
        .toFloat(),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('توضیحات نباید بیشتر از 2000 کاراکتر باشد'),
    (0, express_validator_1.body)('stock_quantity')
        .optional()
        .isInt({ min: 0 })
        .withMessage('موجودی باید عدد صحیح مثبت باشد')
        .toInt(),
    (0, express_validator_1.body)('min_stock_level')
        .optional()
        .isInt({ min: 0 })
        .withMessage('حداقل موجودی باید عدد صحیح مثبت باشد')
        .toInt(),
    (0, express_validator_1.body)('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('محل نگهداری نباید بیشتر از 100 کاراکتر باشد'),
    (0, express_validator_1.body)('supplier')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('نام تامین‌کننده نباید بیشتر از 255 کاراکتر باشد'),
    (0, express_validator_1.body)('purchase_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('قیمت خرید باید عدد مثبت باشد')
        .toFloat(),
    (0, express_validator_1.body)('selling_price')
        .notEmpty()
        .withMessage('قیمت فروش الزامی است')
        .isFloat({ min: 0 })
        .withMessage('قیمت فروش باید عدد مثبت باشد')
        .toFloat(),
];
exports.updateProductValidators = __spreadArray([
    (0, exports.uuidValidator)('id')
], exports.createProductValidators.map(function (validator) {
    var chain = validator;
    return chain.optional();
}), true);
exports.getProductValidators = [(0, exports.uuidValidator)('id')];
exports.getProductsValidators = __spreadArray(__spreadArray([], exports.paginationValidators, true), [
    exports.searchValidator,
    (0, express_validator_1.query)('category')
        .optional()
        .isIn(Object.values(types_1.ProductCategory))
        .withMessage('دسته‌بندی نامعتبر است'),
    (0, express_validator_1.query)('type')
        .optional()
        .isIn(Object.values(types_1.ProductType))
        .withMessage('نوع محصول نامعتبر است'),
    (0, express_validator_1.query)('carat')
        .optional()
        .isIn(['18', '21', '22', '24'])
        .withMessage('عیار نامعتبر است')
        .toInt(),
    (0, express_validator_1.query)('minWeight')
        .optional()
        .isFloat({ min: 0 })
        .toFloat(),
    (0, express_validator_1.query)('maxWeight')
        .optional()
        .isFloat({ min: 0 })
        .toFloat(),
    (0, express_validator_1.query)('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .toFloat(),
    (0, express_validator_1.query)('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .toFloat(),
    (0, express_validator_1.query)('is_active')
        .optional()
        .isBoolean()
        .toBoolean(),
    (0, express_validator_1.query)('lowStock')
        .optional()
        .isBoolean()
        .toBoolean(),
], false);
// ==========================================
// SALE VALIDATORS
// ==========================================
exports.createSaleValidators = [
    (0, express_validator_1.body)('customer_id')
        .optional()
        .isUUID()
        .withMessage('شناسه مشتری نامعتبر است'),
    (0, express_validator_1.body)('sale_type')
        .optional()
        .isIn(Object.values(types_1.SaleType))
        .withMessage('نوع فروش نامعتبر است'),
    (0, express_validator_1.body)('payment_method')
        .optional()
        .isIn(Object.values(types_1.PaymentMethod))
        .withMessage('روش پرداخت نامعتبر است'),
    (0, express_validator_1.body)('items')
        .isArray({ min: 1 })
        .withMessage('حداقل یک محصول باید انتخاب شود'),
    (0, express_validator_1.body)('items.*.product_id')
        .isUUID()
        .withMessage('شناسه محصول نامعتبر است'),
    (0, express_validator_1.body)('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('تعداد باید عدد صحیح مثبت باشد')
        .toInt(),
    (0, express_validator_1.body)('discount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('تخفیف باید عدد مثبت باشد')
        .toFloat(),
    (0, express_validator_1.body)('tax')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('مالیات باید عدد مثبت باشد')
        .toFloat(),
    (0, express_validator_1.body)('paid_amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('مبلغ پرداختی باید عدد مثبت باشد')
        .toFloat(),
    (0, express_validator_1.body)('notes')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('یادداشت نباید بیشتر از 2000 کاراکتر باشد'),
];
exports.updateSaleValidators = [
    (0, exports.uuidValidator)('id'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(Object.values(types_1.SaleStatus))
        .withMessage('وضعیت فروش نامعتبر است'),
    (0, express_validator_1.body)('payment_method')
        .optional()
        .isIn(Object.values(types_1.PaymentMethod))
        .withMessage('روش پرداخت نامعتبر است'),
    (0, express_validator_1.body)('discount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('تخفیف باید عدد مثبت باشد')
        .toFloat(),
    (0, express_validator_1.body)('paid_amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('مبلغ پرداختی باید عدد مثبت باشد')
        .toFloat(),
    (0, express_validator_1.body)('notes')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('یادداشت نباید بیشتر از 2000 کاراکتر باشد'),
];
exports.getSaleValidators = [(0, exports.uuidValidator)('id')];
exports.getSalesValidators = __spreadArray(__spreadArray(__spreadArray([], exports.paginationValidators, true), exports.dateRangeValidators, true), [
    exports.searchValidator,
    (0, express_validator_1.query)('customer_id')
        .optional()
        .isUUID()
        .withMessage('شناسه مشتری نامعتبر است'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(types_1.SaleStatus))
        .withMessage('وضعیت فروش نامعتبر است'),
    (0, express_validator_1.query)('sale_type')
        .optional()
        .isIn(Object.values(types_1.SaleType))
        .withMessage('نوع فروش نامعتبر است'),
    (0, express_validator_1.query)('payment_method')
        .optional()
        .isIn(Object.values(types_1.PaymentMethod))
        .withMessage('روش پرداخت نامعتبر است'),
], false);
// ==========================================
// TRANSACTION VALIDATORS
// ==========================================
exports.createTransactionValidators = [
    (0, express_validator_1.body)('customer_id')
        .optional()
        .isUUID()
        .withMessage('شناسه مشتری نامعتبر است'),
    (0, express_validator_1.body)('sale_id')
        .optional()
        .isUUID()
        .withMessage('شناسه فروش نامعتبر است'),
    (0, express_validator_1.body)('type')
        .notEmpty()
        .withMessage('نوع تراکنش الزامی است')
        .isIn(Object.values(types_1.TransactionType))
        .withMessage('نوع تراکنش نامعتبر است'),
    (0, express_validator_1.body)('amount')
        .notEmpty()
        .withMessage('مبلغ الزامی است')
        .isFloat({ min: 0 })
        .withMessage('مبلغ باید عدد مثبت باشد')
        .toFloat(),
    (0, express_validator_1.body)('payment_method')
        .optional()
        .isIn(Object.values(types_1.PaymentMethod))
        .withMessage('روش پرداخت نامعتبر است'),
    (0, express_validator_1.body)('reference_number')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('شماره مرجع نباید بیشتر از 100 کاراکتر باشد'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('توضیحات نباید بیشتر از 2000 کاراکتر باشد'),
];
exports.getTransactionValidators = [(0, exports.uuidValidator)('id')];
exports.getTransactionsValidators = __spreadArray(__spreadArray(__spreadArray([], exports.paginationValidators, true), exports.dateRangeValidators, true), [
    (0, express_validator_1.query)('customer_id')
        .optional()
        .isUUID()
        .withMessage('شناسه مشتری نامعتبر است'),
    (0, express_validator_1.query)('sale_id')
        .optional()
        .isUUID()
        .withMessage('شناسه فروش نامعتبر است'),
    (0, express_validator_1.query)('type')
        .optional()
        .isIn(Object.values(types_1.TransactionType))
        .withMessage('نوع تراکنش نامعتبر است'),
    (0, express_validator_1.query)('payment_method')
        .optional()
        .isIn(Object.values(types_1.PaymentMethod))
        .withMessage('روش پرداخت نامعتبر است'),
], false);
// ==========================================
// GOLD PRICE VALIDATORS
// ==========================================
exports.createGoldPriceValidators = [
    (0, express_validator_1.body)('carat')
        .notEmpty()
        .withMessage('عیار الزامی است')
        .isIn([18, 21, 22, 24])
        .withMessage('عیار باید 18، 21، 22 یا 24 باشد')
        .toInt(),
    (0, express_validator_1.body)('price_per_gram')
        .notEmpty()
        .withMessage('قیمت هر گرم الزامی است')
        .isFloat({ min: 0 })
        .withMessage('قیمت باید عدد مثبت باشد')
        .toFloat(),
    (0, express_validator_1.body)('date')
        .optional()
        .isISO8601()
        .withMessage('تاریخ نامعتبر است')
        .toDate(),
];
exports.getGoldPriceValidators = __spreadArray([
    (0, express_validator_1.query)('carat')
        .optional()
        .isIn(['18', '21', '22', '24'])
        .withMessage('عیار نامعتبر است')
        .toInt()
], exports.dateRangeValidators, true);
// ==========================================
// AI VALIDATORS
// ==========================================
exports.scaleReadValidators = [
    (0, express_validator_1.body)('image')
        .notEmpty()
        .withMessage('تصویر الزامی است'),
    (0, express_validator_1.body)('imageType')
        .optional()
        .isIn(['base64', 'file', 'url'])
        .withMessage('نوع تصویر نامعتبر است'),
    (0, express_validator_1.body)('preprocessingOptions')
        .optional()
        .isObject()
        .withMessage('تنظیمات پیش‌پردازش باید شیء باشد'),
    (0, express_validator_1.body)('preprocessingOptions.resize')
        .optional()
        .isBoolean()
        .toBoolean(),
    (0, express_validator_1.body)('preprocessingOptions.grayscale')
        .optional()
        .isBoolean()
        .toBoolean(),
    (0, express_validator_1.body)('preprocessingOptions.denoise')
        .optional()
        .isBoolean()
        .toBoolean(),
    (0, express_validator_1.body)('preprocessingOptions.contrast')
        .optional()
        .isBoolean()
        .toBoolean(),
    (0, express_validator_1.body)('preprocessingOptions.sharpen')
        .optional()
        .isBoolean()
        .toBoolean(),
];
// ==========================================
// REPORT VALIDATORS
// ==========================================
exports.reportValidators = __spreadArray(__spreadArray([], exports.dateRangeValidators, true), [
    (0, express_validator_1.query)('category')
        .optional()
        .isIn(Object.values(types_1.ProductCategory))
        .withMessage('دسته‌بندی نامعتبر است'),
    (0, express_validator_1.query)('type')
        .optional()
        .isIn(Object.values(types_1.ProductType))
        .withMessage('نوع محصول نامعتبر است'),
    (0, express_validator_1.query)('customer_id')
        .optional()
        .isUUID()
        .withMessage('شناسه مشتری نامعتبر است'),
    (0, express_validator_1.query)('status')
        .optional()
        .isIn(Object.values(types_1.SaleStatus))
        .withMessage('وضعیت فروش نامعتبر است'),
    (0, express_validator_1.query)('payment_method')
        .optional()
        .isIn(Object.values(types_1.PaymentMethod))
        .withMessage('روش پرداخت نامعتبر است'),
], false);
// ==========================================
// SYSTEM SETTINGS VALIDATORS
// ==========================================
exports.updateSettingValidators = [
    (0, express_validator_1.body)('setting_key')
        .trim()
        .notEmpty()
        .withMessage('کلید تنظیمات الزامی است')
        .isLength({ max: 100 })
        .withMessage('کلید تنظیمات نباید بیشتر از 100 کاراکتر باشد'),
    (0, express_validator_1.body)('setting_value')
        .notEmpty()
        .withMessage('مقدار تنظیمات الزامی است'),
    (0, express_validator_1.body)('data_type')
        .optional()
        .isIn(['string', 'number', 'boolean', 'json'])
        .withMessage('نوع داده نامعتبر است'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('توضیحات نباید بیشتر از 500 کاراکتر باشد'),
];
// ==========================================
// FILE UPLOAD VALIDATORS
// ==========================================
exports.imageUploadValidators = [
    (0, express_validator_1.body)('fieldname')
        .optional()
        .trim()
        .isIn(['image', 'avatar', 'product_image', 'scale_image'])
        .withMessage('نام فیلد نامعتبر است'),
];
// ==========================================
// CUSTOM VALIDATORS
// ==========================================
/**
 * Custom validator for Persian text
 */
var persianTextValidator = function (fieldName) {
    return (0, express_validator_1.body)(fieldName)
        .custom(function (value) {
        if (value && !/^[\u0600-\u06FF\s0-9۰-۹]+$/.test(value)) {
            throw new Error("".concat(fieldName, " \u0628\u0627\u06CC\u062F \u0641\u0642\u0637 \u0634\u0627\u0645\u0644 \u062D\u0631\u0648\u0641 \u0641\u0627\u0631\u0633\u06CC \u0628\u0627\u0634\u062F"));
        }
        return true;
    });
};
exports.persianTextValidator = persianTextValidator;
/**
 * Custom validator for positive number
 */
var positiveNumberValidator = function (fieldName) {
    return (0, express_validator_1.body)(fieldName)
        .isFloat({ min: 0 })
        .withMessage("".concat(fieldName, " \u0628\u0627\u06CC\u062F \u0639\u062F\u062F \u0645\u062B\u0628\u062A \u0628\u0627\u0634\u062F"))
        .toFloat();
};
exports.positiveNumberValidator = positiveNumberValidator;
/**
 * Custom validator for integer range
 */
var intRangeValidator = function (fieldName, min, max) {
    return (0, express_validator_1.body)(fieldName)
        .isInt({ min: min, max: max })
        .withMessage("".concat(fieldName, " \u0628\u0627\u06CC\u062F \u0628\u06CC\u0646 ").concat(min, " \u062A\u0627 ").concat(max, " \u0628\u0627\u0634\u062F"))
        .toInt();
};
exports.intRangeValidator = intRangeValidator;
// ==========================================
// CONDITIONAL VALIDATORS
// ==========================================
/**
 * Require field if another field has specific value
 */
var requiredIf = function (fieldName, dependentField, dependentValue) {
    return (0, express_validator_1.body)(fieldName).custom(function (value, _a) {
        var req = _a.req;
        if (req.body[dependentField] === dependentValue && !value) {
            throw new Error("".concat(fieldName, " \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A"));
        }
        return true;
    });
};
exports.requiredIf = requiredIf;
// ==========================================
// SANITIZATION HELPERS
// ==========================================
/**
 * Sanitize Persian digits to English
 */
var sanitizePersianDigits = function (fieldName) {
    return (0, express_validator_1.body)(fieldName).customSanitizer(function (value) {
        if (typeof value === 'string') {
            var persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
            var englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            var result = value;
            for (var i = 0; i < 10; i++) {
                result = result.replace(new RegExp(persianDigits[i], 'g'), englishDigits[i]);
            }
            return result;
        }
        return value;
    });
};
exports.sanitizePersianDigits = sanitizePersianDigits;
// ==========================================
// EXPORT VALIDATOR GROUPS
// ==========================================
exports.validators = {
    // Common
    uuid: exports.uuidValidator,
    pagination: exports.paginationValidators,
    search: exports.searchValidator,
    dateRange: exports.dateRangeValidators,
    // Auth
    login: exports.loginValidators,
    register: exports.registerValidators,
    // Users
    createUser: exports.createUserValidators,
    updateUser: exports.updateUserValidators,
    updatePassword: exports.updatePasswordValidators,
    getUser: exports.getUserValidators,
    getUsers: exports.getUsersValidators,
    // Customers
    createCustomer: exports.createCustomerValidators,
    updateCustomer: exports.updateCustomerValidators,
    getCustomer: exports.getCustomerValidators,
    getCustomers: exports.getCustomersValidators,
    // Products
    createProduct: exports.createProductValidators,
    updateProduct: exports.updateProductValidators,
    getProduct: exports.getProductValidators,
    getProducts: exports.getProductsValidators,
    // Sales
    createSale: exports.createSaleValidators,
    updateSale: exports.updateSaleValidators,
    getSale: exports.getSaleValidators,
    getSales: exports.getSalesValidators,
    // Transactions
    createTransaction: exports.createTransactionValidators,
    getTransaction: exports.getTransactionValidators,
    getTransactions: exports.getTransactionsValidators,
    // Gold Prices
    createGoldPrice: exports.createGoldPriceValidators,
    getGoldPrice: exports.getGoldPriceValidators,
    // AI
    scaleRead: exports.scaleReadValidators,
    // Reports
    report: exports.reportValidators,
    // Settings
    updateSetting: exports.updateSettingValidators,
    // File Upload
    imageUpload: exports.imageUploadValidators,
};
exports.default = exports.validators;
