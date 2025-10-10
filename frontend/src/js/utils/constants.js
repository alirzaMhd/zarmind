// ======================================================================
// Zarmind Frontend Constants
// - Global app/config constants
// - Static enums (roles, categories, statuses, units, etc.)
// - API endpoints and storage keys
// - UI defaults (pagination, themes, colors)
// ======================================================================

// Prefer global config injected in index.html
const RUNTIME = (typeof window !== "undefined" && window.__ZARMIND__) || {};

// ----------------------------------------------------------------------
// App / Environment
// ----------------------------------------------------------------------

export const APP = Object.freeze({
  NAME: "زرمند",
  ID: "com.zarmind.app",
  VERSION: RUNTIME.appVersion || "1.0.0",
  RTL: RUNTIME.rtl !== false, // default true
  LOGO: "/assets/images/logo.png",
});

export const API_BASE_URL =
  RUNTIME.apiBaseUrl ||
  (typeof location !== "undefined"
    ? location.origin.replace(/:\d+$/, ":3000") + "/api"
    : "/api");

// ----------------------------------------------------------------------
// Storage Keys
// ----------------------------------------------------------------------

export const STORAGE_KEYS = Object.freeze({
  ACCESS_TOKEN: "zarmind:accessToken",
  REFRESH_TOKEN: "zarmind:refreshToken",
  USER: "zarmind:user",
  THEME: "zarmind:theme",
  SETTINGS: "zarmind:settings",
  API_BASE_URL: "apiBaseUrl", // kept for compatibility with index.html
});

// ----------------------------------------------------------------------
// Routes (hash-based SPA)
// ----------------------------------------------------------------------

export const ROUTES = Object.freeze({
  DASHBOARD: "#/dashboard",
  INVENTORY: "#/inventory",
  SALES: "#/sales",
  CUSTOMERS: "#/customers",
  REPORTS: "#/reports",
  SETTINGS: "#/settings",
  LOGIN: "#/login",
});

// ----------------------------------------------------------------------
// API Paths (relative) and Endpoints (absolute)
// ----------------------------------------------------------------------

export const API_PATH = Object.freeze({
  AUTH: "/auth",
  INVENTORY: "/inventory",
  SALES: "/sales",
  CUSTOMERS: "/customers",
  REPORTS: "/reports",
  AI: "/ai",
});

export const API = Object.freeze({
  AUTH: {
    LOGIN: API_BASE_URL + API_PATH.AUTH + "/login",
    LOGIN_EMAIL: API_BASE_URL + API_PATH.AUTH + "/login-email",
    REGISTER: API_BASE_URL + API_PATH.AUTH + "/register",
    LOGOUT: API_BASE_URL + API_PATH.AUTH + "/logout",
    REFRESH: API_BASE_URL + API_PATH.AUTH + "/refresh",
    ME: API_BASE_URL + API_PATH.AUTH + "/me",
    CHANGE_PASSWORD: API_BASE_URL + API_PATH.AUTH + "/change-password",
    CHECK_USERNAME: (username) =>
      API_BASE_URL +
      API_PATH.AUTH +
      `/check-username/${encodeURIComponent(username)}`,
    CHECK_EMAIL: (email) =>
      API_BASE_URL +
      API_PATH.AUTH +
      `/check-email/${encodeURIComponent(email)}`,
  },
  INVENTORY: {
    ROOT: API_BASE_URL + API_PATH.INVENTORY,
    ITEM: (id) => API_BASE_URL + API_PATH.INVENTORY + `/${id}`,
    PRICE_LIVE: (id) => API_BASE_URL + API_PATH.INVENTORY + `/${id}/price`,
    LOW_STOCK: API_BASE_URL + API_PATH.INVENTORY + "/low-stock",
    OUT_OF_STOCK: API_BASE_URL + API_PATH.INVENTORY + "/out-of-stock",
    SEARCH: API_BASE_URL + API_PATH.INVENTORY + "/search",
    ADVANCED: API_BASE_URL + API_PATH.INVENTORY + "/advanced",
    RECALC_PRICES: API_BASE_URL + API_PATH.INVENTORY + "/recalculate-prices",
    BULK_PRICE: API_BASE_URL + API_PATH.INVENTORY + "/bulk/price-update",
    BULK_ACTIVE: API_BASE_URL + API_PATH.INVENTORY + "/bulk/active",
    GOLD_PRICE_CURRENT:
      API_BASE_URL + API_PATH.INVENTORY + "/gold-price/current",
    GOLD_PRICE_SET: API_BASE_URL + API_PATH.INVENTORY + "/gold-price",
    GOLD_PRICE_HISTORY:
      API_BASE_URL + API_PATH.INVENTORY + "/gold-price/history",
    REPORT: API_BASE_URL + API_PATH.INVENTORY + "/report",
    STATISTICS: API_BASE_URL + API_PATH.INVENTORY + "/statistics",
    ALERTS: API_BASE_URL + API_PATH.INVENTORY + "/alerts",
    PERFORMANCE: (id) =>
      API_BASE_URL + API_PATH.INVENTORY + `/${id}/performance`,
    IMAGE: (id) => API_BASE_URL + API_PATH.INVENTORY + `/${id}/image`,
    STOCK: (id) => API_BASE_URL + API_PATH.INVENTORY + `/${id}/stock`,
    STOCK_INCREASE: (id) =>
      API_BASE_URL + API_PATH.INVENTORY + `/${id}/stock/increase`,
    STOCK_DECREASE: (id) =>
      API_BASE_URL + API_PATH.INVENTORY + `/${id}/stock/decrease`,
    STOCK_SET: (id) => API_BASE_URL + API_PATH.INVENTORY + `/${id}/stock/set`,
  },
  SALES: {
    ROOT: API_BASE_URL + API_PATH.SALES,
    ITEM: (id) => API_BASE_URL + API_PATH.SALES + `/${id}`,
    NUMBER: (saleNumber) =>
      API_BASE_URL +
      API_PATH.SALES +
      `/number/${encodeURIComponent(saleNumber)}`,
    REPORT: API_BASE_URL + API_PATH.SALES + "/report",
    PERFORMANCE: API_BASE_URL + API_PATH.SALES + "/performance",
    TODAY: API_BASE_URL + API_PATH.SALES + "/today",
    TODAY_REVENUE: API_BASE_URL + API_PATH.SALES + "/today/revenue",
    RECENT: API_BASE_URL + API_PATH.SALES + "/recent",
    STATISTICS: API_BASE_URL + API_PATH.SALES + "/statistics",
    RANGE: API_BASE_URL + API_PATH.SALES + "/range",
    BEST_PRODUCTS: API_BASE_URL + API_PATH.SALES + "/best-products",
    TREND: API_BASE_URL + API_PATH.SALES + "/trend",
    CONVERSION: API_BASE_URL + API_PATH.SALES + "/conversion",
    PAYMENTS_PENDING: API_BASE_URL + API_PATH.SALES + "/pending-payments",
    PAYMENTS_OVERDUE: API_BASE_URL + API_PATH.SALES + "/overdue-payments",
    CUSTOMER_SALES: (customerId) =>
      API_BASE_URL + API_PATH.SALES + `/customer/${customerId}`,
    INVOICE: (id) => API_BASE_URL + API_PATH.SALES + `/${id}/invoice`,
    RECEIPT: (txnId) => API_BASE_URL + API_PATH.SALES + `/receipt/${txnId}`,
    STATUS: (id) => API_BASE_URL + API_PATH.SALES + `/${id}/status`,
    PAYMENTS: (id) => API_BASE_URL + API_PATH.SALES + `/${id}/payments`,
    CANCEL: (id) => API_BASE_URL + API_PATH.SALES + `/${id}/cancel`,
  },
  CUSTOMERS: {
    ROOT: API_BASE_URL + API_PATH.CUSTOMERS,
    ITEM: (id) => API_BASE_URL + API_PATH.CUSTOMERS + `/${id}`,
    SEARCH: API_BASE_URL + API_PATH.CUSTOMERS + "/search",
    ADVANCED: API_BASE_URL + API_PATH.CUSTOMERS + "/advanced",
    DEBTORS: API_BASE_URL + API_PATH.CUSTOMERS + "/debtors",
    CREDITORS: API_BASE_URL + API_PATH.CUSTOMERS + "/creditors",
    ACCOUNT: (id) => API_BASE_URL + API_PATH.CUSTOMERS + `/${id}/account`,
    PURCHASE_HISTORY: (id) =>
      API_BASE_URL + API_PATH.CUSTOMERS + `/${id}/purchase-history`,
    TRANSACTIONS: (id) =>
      API_BASE_URL + API_PATH.CUSTOMERS + `/${id}/transactions`,
    LIFETIME_VALUE: (id) =>
      API_BASE_URL + API_PATH.CUSTOMERS + `/${id}/lifetime-value`,
    STATISTICS: API_BASE_URL + API_PATH.CUSTOMERS + "/statistics",
    TOP: API_BASE_URL + API_PATH.CUSTOMERS + "/top",
    DEBTOR_REPORT: API_BASE_URL + API_PATH.CUSTOMERS + "/debtor-report",
    NEAR_CREDIT_LIMIT: API_BASE_URL + API_PATH.CUSTOMERS + "/near-credit-limit",
    NEW: API_BASE_URL + API_PATH.CUSTOMERS + "/new",
    INACTIVE: API_BASE_URL + API_PATH.CUSTOMERS + "/inactive",
    BULK_ACTIVE: API_BASE_URL + API_PATH.CUSTOMERS + "/bulk/active",
    BULK_CREDIT_LIMIT: API_BASE_URL + API_PATH.CUSTOMERS + "/bulk/credit-limit",
    CREDIT_LIMIT: (id) =>
      API_BASE_URL + API_PATH.CUSTOMERS + `/${id}/credit-limit`,
    CAN_PURCHASE: (id) =>
      API_BASE_URL + API_PATH.CUSTOMERS + `/${id}/can-purchase`,
    AVAILABLE_CREDIT: (id) =>
      API_BASE_URL + API_PATH.CUSTOMERS + `/${id}/available-credit`,
  },
  REPORTS: {
    DASHBOARD: API_BASE_URL + API_PATH.REPORTS + "/dashboard",
    QUICK_STATS: API_BASE_URL + API_PATH.REPORTS + "/quick-stats",
    SALES: API_BASE_URL + API_PATH.REPORTS + "/sales",
    COMPARATIVE_SALES: API_BASE_URL + API_PATH.REPORTS + "/comparative-sales",
    INVENTORY: API_BASE_URL + API_PATH.REPORTS + "/inventory",
    CUSTOMERS: API_BASE_URL + API_PATH.REPORTS + "/customers",
    FINANCIAL: API_BASE_URL + API_PATH.REPORTS + "/financial",
    PROFIT_LOSS: API_BASE_URL + API_PATH.REPORTS + "/profit-loss",
    GOLD_PRICE_TREND: API_BASE_URL + API_PATH.REPORTS + "/gold-price-trend",
    EXPORT: API_BASE_URL + API_PATH.REPORTS + "/export",
  },
  AI: {
    HEALTH: API_BASE_URL + API_PATH.AI + "/health",
    SCALE_READ: API_BASE_URL + API_PATH.AI + "/scale-read",
    SCALE_READ_UPLOAD: API_BASE_URL + API_PATH.AI + "/scale-read/upload",
    PRODUCT_DETECT: API_BASE_URL + API_PATH.AI + "/product-detect",
  },
});

// ----------------------------------------------------------------------
// Enums / Domain Constants
// ----------------------------------------------------------------------

export const ROLES = Object.freeze({
  ADMIN: "admin",
  MANAGER: "manager",
  EMPLOYEE: "employee",
  VIEWER: "viewer",
});

export const PRODUCT_CATEGORIES = Object.freeze([
  "gold",
  "silver",
  "platinum",
  "diamond",
  "gemstone",
]);

export const PRODUCT_TYPES = Object.freeze([
  "ring",
  "necklace",
  "bracelet",
  "earring",
  "anklet",
  "bangle",
  "chain",
  "pendant",
  "coin",
  "bar",
  "set",
  "other",
]);

export const CARAT_OPTIONS = Object.freeze([18, 21, 22, 24]);

export const WEIGHT_UNITS = Object.freeze({
  GRAM: "gram",
  KILOGRAM: "kilogram",
  MITHQAL: "mithqal",
  OUNCE: "ounce",
});

export const PAYMENT_METHODS = Object.freeze({
  CASH: "cash",
  CARD: "card",
  TRANSFER: "transfer",
  CHECK: "check",
  MIXED: "mixed",
});

export const SALE_STATUS = Object.freeze({
  DRAFT: "draft",
  COMPLETED: "completed",
  PARTIAL: "partial",
  CANCELLED: "cancelled",
  RETURNED: "returned",
});

// Persian labels for enums (UI)
export const LABELS_FA = Object.freeze({
  CATEGORY: {
    gold: "طلا",
    silver: "نقره",
    platinum: "پلاتین",
    diamond: "الماس",
    gemstone: "سنگ قیمتی",
  },
  TYPE: {
    ring: "انگشتر",
    necklace: "گردنبند",
    bracelet: "دستبند",
    earring: "گوشواره",
    anklet: "پابند",
    bangle: "النگو",
    chain: "زنجیر",
    pendant: "آویز",
    coin: "سکه",
    bar: "شمش",
    set: "نیم‌ست",
    other: "سایر",
  },
  UNIT: {
    gram: "گرم",
    kilogram: "کیلوگرم",
    mithqal: "مثقال",
    ounce: "اونس",
  },
  PAYMENT: {
    cash: "نقد",
    card: "کارت",
    transfer: "انتقال",
    check: "چک",
    mixed: "ترکیبی",
  },
  STATUS: {
    draft: "پیش‌فاکتور",
    completed: "تکمیل‌شده",
    partial: "پرداخت جزئی",
    cancelled: "لغو‌شده",
    returned: "مرجوعی",
  },
});

// ----------------------------------------------------------------------
// UI Defaults / Limits / Theme
// ----------------------------------------------------------------------

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});

export const UPLOAD = Object.freeze({
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPT_IMAGE_MIME: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "image/bmp",
  ],
});

export const THEMES = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
  AUTO: "auto",
});

export const DATE_FORMATS = Object.freeze({
  DATE: "yyyy/MM/dd",
  DATE_TIME: "yyyy/MM/dd - HH:mm",
  TIME: "HH:mm",
});

export const CURRENCY = Object.freeze({
  CODE: "IRT", // تومان
  SYMBOL_FA: "تومان",
  LOCALE: "fa-IR",
});

export const CHART_COLORS = Object.freeze({
  PRIMARY: "#22c55e",
  SECONDARY: "#0ea5e9",
  WARNING: "#f59e0b",
  DANGER: "#ef4444",
  MUTED: "#94a3b8",
  SERIES: [
    "#22c55e",
    "#0ea5e9",
    "#f59e0b",
    "#ef4444",
    "#a855f7",
    "#14b8a6",
    "#f43f5e",
    "#84cc16",
  ],
});

// ----------------------------------------------------------------------
// Events (pub/sub or DOM CustomEvent names)
// ----------------------------------------------------------------------

export const EVENTS = Object.freeze({
  APP_READY: "app:ready",
  ROUTE_CHANGED: "app:route-changed",
  AUTH_LOGIN: "auth:login",
  AUTH_LOGOUT: "auth:logout",
  INVENTORY_UPDATED: "inventory:updated",
  SALES_UPDATED: "sales:updated",
  CUSTOMERS_UPDATED: "customers:updated",
  THEME_CHANGED: "theme:changed",
  TOAST: "ui:toast",
});

// ----------------------------------------------------------------------
// Regexes (validation on client-side)
// ----------------------------------------------------------------------

export const REGEX = Object.freeze({
  MOBILE_IR: /^09\d{9}$/,
  NATIONAL_ID_IR: /^\d{10}$/,
  POSTAL_CODE_IR: /^\d{10}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NUMBER_FA: /^[\d۰-۹.,\s-]+$/,
});

// ----------------------------------------------------------------------
// Headers defaults (for fetch/axios)
// ----------------------------------------------------------------------

export const HEADERS = Object.freeze({
  JSON: { "Content-Type": "application/json; charset=utf-8" },
  FORM: {
    /* let the browser set multipart/form-data */
  },
});

// ----------------------------------------------------------------------
// Misc (placeholders / keys)
// ----------------------------------------------------------------------

export const PLACEHOLDERS = Object.freeze({
  PRODUCT_IMAGE: "/assets/images/placeholder.jpg",
  AVATAR: "/assets/images/placeholder.jpg",
});

export const FEATURE_FLAGS = Object.freeze({
  AI_SCALE_READING: true,
  AI_PRODUCT_DETECTION: false, // experimental
  EXPORT_PDF: true,
  EXPORT_EXCEL: true,
});

// Default export (optional convenience)
export default {
  APP,
  API_BASE_URL,
  API_PATH,
  API,
  STORAGE_KEYS,
  ROUTES,
  ROLES,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  CARAT_OPTIONS,
  WEIGHT_UNITS,
  PAYMENT_METHODS,
  SALE_STATUS,
  LABELS_FA,
  PAGINATION,
  UPLOAD,
  THEMES,
  DATE_FORMATS,
  CURRENCY,
  CHART_COLORS,
  EVENTS,
  REGEX,
  HEADERS,
  PLACEHOLDERS,
  FEATURE_FLAGS,
};
