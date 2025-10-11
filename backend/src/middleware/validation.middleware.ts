// ==========================================
// ZARMIND - Validation Middleware
// ==========================================

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';
import { buildValidationError } from './error.middleware';
import {
  UserRole,
  ProductCategory,
  ProductType,
  SaleType,
  PaymentMethod,
  SaleStatus,
  TransactionType,
} from '../types';
import { validateNationalId, validateMobileNumber } from '../utils/helpers';

// ==========================================
// VALIDATION RESULT HANDLER
// ==========================================

/**
 * Middleware to check validation results
 */
export const validate = (req: Request, _res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      param: (err as any).path || (err as any).param,
      msg: err.msg,
      value: (err as any).value,
    }));

    throw buildValidationError(formattedErrors);
  }

  next();
};

// ==========================================
// COMMON VALIDATORS
// ==========================================

/**
 * UUID validator
 */
export const uuidValidator = (field: string = 'id') =>
  param(field)
    .isUUID()
    .withMessage(`${field} باید یک UUID معتبر باشد`);

/**
 * Pagination validators
 */
export const paginationValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('شماره صفحه باید عدد مثبت باشد')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('تعداد آیتم‌ها باید بین 1 تا 100 باشد')
    .toInt(),
  query('sortBy')
    .optional()
    .isString()
    .trim(),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('ترتیب مرتب‌سازی باید asc یا desc باشد'),
];

/**
 * Search validator
 */
export const searchValidator = query('search')
  .optional()
  .isString()
  .trim()
  .isLength({ min: 1, max: 255 })
  .withMessage('عبارت جستجو باید بین 1 تا 255 کاراکتر باشد');

/**
 * Date range validators
 */
export const dateRangeValidators = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('تاریخ شروع نامعتبر است')
    .toDate(),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('تاریخ پایان نامعتبر است')
    .toDate(),
];

// ==========================================
// USER VALIDATORS
// ==========================================

export const createUserValidators = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('نام کاربری باید بین 3 تا 50 کاراکتر باشد')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد، - و _ باشد'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('ایمیل نامعتبر است')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('رمز عبور باید بین 6 تا 128 کاراکتر باشد'),

  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('نام کامل الزامی است')
    .isLength({ min: 2, max: 255 })
    .withMessage('نام کامل باید بین 2 تا 255 کاراکتر باشد'),

  body('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage('نقش کاربر نامعتبر است'),

  body('phone')
    .optional()
    .custom((value) => {
      if (value && !validateMobileNumber(value)) {
        throw new Error('شماره تلفن نامعتبر است');
      }
      return true;
    }),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('وضعیت فعال بودن باید true یا false باشد'),
];

export const updateUserValidators = [
  uuidValidator('id'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('ایمیل نامعتبر است')
    .normalizeEmail(),

  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('نام کامل باید بین 2 تا 255 کاراکتر باشد'),

  body('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage('نقش کاربر نامعتبر است'),

  body('phone')
    .optional()
    .custom((value) => {
      if (value && !validateMobileNumber(value)) {
        throw new Error('شماره تلفن نامعتبر است');
      }
      return true;
    }),

  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('وضعیت فعال بودن باید true یا false باشد'),
];

export const updatePasswordValidators = [
  uuidValidator('id'),

  body('currentPassword')
    .notEmpty()
    .withMessage('رمز عبور فعلی الزامی است'),

  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('رمز عبور جدید باید بین 6 تا 128 کاراکتر باشد'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('تکرار رمز عبور مطابقت ندارد');
      }
      return true;
    }),
];

export const getUserValidators = [uuidValidator('id')];

export const getUsersValidators = [
  ...paginationValidators,
  searchValidator,
  query('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage('نقش کاربر نامعتبر است'),
  query('is_active')
    .optional()
    .isBoolean()
    .withMessage('وضعیت فعال بودن باید true یا false باشد')
    .toBoolean(),
];

// ==========================================
// AUTH VALIDATORS
// ==========================================

export const loginValidators = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('نام کاربری الزامی است'),

  body('password')
    .notEmpty()
    .withMessage('رمز عبور الزامی است'),
];

export const registerValidators = createUserValidators;

// ==========================================
// CUSTOMER VALIDATORS
// ==========================================

export const createCustomerValidators = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('نام کامل الزامی است')
    .isLength({ min: 2, max: 255 })
    .withMessage('نام کامل باید بین 2 تا 255 کاراکتر باشد'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('شماره تلفن الزامی است')
    .custom((value) => {
      if (!validateMobileNumber(value)) {
        throw new Error('شماره تلفن نامعتبر است');
      }
      return true;
    }),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('ایمیل نامعتبر است')
    .normalizeEmail(),

  body('national_id')
    .optional()
    .custom((value) => {
      if (value && !validateNationalId(value)) {
        throw new Error('کد ملی نامعتبر است');
      }
      return true;
    }),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('آدرس نباید بیشتر از 1000 کاراکتر باشد'),

  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('نام شهر نباید بیشتر از 100 کاراکتر باشد'),

  body('postal_code')
    .optional()
    .isLength({ min: 10, max: 10 })
    .withMessage('کد پستی باید 10 رقم باشد'),

  body('birth_date')
    .optional()
    .isISO8601()
    .withMessage('تاریخ تولد نامعتبر است')
    .toDate(),

  body('credit_limit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('سقف اعتبار باید عدد مثبت باشد')
    .toFloat(),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('یادداشت نباید بیشتر از 2000 کاراکتر باشد'),
];

export const updateCustomerValidators = [
  uuidValidator('id'),
  ...createCustomerValidators.map((validator) => {
    // Make all fields optional for update
    const chain = validator as ValidationChain;
    return chain.optional();
  }),
];

export const getCustomerValidators = [uuidValidator('id')];

export const getCustomersValidators = [
  ...paginationValidators,
  searchValidator,
  query('city')
    .optional()
    .trim(),
  query('hasDebt')
    .optional()
    .isBoolean()
    .toBoolean(),
  query('hasCredit')
    .optional()
    .isBoolean()
    .toBoolean(),
  query('is_active')
    .optional()
    .isBoolean()
    .toBoolean(),
];

// ==========================================
// PRODUCT VALIDATORS
// ==========================================

export const createProductValidators = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('نام محصول الزامی است')
    .isLength({ min: 2, max: 255 })
    .withMessage('نام محصول باید بین 2 تا 255 کاراکتر باشد'),

  body('name_en')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('نام انگلیسی نباید بیشتر از 255 کاراکتر باشد'),

  body('category')
    .notEmpty()
    .withMessage('دسته‌بندی الزامی است')
    .isIn(Object.values(ProductCategory))
    .withMessage('دسته‌بندی نامعتبر است'),

  body('type')
    .notEmpty()
    .withMessage('نوع محصول الزامی است')
    .isIn(Object.values(ProductType))
    .withMessage('نوع محصول نامعتبر است'),

  body('carat')
    .notEmpty()
    .withMessage('عیار الزامی است')
    .isIn([18, 21, 22, 24])
    .withMessage('عیار باید 18، 21، 22 یا 24 باشد')
    .toInt(),

  body('weight')
    .notEmpty()
    .withMessage('وزن الزامی است')
    .isFloat({ min: 0.001 })
    .withMessage('وزن باید عدد مثبت باشد')
    .toFloat(),

  body('wage')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('اجرت باید عدد مثبت باشد')
    .toFloat(),

  body('stone_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('قیمت نگین باید عدد مثبت باشد')
    .toFloat(),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('توضیحات نباید بیشتر از 2000 کاراکتر باشد'),

  body('stock_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('موجودی باید عدد صحیح مثبت باشد')
    .toInt(),

  body('min_stock_level')
    .optional()
    .isInt({ min: 0 })
    .withMessage('حداقل موجودی باید عدد صحیح مثبت باشد')
    .toInt(),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('محل نگهداری نباید بیشتر از 100 کاراکتر باشد'),

  body('supplier')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('نام تامین‌کننده نباید بیشتر از 255 کاراکتر باشد'),

  body('purchase_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('قیمت خرید باید عدد مثبت باشد')
    .toFloat(),

  body('selling_price')
    .notEmpty()
    .withMessage('قیمت فروش الزامی است')
    .isFloat({ min: 0 })
    .withMessage('قیمت فروش باید عدد مثبت باشد')
    .toFloat(),
];

export const updateProductValidators = [
  uuidValidator('id'),
  ...createProductValidators.map((validator) => {
    const chain = validator as ValidationChain;
    return chain.optional();
  }),
];

export const getProductValidators = [uuidValidator('id')];

export const getProductsValidators = [
  ...paginationValidators,
  searchValidator,
  query('category')
    .optional()
    .isIn(Object.values(ProductCategory))
    .withMessage('دسته‌بندی نامعتبر است'),
  query('type')
    .optional()
    .isIn(Object.values(ProductType))
    .withMessage('نوع محصول نامعتبر است'),
  query('carat')
    .optional()
    .isIn(['18', '21', '22', '24'])
    .withMessage('عیار نامعتبر است')
    .toInt(),
  query('minWeight')
    .optional()
    .isFloat({ min: 0 })
    .toFloat(),
  query('maxWeight')
    .optional()
    .isFloat({ min: 0 })
    .toFloat(),
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .toFloat(),
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .toFloat(),
  query('is_active')
    .optional()
    .isBoolean()
    .toBoolean(),
  query('lowStock')
    .optional()
    .isBoolean()
    .toBoolean(),
];

// ==========================================
// SALE VALIDATORS
// ==========================================

export const createSaleValidators = [
  body('customer_id')
    .optional()
    .isUUID()
    .withMessage('شناسه مشتری نامعتبر است'),

  body('sale_type')
    .optional()
    .isIn(Object.values(SaleType))
    .withMessage('نوع فروش نامعتبر است'),

  body('payment_method')
    .optional()
    .isIn(Object.values(PaymentMethod))
    .withMessage('روش پرداخت نامعتبر است'),

  body('items')
    .isArray({ min: 1 })
    .withMessage('حداقل یک محصول باید انتخاب شود'),

  body('items.*.product_id')
    .isUUID()
    .withMessage('شناسه محصول نامعتبر است'),

  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('تعداد باید عدد صحیح مثبت باشد')
    .toInt(),

  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('تخفیف باید عدد مثبت باشد')
    .toFloat(),

  body('tax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('مالیات باید عدد مثبت باشد')
    .toFloat(),

  body('paid_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('مبلغ پرداختی باید عدد مثبت باشد')
    .toFloat(),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('یادداشت نباید بیشتر از 2000 کاراکتر باشد'),
];

export const updateSaleValidators = [
  uuidValidator('id'),

  body('status')
    .optional()
    .isIn(Object.values(SaleStatus))
    .withMessage('وضعیت فروش نامعتبر است'),

  body('payment_method')
    .optional()
    .isIn(Object.values(PaymentMethod))
    .withMessage('روش پرداخت نامعتبر است'),

  body('discount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('تخفیف باید عدد مثبت باشد')
    .toFloat(),

  body('paid_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('مبلغ پرداختی باید عدد مثبت باشد')
    .toFloat(),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('یادداشت نباید بیشتر از 2000 کاراکتر باشد'),
];

export const getSaleValidators = [uuidValidator('id')];

export const getSalesValidators = [
  ...paginationValidators,
  ...dateRangeValidators,
  searchValidator,
  query('customer_id')
    .optional()
    .isUUID()
    .withMessage('شناسه مشتری نامعتبر است'),
  query('status')
    .optional()
    .isIn(Object.values(SaleStatus))
    .withMessage('وضعیت فروش نامعتبر است'),
  query('sale_type')
    .optional()
    .isIn(Object.values(SaleType))
    .withMessage('نوع فروش نامعتبر است'),
  query('payment_method')
    .optional()
    .isIn(Object.values(PaymentMethod))
    .withMessage('روش پرداخت نامعتبر است'),
];

// ==========================================
// TRANSACTION VALIDATORS
// ==========================================

export const createTransactionValidators = [
  body('customer_id')
    .optional()
    .isUUID()
    .withMessage('شناسه مشتری نامعتبر است'),

  body('sale_id')
    .optional()
    .isUUID()
    .withMessage('شناسه فروش نامعتبر است'),

  body('type')
    .notEmpty()
    .withMessage('نوع تراکنش الزامی است')
    .isIn(Object.values(TransactionType))
    .withMessage('نوع تراکنش نامعتبر است'),

  body('amount')
    .notEmpty()
    .withMessage('مبلغ الزامی است')
    .isFloat({ min: 0 })
    .withMessage('مبلغ باید عدد مثبت باشد')
    .toFloat(),

  body('payment_method')
    .optional()
    .isIn(Object.values(PaymentMethod))
    .withMessage('روش پرداخت نامعتبر است'),

  body('reference_number')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('شماره مرجع نباید بیشتر از 100 کاراکتر باشد'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('توضیحات نباید بیشتر از 2000 کاراکتر باشد'),
];

export const getTransactionValidators = [uuidValidator('id')];

export const getTransactionsValidators = [
  ...paginationValidators,
  ...dateRangeValidators,
  query('customer_id')
    .optional()
    .isUUID()
    .withMessage('شناسه مشتری نامعتبر است'),
  query('sale_id')
    .optional()
    .isUUID()
    .withMessage('شناسه فروش نامعتبر است'),
  query('type')
    .optional()
    .isIn(Object.values(TransactionType))
    .withMessage('نوع تراکنش نامعتبر است'),
  query('payment_method')
    .optional()
    .isIn(Object.values(PaymentMethod))
    .withMessage('روش پرداخت نامعتبر است'),
];

// ==========================================
// GOLD PRICE VALIDATORS
// ==========================================

export const createGoldPriceValidators = [
  body('carat')
    .notEmpty()
    .withMessage('عیار الزامی است')
    .isIn([18, 21, 22, 24])
    .withMessage('عیار باید 18، 21، 22 یا 24 باشد')
    .toInt(),

  body('price_per_gram')
    .notEmpty()
    .withMessage('قیمت هر گرم الزامی است')
    .isFloat({ min: 0 })
    .withMessage('قیمت باید عدد مثبت باشد')
    .toFloat(),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('تاریخ نامعتبر است')
    .toDate(),
];

export const getGoldPriceValidators = [
  query('carat')
    .optional()
    .isIn(['18', '21', '22', '24'])
    .withMessage('عیار نامعتبر است')
    .toInt(),
  ...dateRangeValidators,
];

// ==========================================
// AI VALIDATORS
// ==========================================

export const scaleReadValidators = [
  body('image')
    .notEmpty()
    .withMessage('تصویر الزامی است'),

  body('imageType')
    .optional()
    .isIn(['base64', 'file', 'url'])
    .withMessage('نوع تصویر نامعتبر است'),

  body('preprocessingOptions')
    .optional()
    .isObject()
    .withMessage('تنظیمات پیش‌پردازش باید شیء باشد'),

  body('preprocessingOptions.resize')
    .optional()
    .isBoolean()
    .toBoolean(),

  body('preprocessingOptions.grayscale')
    .optional()
    .isBoolean()
    .toBoolean(),

  body('preprocessingOptions.denoise')
    .optional()
    .isBoolean()
    .toBoolean(),

  body('preprocessingOptions.contrast')
    .optional()
    .isBoolean()
    .toBoolean(),

  body('preprocessingOptions.sharpen')
    .optional()
    .isBoolean()
    .toBoolean(),
];

// ==========================================
// REPORT VALIDATORS
// ==========================================

export const reportValidators = [
  ...dateRangeValidators,
  query('category')
    .optional()
    .isIn(Object.values(ProductCategory))
    .withMessage('دسته‌بندی نامعتبر است'),
  query('type')
    .optional()
    .isIn(Object.values(ProductType))
    .withMessage('نوع محصول نامعتبر است'),
  query('customer_id')
    .optional()
    .isUUID()
    .withMessage('شناسه مشتری نامعتبر است'),
  query('status')
    .optional()
    .isIn(Object.values(SaleStatus))
    .withMessage('وضعیت فروش نامعتبر است'),
  query('payment_method')
    .optional()
    .isIn(Object.values(PaymentMethod))
    .withMessage('روش پرداخت نامعتبر است'),
];

// ==========================================
// SYSTEM SETTINGS VALIDATORS
// ==========================================

export const updateSettingValidators = [
  body('setting_key')
    .trim()
    .notEmpty()
    .withMessage('کلید تنظیمات الزامی است')
    .isLength({ max: 100 })
    .withMessage('کلید تنظیمات نباید بیشتر از 100 کاراکتر باشد'),

  body('setting_value')
    .notEmpty()
    .withMessage('مقدار تنظیمات الزامی است'),

  body('data_type')
    .optional()
    .isIn(['string', 'number', 'boolean', 'json'])
    .withMessage('نوع داده نامعتبر است'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('توضیحات نباید بیشتر از 500 کاراکتر باشد'),
];

// ==========================================
// FILE UPLOAD VALIDATORS
// ==========================================

export const imageUploadValidators = [
  body('fieldname')
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
export const persianTextValidator = (fieldName: string) =>
  body(fieldName)
    .custom((value) => {
      if (value && !/^[\u0600-\u06FF\s0-9۰-۹]+$/.test(value)) {
        throw new Error(`${fieldName} باید فقط شامل حروف فارسی باشد`);
      }
      return true;
    });

/**
 * Custom validator for positive number
 */
export const positiveNumberValidator = (fieldName: string) =>
  body(fieldName)
    .isFloat({ min: 0 })
    .withMessage(`${fieldName} باید عدد مثبت باشد`)
    .toFloat();

/**
 * Custom validator for integer range
 */
export const intRangeValidator = (fieldName: string, min: number, max: number) =>
  body(fieldName)
    .isInt({ min, max })
    .withMessage(`${fieldName} باید بین ${min} تا ${max} باشد`)
    .toInt();

// ==========================================
// CONDITIONAL VALIDATORS
// ==========================================

/**
 * Require field if another field has specific value
 */
export const requiredIf = (fieldName: string, dependentField: string, dependentValue: any) =>
  body(fieldName).custom((value, { req }) => {
    if (req.body[dependentField] === dependentValue && !value) {
      throw new Error(`${fieldName} الزامی است`);
    }
    return true;
  });

// ==========================================
// SANITIZATION HELPERS
// ==========================================

/**
 * Sanitize Persian digits to English
 */
export const sanitizePersianDigits = (fieldName: string) =>
  body(fieldName).customSanitizer((value) => {
    if (typeof value === 'string') {
      const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      
      let result = value;
      for (let i = 0; i < 10; i++) {
        result = result.replace(new RegExp(persianDigits[i]!, 'g'), englishDigits[i]!);
      }
      return result;
    }
    return value;
  });

// ==========================================
// EXPORT VALIDATOR GROUPS
// ==========================================

export const validators = {
  // Common
  uuid: uuidValidator,
  pagination: paginationValidators,
  search: searchValidator,
  dateRange: dateRangeValidators,

  // Auth
  login: loginValidators,
  register: registerValidators,

  // Users
  createUser: createUserValidators,
  updateUser: updateUserValidators,
  updatePassword: updatePasswordValidators,
  getUser: getUserValidators,
  getUsers: getUsersValidators,

  // Customers
  createCustomer: createCustomerValidators,
  updateCustomer: updateCustomerValidators,
  getCustomer: getCustomerValidators,
  getCustomers: getCustomersValidators,

  // Products
  createProduct: createProductValidators,
  updateProduct: updateProductValidators,
  getProduct: getProductValidators,
  getProducts: getProductsValidators,

  // Sales
  createSale: createSaleValidators,
  updateSale: updateSaleValidators,
  getSale: getSaleValidators,
  getSales: getSalesValidators,

  // Transactions
  createTransaction: createTransactionValidators,
  getTransaction: getTransactionValidators,
  getTransactions: getTransactionsValidators,

  // Gold Prices
  createGoldPrice: createGoldPriceValidators,
  getGoldPrice: getGoldPriceValidators,

  // AI
  scaleRead: scaleReadValidators,

  // Reports
  report: reportValidators,

  // Settings
  updateSetting: updateSettingValidators,

  // File Upload
  imageUpload: imageUploadValidators,
};

export default validators;