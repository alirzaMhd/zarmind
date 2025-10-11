// ==========================================
// ZARMIND - Validation Rules (express-validator)
// Defines reusable validation chains for API routes.
// ==========================================

import { body, param, query, ValidationChain } from 'express-validator';
import {
  UserRole,
  ProductCategory,
  ProductType,
  SaleType,
  PaymentMethod,
  SaleStatus,
  TransactionType,
} from '../types';
import {
  validateNationalId,
  validateMobileNumber,
} from './helpers';

// ==========================================
// COMMON VALIDATORS
// ==========================================

/**
 * UUID validator for URL parameters
 */
export const uuidValidator = (field: string = 'id'): ValidationChain =>
  param(field)
    .isUUID(4)
    .withMessage('شناسه نامعتبر است');

/**
 * Pagination validators for list endpoints
 */
export const paginationValidators: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('شماره صفحه باید عدد صحیح مثبت باشد')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('تعداد آیتم‌ها باید بین ۱ تا ۱۰۰ باشد')
    .toInt(),
  query('sortBy')
    .optional()
    .isString()
    .trim()
    .escape(),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('ترتیب مرتب‌سازی باید asc یا desc باشد'),
];

/**
 * Search validator
 */
export const searchValidator: ValidationChain = query('search')
  .optional()
  .isString()
  .trim()
  .escape();

/**
 * Date range validators
 */
export const dateRangeValidators: ValidationChain[] = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('فرمت تاریخ شروع نامعتبر است')
    .toDate(),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('فرمت تاریخ پایان نامعتبر است')
    .toDate(),
];

// ==========================================
// AUTH & USER VALIDATORS
// ==========================================

export const loginValidators: ValidationChain[] = [
  body('username')
    .notEmpty()
    .withMessage('نام کاربری الزامی است')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('رمز عبور الزامی است'),
];

export const createUserValidators: ValidationChain[] = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('نام کاربری باید بین ۳ تا ۵۰ کاراکتر باشد')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('نام کاربری فقط می‌تواند شامل حروف انگلیسی، اعداد و ._- باشد')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('ایمیل نامعتبر است')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('رمز عبور باید حداقل ۶ کاراکتر باشد'),
  body('full_name')
    .notEmpty()
    .withMessage('نام کامل الزامی است')
    .trim(),
  body('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage('نقش کاربر نامعتبر است'),
  body('phone')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!validateMobileNumber(value)) {
        throw new Error('شماره موبایل نامعتبر است');
      }
      return true;
    }),
];

export const updateUserValidators: ValidationChain[] = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('ایمیل نامعتبر است')
    .normalizeEmail(),
  body('full_name')
    .optional()
    .notEmpty()
    .withMessage('نام کامل الزامی است')
    .trim(),
  body('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage('نقش کاربر نامعتبر است'),
  body('phone')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!validateMobileNumber(value)) {
        throw new Error('شماره موبایل نامعتبر است');
      }
      return true;
    }),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('وضعیت فعال بودن باید true یا false باشد'),
];

// ==========================================
// PRODUCT VALIDATORS
// ==========================================

export const createProductValidators: ValidationChain[] = [
  body('name').notEmpty().withMessage('نام محصول الزامی است').trim(),
  body('category').isIn(Object.values(ProductCategory)).withMessage('دسته‌بندی نامعتبر است'),
  body('type').isIn(Object.values(ProductType)).withMessage('نوع محصول نامعتبر است'),
  body('carat').isInt({ min: 0, max: 24 }).withMessage('عیار نامعتبر است (بین ۰ تا ۲۴)'),
  body('weight').isFloat({ gt: 0 }).withMessage('وزن باید بزرگتر از صفر باشد'),
  body('wage').optional().isFloat({ min: 0 }).withMessage('اجرت باید عدد مثبت باشد'),
  body('stone_price').optional().isFloat({ min: 0 }).withMessage('قیمت نگین باید عدد مثبت باشد'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('موجودی باید عدد صحیح مثبت باشد'),
  body('selling_price').isFloat({ gt: 0 }).withMessage('قیمت فروش باید بزرگتر از صفر باشد'),
];

export const updateProductValidators: ValidationChain[] = [
  body('name').optional().notEmpty().withMessage('نام محصول الزامی است').trim(),
  body('category').optional().isIn(Object.values(ProductCategory)).withMessage('دسته‌بندی نامعتبر است'),
  body('type').optional().isIn(Object.values(ProductType)).withMessage('نوع محصول نامعتبر است'),
  body('carat').optional().isInt({ min: 0, max: 24 }).withMessage('عیار نامعتبر است'),
  body('weight').optional().isFloat({ gt: 0 }).withMessage('وزن باید بزرگتر از صفر باشد'),
  body('wage').optional().isFloat({ min: 0 }).withMessage('اجرت باید عدد مثبت باشد'),
  body('stone_price').optional().isFloat({ min: 0 }).withMessage('قیمت نگین باید عدد مثبت باشد'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('موجودی باید عدد صحیح مثبت باشد'),
  body('selling_price').optional().isFloat({ gt: 0 }).withMessage('قیمت فروش باید بزرگتر از صفر باشد'),
  body('is_active').optional().isBoolean(),
];

// ==========================================
// CUSTOMER VALIDATORS
// ==========================================

export const createCustomerValidators: ValidationChain[] = [
  body('full_name').notEmpty().withMessage('نام کامل الزامی است').trim(),
  body('phone').notEmpty().withMessage('شماره موبایل الزامی است').custom((value) => {
    if (!validateMobileNumber(value)) {
      throw new Error('شماره موبایل نامعتبر است');
    }
    return true;
  }),
  body('email').optional().isEmail().withMessage('ایمیل نامعتبر است').normalizeEmail(),
  body('national_id').optional({ checkFalsy: true }).custom((value) => {
    if (!validateNationalId(value)) {
      throw new Error('کد ملی نامعتبر است');
    }
    return true;
  }),
  body('credit_limit').optional().isFloat({ min: 0 }).withMessage('سقف اعتبار باید عدد مثبت باشد'),
];

export const updateCustomerValidators: ValidationChain[] = [
  body('full_name').optional().notEmpty().withMessage('نام کامل الزامی است').trim(),
  body('phone').optional().custom((value) => {
    if (!validateMobileNumber(value)) {
      throw new Error('شماره موبایل نامعتبر است');
    }
    return true;
  }),
  body('email').optional().isEmail().withMessage('ایمیل نامعتبر است').normalizeEmail(),
  body('national_id').optional({ checkFalsy: true }).custom((value) => {
    if (!validateNationalId(value)) {
      throw new Error('کد ملی نامعتبر است');
    }
    return true;
  }),
  body('credit_limit').optional().isFloat({ min: 0 }).withMessage('سقف اعتبار باید عدد مثبت باشد'),
  body('is_active').optional().isBoolean(),
];

// ==========================================
// SALE VALIDATORS
// ==========================================

export const createSaleValidators: ValidationChain[] = [
  body('customer_id').optional().isUUID(4).withMessage('شناسه مشتری نامعتبر است'),
  body('gold_price').isFloat({ gt: 0 }).withMessage('قیمت طلا الزامی و باید مثبت باشد'),
  body('items').isArray({ min: 1 }).withMessage('حداقل یک آیتم فروش الزامی است'),
  body('items.*.product_id').isUUID(4).withMessage('شناسه محصول در آیتم‌ها نامعتبر است'),
  body('items.*.quantity').isInt({ gt: 0 }).withMessage('تعداد محصول باید عدد صحیح مثبت باشد'),
  body('paid_amount').optional().isFloat({ min: 0 }).withMessage('مبلغ پرداختی باید عدد مثبت باشد'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('تخفیف باید عدد مثبت باشد'),
  body('tax').optional().isFloat({ min: 0 }).withMessage('مالیات باید عدد مثبت باشد'),
  body('status').optional().isIn(Object.values(SaleStatus)).withMessage('وضعیت فروش نامعتبر است'),
];

// ==========================================
// AI VALIDATORS
// ==========================================

export const scaleReadValidators: ValidationChain[] = [
  body().custom((value, { req }) => {
    if (!req.file && !req.body.image) {
      throw new Error('تصویر الزامی است (به صورت فایل یا رشته base64/URL)');
    }
    return true;
  }),
  body('imageType').optional().isIn(['base64', 'file', 'url']).withMessage('نوع تصویر نامعتبر است'),
];

// ==========================================
// EXPORT GROUP
// ==========================================

const validators = {
  // Common
  uuid: uuidValidator,
  pagination: paginationValidators,
  search: searchValidator,
  dateRange: dateRangeValidators,

  // Auth & User
  login: loginValidators,
  createUser: createUserValidators,
  updateUser: updateUserValidators,

  // Product
  createProduct: createProductValidators,
  updateProduct: updateProductValidators,

  // Customer
  createCustomer: createCustomerValidators,
  updateCustomer: updateCustomerValidators,

  // Sale
  createSale: createSaleValidators,

  // AI
  scaleRead: scaleReadValidators,
};

export default validators;