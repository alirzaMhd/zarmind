// ======================================================================
// Zarmind Frontend Formatters
// - UI-friendly formatters/maskers for currency, numbers, dates, ids
// - Status/payment/category/type label helpers
// - Phone/IBAN/card/postal-code masks + normalizers
// - Lightweight input mask helpers (price)
// ======================================================================

import {
  toPersianDigits,
  toEnglishDigits,
  formatNumber,
  formatPrice,
  formatDate,
  formatDateTime,
  timeAgo,
  formatWeight,
  parseNumber,
} from "./helpers.js";

import {
  LABELS_FA,
  SALE_STATUS,
  PAYMENT_METHODS,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  WEIGHT_UNITS,
  CURRENCY,
} from "./constants.js";

// ----------------------------------------------------------------------
// Numbers / Currency / Percent
// ----------------------------------------------------------------------

/**
 * Format plain number with thousand separators.
 */
export const formatNumberFa = (n, opts = {}) =>
  formatNumber(n, { locale: "fa-IR", digits: "fa", ...opts });

export const formatNumberEn = (n, opts = {}) =>
  formatNumber(n, { locale: "en-US", digits: "en", ...opts });

/**
 * Currency (Tomans by default)
 */
export const formatCurrency = (amount, opts = {}) =>
  formatPrice(amount, {
    currency: CURRENCY.SYMBOL_FA,
    locale: "fa-IR",
    digits: "fa",
    ...opts,
  });

export const parseCurrency = (str) => parseNumber(str);

/**
 * Percent formatter
 * @param value number (if raw: 42 -> "42%"; if fraction: set {fraction:true})
 */
export const formatPercent = (
  value,
  {
    digits = "fa",
    fraction = false,
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = {}
) => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (!isFinite(num)) return String(value);
  const v = fraction ? num : num / 100;
  const out = new Intl.NumberFormat("fa-IR", {
    style: "percent",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(v);
  return digits === "fa" ? toPersianDigits(out) : out;
};

/**
 * Weight (wraps helpers)
 */
export const formatWeightFa = (value, unit = WEIGHT_UNITS.GRAM, opts = {}) =>
  formatWeight(value, unit, { locale: "fa-IR", digits: "fa", ...opts });

// ----------------------------------------------------------------------
// Dates (Jalali)
// ----------------------------------------------------------------------

export const formatDateFa = (value, fmt, opts = {}) =>
  formatDate(value, fmt, { digits: "fa", ...opts });
export const formatDateTimeFa = (value, fmt, opts = {}) =>
  formatDateTime(value, fmt, { digits: "fa", ...opts });
export const timeAgoFa = (value) =>
  timeAgo(value, { locale: "fa", digits: "fa" });

// ----------------------------------------------------------------------
// Domain labels (FA)
// ----------------------------------------------------------------------

export const labelCategoryFa = (key) => LABELS_FA.CATEGORY?.[key] ?? key;
export const labelTypeFa = (key) => LABELS_FA.TYPE?.[key] ?? key;
export const labelUnitFa = (key) => LABELS_FA.UNIT?.[key] ?? key;
export const labelPaymentFa = (key) => LABELS_FA.PAYMENT?.[key] ?? key;
export const labelStatusFa = (key) => LABELS_FA.STATUS?.[key] ?? key;

/**
 * Status badge helper (returns text + suggested class)
 */
export const statusBadge = (status) => {
  const text = labelStatusFa(status);
  let cls = "badge";
  switch (status) {
    case SALE_STATUS.COMPLETED:
      cls += " status-completed";
      break;
    case SALE_STATUS.PARTIAL:
      cls += " status-partial";
      break;
    case SALE_STATUS.DRAFT:
      cls += " status-draft";
      break;
    case SALE_STATUS.CANCELLED:
      cls += " status-cancelled";
      break;
    case SALE_STATUS.RETURNED:
      cls += " danger";
      break;
    default:
      break;
  }
  return { text, className: cls };
};

export const paymentBadge = (method) => {
  const text = labelPaymentFa(method);
  let cls = "badge";
  switch (method) {
    case PAYMENT_METHODS.CASH:
      cls += " success";
      break;
    case PAYMENT_METHODS.CARD:
      cls += " info";
      break;
    case PAYMENT_METHODS.TRANSFER:
      cls += " info";
      break;
    case PAYMENT_METHODS.CHECK:
      cls += " warning";
      break;
    case PAYMENT_METHODS.MIXED:
      cls += "";
      break;
    default:
      break;
  }
  return { text, className: cls };
};

export const categoryChip = (cat) => ({
  text: labelCategoryFa(cat),
  className: "chip",
});
export const typeChip = (type) => ({
  text: labelTypeFa(type),
  className: "chip",
});

// ----------------------------------------------------------------------
// IDs / Codes (masks)
// ----------------------------------------------------------------------

/**
 * Mobile (Iran) mask/normalize
 */
export const normalizeMobile = (s, { toE164 = false } = {}) => {
  if (!s) return "";
  let v = toEnglishDigits(String(s)).replace(/[^\d]/g, "");
  if (v.startsWith("0098")) v = "0" + v.slice(4);
  if (v.startsWith("98")) v = "0" + v.slice(2);
  if (!v.startsWith("0") && v.length === 10) v = "0" + v;
  if (toE164) {
    const e = v.replace(/^0/, "");
    return e ? `+98${e}` : "";
  }
  return v;
};

export const formatMobile = (s) => {
  const v = normalizeMobile(s);
  if (!/^09\d{9}$/.test(v)) return toPersianDigits(v || "");
  // 0912 345 6789
  return toPersianDigits(v.replace(/^(\d{4})(\d{3})(\d{4})$/, "$1 $2 $3"));
};

/**
 * National ID (10 digits) - grouped 3-3-4 for readability
 */
export const formatNationalId = (s) => {
  const v = toEnglishDigits(String(s || ""))
    .replace(/[^\d]/g, "")
    .slice(0, 10);
  if (v.length <= 3) return toPersianDigits(v);
  if (v.length <= 6)
    return toPersianDigits(v.replace(/^(\d{3})(\d+)$/, "$1-$2"));
  return toPersianDigits(v.replace(/^(\d{3})(\d{3})(\d{1,4})$/, "$1-$2-$3"));
};

/**
 * IBAN (Sheba) - IR + 24 digits -> groups of 4
 */
export const formatIBAN = (s) => {
  const raw = toEnglishDigits(String(s || ""))
    .replace(/\s+/g, "")
    .toUpperCase();
  const prefixed = raw.startsWith("IR") ? raw : raw ? `IR${raw}` : "";
  const v = prefixed.replace(/[^A-Z0-9]/g, "").slice(0, 26);
  return v.replace(/(.{4})/g, "$1 ").trim();
};

/**
 * Card PAN (16 digits) -> groups of 4
 */
export const formatCardPan = (s) => {
  const v = toEnglishDigits(String(s || ""))
    .replace(/[^\d]/g, "")
    .slice(0, 16);
  return toPersianDigits(v.replace(/(.{4})/g, "$1 ").trim());
};

/**
 * Postal code (10 digits) -> 5-5
 */
export const formatPostalCode = (s) => {
  const v = toEnglishDigits(String(s || ""))
    .replace(/[^\d]/g, "")
    .slice(0, 10);
  if (v.length <= 5) return toPersianDigits(v);
  return toPersianDigits(v.replace(/^(\d{5})(\d{1,5})$/, "$1-$2"));
};

// ----------------------------------------------------------------------
// Codes / Numbers
// ----------------------------------------------------------------------

export const formatSaleNumber = (s) => String(s || "").toUpperCase();
export const formatProductCode = (s) => String(s || "").toUpperCase();
export const truncate = (s, n = 32) => {
  const str = String(s || "");
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
};
export const stripTags = (html = "") =>
  String(html).replace(/<\/?[^>]+(>|$)/g, "");

// ----------------------------------------------------------------------
// Table cell helpers (string outputs)
// ----------------------------------------------------------------------

export const moneyCell = (amount) => formatCurrency(amount);
export const dateCell = (value, fmt) => formatDateFa(value, fmt);
export const datetimeCell = (value, fmt) => formatDateTimeFa(value, fmt);
export const weightCell = (value, unit) => formatWeightFa(value, unit);

// ----------------------------------------------------------------------
// Input mask (Price) - lightweight and safe
// ----------------------------------------------------------------------

/**
 * Attach a simple money formatter to a text input
 * It formats on input and keeps caret at end (simple but effective)
 */
export const attachPriceMask = (
  inputEl,
  { locale = "fa-IR", digits = "fa" } = {}
) => {
  if (!inputEl) return () => {};
  const handler = () => {
    const raw = toEnglishDigits(inputEl.value);
    const num = parseNumber(raw);
    if (isNaN(num)) return;
    inputEl.value = formatNumber(num, { locale, digits });
  };
  inputEl.addEventListener("input", handler);
  return () => inputEl.removeEventListener("input", handler);
};

export const unmaskPrice = (s) => parseNumber(s);

// ----------------------------------------------------------------------
// Chart label helpers
// ----------------------------------------------------------------------

export const chartMoney = (v) => formatCurrency(v, { suffix: false });
export const chartNumber = (v) => formatNumberFa(v);
export const chartPercent = (v) => formatPercent(v);

// ----------------------------------------------------------------------
// Exports (default)
// ----------------------------------------------------------------------

export default {
  // number/currency
  formatNumberFa,
  formatNumberEn,
  formatCurrency,
  parseCurrency,
  formatPercent,
  formatWeightFa,

  // dates
  formatDateFa,
  formatDateTimeFa,
  timeAgoFa,

  // labels
  labelCategoryFa,
  labelTypeFa,
  labelUnitFa,
  labelPaymentFa,
  labelStatusFa,
  statusBadge,
  paymentBadge,
  categoryChip,
  typeChip,

  // masks
  normalizeMobile,
  formatMobile,
  formatNationalId,
  formatIBAN,
  formatCardPan,
  formatPostalCode,

  // codes
  formatSaleNumber,
  formatProductCode,
  truncate,
  stripTags,

  // cells
  moneyCell,
  dateCell,
  datetimeCell,
  weightCell,

  // inputs
  attachPriceMask,
  unmaskPrice,

  // charts
  chartMoney,
  chartNumber,
  chartPercent,
};
