// ==========================================
// ZARMIND - Type Definitions
// ==========================================

import { Request } from 'express';

// ==========================================
// USER & AUTHENTICATION
// ==========================================

export interface IUser {
  id: string;
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  VIEWER = 'viewer'
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: ITokenPayload;
}

// ==========================================
// PRODUCT & INVENTORY
// ==========================================

export interface IProduct {
  id: string;
  code: string;
  name: string;
  name_en?: string;
  category: ProductCategory;
  type: ProductType;
  carat: number; // عیار (18, 21, 22, 24)
  weight: number; // وزن به گرم
  wage: number; // اجرت ساخت
  stone_price?: number; // قیمت نگین
  description?: string;
  image_url?: string;
  stock_quantity: number;
  min_stock_level: number;
  location?: string; // محل نگهداری
  supplier?: string;
  purchase_price?: number;
  selling_price: number;
  is_active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export enum ProductCategory {
  GOLD = 'gold', // طلا
  SILVER = 'silver', // نقره
  PLATINUM = 'platinum', // پلاتین
  DIAMOND = 'diamond', // الماس
  GEMSTONE = 'gemstone' // سنگ قیمتی
}

export enum ProductType {
  RING = 'ring', // انگشتر
  NECKLACE = 'necklace', // گردنبند
  BRACELET = 'bracelet', // دستبند
  EARRING = 'earring', // گوشواره
  ANKLET = 'anklet', // پابند
  BANGLE = 'bangle', // النگو
  CHAIN = 'chain', // زنجیر
  PENDANT = 'pendant', // آویز
  COIN = 'coin', // سکه
  BAR = 'bar', // شمش
  SET = 'set', // نیم‌ست
  OTHER = 'other' // سایر
}

export interface IProductFilter {
  category?: ProductCategory;
  type?: ProductType;
  carat?: number;
  minWeight?: number;
  maxWeight?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  isActive?: boolean;
  lowStock?: boolean;
}

// Product with current gold price calculation
export interface IProductWithPrice extends IProduct {
  current_gold_price?: number; // قیمت فعلی طلا برای عیار محصول
  calculated_price?: number; // قیمت محاسبه شده بر اساس قیمت فعلی طلا
  price_difference?: number; // تفاوت قیمت فروش با قیمت محاسبه شده
  price_updated_at?: Date; // زمان آخرین به‌روزرسانی قیمت طلا
}

// ==========================================
// CUSTOMER
// ==========================================

export interface ICustomer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  email?: string;
  national_id?: string; // کد ملی
  address?: string;
  city?: string;
  postal_code?: string;
  birth_date?: Date;
  notes?: string;
  credit_limit?: number;
  balance: number; // بدهی/طلبکار (+ = بدهکار، - = طلبکار)
  total_purchases: number;
  last_purchase_date?: Date;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ICustomerFilter {
  search?: string;
  hasDebt?: boolean;
  hasCredit?: boolean;
  city?: string;
  isActive?: boolean;
}

// ==========================================
// SALES & TRANSACTIONS
// ==========================================

export interface ISale {
  id: string;
  sale_number: string;
  customer_id?: string;
  sale_type: SaleType;
  payment_method: PaymentMethod;
  total_amount: number;
  gold_price: number; // قیمت طلا در زمان فروش
  discount?: number;
  tax?: number;
  final_amount: number;
  paid_amount: number;
  remaining_amount: number;
  status: SaleStatus;
  sale_date: Date;
  due_date?: Date; // تاریخ سررسید (برای اقساطی)
  notes?: string;
  items: ISaleItem[];
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ISaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  weight: number;
  carat: number;
  unit_price: number;
  wage: number;
  total_price: number;
}

// Extended sale interface with guaranteed items
export interface ISaleWithItems extends ISale {
  items: ISaleItem[];
}

// Filter interface for sales queries
export interface ISaleFilter {
  customer_id?: string;
  status?: SaleStatus;
  sale_type?: SaleType;
  payment_method?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  hasRemainingAmount?: boolean;
}

export enum SaleType {
  CASH = 'cash', // نقدی
  INSTALLMENT = 'installment', // اقساطی
  EXCHANGE = 'exchange', // معاوضه
  REPAIR = 'repair' // تعمیر
}

export enum PaymentMethod {
  CASH = 'cash', // نقد
  CARD = 'card', // کارت
  TRANSFER = 'transfer', // انتقال
  CHECK = 'check', // چک
  MIXED = 'mixed' // ترکیبی
}

export enum SaleStatus {
  DRAFT = 'draft', // پیش‌فاکتور
  COMPLETED = 'completed', // تکمیل شده
  PARTIAL = 'partial', // پرداخت جزئی
  CANCELLED = 'cancelled', // لغو شده
  RETURNED = 'returned' // مرجوعی
}

export interface ITransaction {
  id: string;
  transaction_number: string;
  customer_id?: string;
  sale_id?: string;
  type: TransactionType;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  description?: string;
  transaction_date: Date;
  created_by: string;
  created_at: Date;
}

export enum TransactionType {
  SALE = 'sale', // فروش
  PURCHASE = 'purchase', // خرید
  RETURN = 'return', // برگشت
  PAYMENT = 'payment', // دریافت
  EXPENSE = 'expense', // هزینه
  ADJUSTMENT = 'adjustment' // تسویه
}

// Payment related interfaces
export interface IPayment {
  id: string;
  sale_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
  payment_date: Date;
  processed_by: string;
  created_at: Date;
}

export interface IPaymentInput {
  sale_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
  processed_by: string;
}

// ==========================================
// AI & IMAGE PROCESSING
// ==========================================

export interface IScaleReadRequest {
  image: string; // base64 or file path
  imageType?: 'base64' | 'file' | 'url';
  preprocessingOptions?: IImagePreprocessingOptions;
}

export interface IScaleReadResponse {
  success: boolean;
  weight?: number;
  unit?: WeightUnit;
  confidence?: number;
  rawText?: string;
  processedImageUrl?: string;
  error?: string;
}

export interface IImagePreprocessingOptions {
  resize?: boolean;
  grayscale?: boolean;
  denoise?: boolean;
  contrast?: boolean;
  sharpen?: boolean;
  threshold?: boolean;
}

export enum WeightUnit {
  GRAM = 'gram', // گرم
  KILOGRAM = 'kilogram', // کیلوگرم
  MITHQAL = 'mithqal', // مثقال
  OUNCE = 'ounce' // اونس
}

export interface IAIProductDetection {
  image: string;
  detected_type?: ProductType;
  detected_category?: ProductCategory;
  confidence?: number;
  suggestions?: string[];
}

// ==========================================
// REPORTS
// ==========================================

export interface ISalesReport {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  salesCount: number;
  averageSaleAmount: number;
  topProducts: ITopProduct[];
  topCustomers: ITopCustomer[];
  salesByCategory: ICategorySales[];
  salesByDate: IDailySales[];
}

export interface ITopProduct {
  product_id: string;
  product_name: string;
  quantity_sold: number;
  total_revenue: number;
}

export interface ITopCustomer {
  customer_id: string;
  customer_name: string;
  total_purchases: number;
  total_amount: number;
}

export interface ICategorySales {
  category: ProductCategory;
  total_amount: number;
  quantity_sold: number;
  percentage: number;
}

export interface IDailySales {
  date: string;
  sales_count: number;
  total_amount: number;
}

export interface IInventoryReport {
  totalProducts: number;
  totalValue: number;
  totalWeight: number;
  lowStockItems: IProduct[];
  inventoryByCategory: ICategoryInventory[];
  inventoryByType: ITypeInventory[];
}

export interface ICategoryInventory {
  category: ProductCategory;
  quantity: number;
  total_weight: number;
  total_value: number;
}

export interface ITypeInventory {
  type: ProductType;
  quantity: number;
  total_weight: number;
  total_value: number;
}

export interface IDashboardStats {
  todaySales: number;
  todayRevenue: number;
  monthSales: number;
  monthRevenue: number;
  totalCustomers: number;
  activeProducts: number;
  lowStockCount: number;
  pendingPayments: number;
  recentSales: ISale[];
  recentCustomers: ICustomer[];
}

export interface IReportFilter {
  startDate?: Date;
  endDate?: Date;
  category?: ProductCategory;
  type?: ProductType;
  customerId?: string;
  status?: SaleStatus;
  paymentMethod?: PaymentMethod;
}

// Sales statistics and analytics
export interface ISalesStatistics {
  total_sales: number;
  total_revenue: number;
  total_profit: number;
  average_sale_amount: number;
  sales_count: number;
  completed_sales: number;
  cancelled_sales: number;
  pending_payments: number;
  total_discount: number;
  total_tax: number;
}

export interface ISalesPerformance {
  today: IPerformanceMetrics;
  week: IPerformanceMetrics;
  month: IPerformanceMetrics;
  year: IPerformanceMetrics;
}

export interface IPerformanceMetrics {
  sales_count: number;
  total_revenue: number;
  total_profit: number;
  average_sale: number;
  growth_rate?: number;
}

export interface ISalesTrend {
  period: string; // Date or period label
  sales_count: number;
  total_amount: number;
  average_amount: number;
}

export interface IConversionRate {
  total_drafts: number;
  completed_sales: number;
  conversion_rate: number;
  percentage: string;
}

export interface IBestSellingProduct {
  product_id: string;
  product_name: string;
  product_code: string;
  category: ProductCategory;
  type: ProductType;
  total_quantity: number;
  total_revenue: number;
  sales_count: number;
  rank: number;
}

// Invoice and Receipt
export interface IInvoice {
  sale: ISaleWithItems;
  customer?: ICustomer;
  business: IBusinessSettings;
  total_in_words: string;
  qr_code?: string;
}

export interface IReceipt {
  transaction: ITransaction;
  sale?: ISale;
  customer?: ICustomer;
  business: IBusinessSettings;
  amount_in_words: string;
}

// ==========================================
// AUDIT LOG
// ==========================================

export interface IAuditLog {
  id: string;
  user_id: string;
  action: AuditAction;
  entity_type: EntityType;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  LOGIN = 'login',
  LOGOUT = 'logout',
  CANCEL = 'cancel',
  RESTORE = 'restore'
}

export enum EntityType {
  USER = 'user',
  PRODUCT = 'product',
  CUSTOMER = 'customer',
  SALE = 'sale',
  TRANSACTION = 'transaction',
  PAYMENT = 'payment'
}

// ==========================================
// API RESPONSES
// ==========================================

export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: IValidationError[];
  meta?: IPaginationMeta;
}

export interface IValidationError {
  field: string;
  message: string;
}

export interface IPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResponse<T = any> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ==========================================
// DATABASE
// ==========================================

export interface IDbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface IQueryResult<T = any> {
  rows: T[];
  rowCount: number;
  command: string;
}

// ==========================================
// SETTINGS & CONFIGURATION
// ==========================================

export interface IGoldPrice {
  id: string;
  carat: number;
  price_per_gram: number;
  date: Date;
  created_by: string;
  created_at: Date;
}

export interface ISystemSettings {
  id: string;
  setting_key: string;
  setting_value: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  updated_at: Date;
}

export interface IBusinessSettings {
  storeName: string;
  storeNameEn?: string;
  address: string;
  phone: string;
  email?: string;
  taxRate: number;
  currency: string;
  logo?: string;
  invoicePrefix: string;
  receiptFooter?: string;
  taxId?: string;
  registrationNumber?: string;
}

// ==========================================
// FILE UPLOAD
// ==========================================

export interface IUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

export interface IImageUploadResponse {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  error?: string;
}

// ==========================================
// UTILITY TYPES
// ==========================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface ITimestamps {
  created_at: Date;
  updated_at: Date;
}

export interface IUserStamp {
  created_by: string;
  updated_by?: string;
}

// ==========================================
// CONSTANTS
// ==========================================

export const CARAT_OPTIONS = [18, 21, 22, 24] as const;
export type CaratType = typeof CARAT_OPTIONS[number];

export const WEIGHT_UNITS = {
  GRAM: 'gram',
  KILOGRAM: 'kilogram',
  MITHQAL: 'mithqal',
  OUNCE: 'ounce'
} as const;

export const CURRENCY = {
  IRR: 'ریال',
  IRT: 'تومان',
  USD: 'دلار'
} as const;

// ==========================================
// ERROR TYPES
// ==========================================

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  errors: IValidationError[];

  constructor(message: string, errors: IValidationError[] = []) {
    super(message, 400);
    this.errors = errors;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database error') {
    super(message, 500);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}