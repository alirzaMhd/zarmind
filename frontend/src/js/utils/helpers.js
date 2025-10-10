// ======================================================================
// Zarmind Frontend Helpers
// - Number/date formatting (FA/Jalali)
// - Digits conversion (EN ⇄ FA)
// - Storage (localStorage JSON-safe)
// - API wrapper (fetch with auth + JSON helpers)
// - DOM utilities (qs/qsa/on/delegate/createEl)
// - Events (simple bus + toast)
// - Misc (debounce/throttle/sleep/uid)
// ======================================================================

import {
  APP,
  API_BASE_URL as DEFAULT_API_BASE_URL,
  STORAGE_KEYS,
  CURRENCY,
  DATE_FORMATS,
  WEIGHT_UNITS,
  LABELS_FA,
  HEADERS,
  EVENTS,
  REGEX,
} from "./constants.js";

import {
  format as jFormat,
  parse as jParse,
  isValid as jIsValid,
} from "date-fns-jalali";

// ----------------------------------------------------------------------
// Digits & String utils (FA/EN)
// ----------------------------------------------------------------------

export const toPersianDigits = (value) => {
  const map = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(value).replace(/\d/g, (d) => map[parseInt(d, 10)] || d);
};

export const toEnglishDigits = (value) => {
  const map = {
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9",
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  };
  return String(value).replace(/[۰-۹٠-٩]/g, (d) => map[d] || d);
};

export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
export const uid = (prefix = "id") =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export const escapeHTML = (s = "") =>
  s.replace(
    /[&<>"'`=\/]/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;",
        "`": "&#x60;",
        "=": "&#x3D;",
      })[c]
  );

// ----------------------------------------------------------------------
// Number / Currency / Weight
// ----------------------------------------------------------------------

export const formatNumber = (
  value,
  { locale = "fa-IR", digits = "fa" } = {}
) => {
  if (value === null || value === undefined || value === "") return "";
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);
  const s = new Intl.NumberFormat(locale).format(num);
  return digits === "fa" ? toPersianDigits(s) : s;
};

export const formatPrice = (
  amount,
  {
    currency = CURRENCY.SYMBOL_FA,
    locale = "fa-IR",
    digits = "fa",
    suffix = true,
  } = {}
) => {
  if (amount === null || amount === undefined || amount === "") return "";
  const s = formatNumber(amount, { locale, digits });
  return suffix ? `${s} ${currency}` : s;
};

export const formatWeight = (
  value,
  unit = WEIGHT_UNITS.GRAM,
  { locale = "fa-IR", digits = "fa" } = {}
) => {
  const s = formatNumber(value, { locale, digits });
  const label = LABELS_FA.UNIT[unit] || unit;
  return `${s} ${label}`;
};

export const parseNumber = (str) => {
  if (str === null || str === undefined) return NaN;
  const cleaned = toEnglishDigits(String(str)).replace(/[^\d.-]/g, "");
  return parseFloat(cleaned);
};

// ----------------------------------------------------------------------
// Date (Jalali)
// ----------------------------------------------------------------------

export const parseDate = (value, fmt = DATE_FORMATS.DATE) => {
  if (value instanceof Date) return value;
  if (!value) return null;
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d;
  const p = jParse(String(value), fmt, new Date());
  return jIsValid(p) ? p : null;
};

export const formatDate = (
  value,
  fmt = DATE_FORMATS.DATE,
  { digits = "fa" } = {}
) => {
  const d = parseDate(value);
  if (!d) return "";
  const out = jFormat(d, fmt);
  return digits === "fa" ? toPersianDigits(out) : out;
};

export const formatDateTime = (value, fmt = DATE_FORMATS.DATE_TIME, opts) =>
  formatDate(value, fmt, opts);

export const timeAgo = (value, { locale = "fa", digits = "fa" } = {}) => {
  const d = parseDate(value);
  if (!d) return "";
  const now = new Date();
  let diff = Math.round((d - now) / 1000); // seconds
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  const units = [
    ["year", 365 * 24 * 3600],
    ["month", 30 * 24 * 3600],
    ["week", 7 * 24 * 3600],
    ["day", 24 * 3600],
    ["hour", 3600],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [u, sec] of units) {
    if (Math.abs(diff) >= sec || u === "second") {
      const val = Math.round(diff / sec);
      const out = rtf.format(val, u);
      return digits === "fa" ? toPersianDigits(out) : out;
    }
  }
  return "";
};

// ----------------------------------------------------------------------
// Storage (JSON-safe)
// ----------------------------------------------------------------------

export const storage = {
  get(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
  getJSON(key, fallback = null) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

// Tokens & Theme
export const getAccessToken = () => storage.get(STORAGE_KEYS.ACCESS_TOKEN);
export const setAccessToken = (t) => storage.set(STORAGE_KEYS.ACCESS_TOKEN, t);
export const setRefreshToken = (t) =>
  storage.set(STORAGE_KEYS.REFRESH_TOKEN, t);
export const clearTokens = () => {
  storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
  storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
};

export const applyTheme = (theme) => {
  const root = document.documentElement;
  if (theme === "auto") {
    const prefers = matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
    root.setAttribute("data-theme", prefers);
  } else {
    root.setAttribute("data-theme", theme);
  }
  storage.set(STORAGE_KEYS.THEME, theme);
  emit(EVENTS.THEME_CHANGED, { theme });
};
export const initTheme = () =>
  applyTheme(storage.get(STORAGE_KEYS.THEME, "dark"));

// ----------------------------------------------------------------------
// API Wrapper (fetch + JSON + auth)
// ----------------------------------------------------------------------

let API_BASE_URL = DEFAULT_API_BASE_URL;

export const setApiBaseUrl = (url) => {
  if (!url) return;
  API_BASE_URL = url.replace(/\/+$/, "");
  try {
    storage.set(STORAGE_KEYS.API_BASE_URL, API_BASE_URL);
    if (window && window.__ZARMIND__)
      window.__ZARMIND__.apiBaseUrl = API_BASE_URL;
  } catch {}
};

export const getApiBaseUrl = () => API_BASE_URL;

const buildUrl = (path) => {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const p = String(path).startsWith("/") ? path : `/${path}`;
  return API_BASE_URL + p;
};

const mergeHeaders = (base, extra) => {
  const out = { ...(base || {}) };
  for (const k in extra || {}) out[k] = extra[k];
  return out;
};

export const apiFetch = async (
  path,
  { method = "GET", headers = {}, body, auth = true, json = true, signal } = {}
) => {
  const url = buildUrl(path);
  const finalHeaders = mergeHeaders(json ? HEADERS.JSON : {}, headers);

  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const init = { method, headers: finalHeaders, signal };
  if (body !== undefined)
    init.body = json && typeof body === "object" ? JSON.stringify(body) : body;

  const res = await fetch(url, init);
  const isJSON = res.headers.get("content-type")?.includes("application/json");
  const data = isJSON ? await res.json().catch(() => ({})) : await res.text();

  if (!res.ok) {
    const message =
      (isJSON ? data?.error || data?.message : data) || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
};

export const api = {
  get: (path, opts) => apiFetch(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => apiFetch(path, { ...opts, method: "POST", body }),
  put: (path, body, opts) => apiFetch(path, { ...opts, method: "PUT", body }),
  patch: (path, body, opts) =>
    apiFetch(path, { ...opts, method: "PATCH", body }),
  delete: (path, opts) => apiFetch(path, { ...opts, method: "DELETE" }),
};

// ----------------------------------------------------------------------
// Querystring
// ----------------------------------------------------------------------

export const buildQuery = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
    else sp.append(k, v);
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
};

export const parseQueryString = (qs = location.search) => {
  const sp = new URLSearchParams(qs.startsWith("?") ? qs.slice(1) : qs);
  const out = {};
  sp.forEach((v, k) => {
    out[k] = v;
  });
  return out;
};

// ----------------------------------------------------------------------
// Pagination helpers
// ----------------------------------------------------------------------

export const getPaginationMeta = (total = 0, page = 1, limit = 20) => {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  const current = clamp(page, 1, totalPages);
  return {
    page: current,
    limit,
    total,
    totalPages,
    hasNext: current < totalPages,
    hasPrev: current > 1,
  };
};

// ----------------------------------------------------------------------
// DOM helpers
// ----------------------------------------------------------------------

export const qs = (sel, ctx = document) => ctx.querySelector(sel);
export const qsa = (sel, ctx = document) =>
  Array.from(ctx.querySelectorAll(sel));

export const on = (el, event, handler, opts) => {
  el.addEventListener(event, handler, opts);
  return () => el.removeEventListener(event, handler, opts);
};

export const delegate = (el, event, selector, handler, opts) => {
  const fn = (e) => {
    const target = e.target.closest(selector);
    if (target && el.contains(target)) handler(e, target);
  };
  el.addEventListener(event, fn, opts);
  return () => el.removeEventListener(event, fn, opts);
};

export const createEl = (
  tag,
  { attrs = {}, className, html, text, children = [] } = {}
) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  if (html !== undefined) el.innerHTML = html;
  if (text !== undefined) el.textContent = text;
  for (const c of children) el.appendChild(c);
  return el;
};

// ----------------------------------------------------------------------
// Files / Blobs
// ----------------------------------------------------------------------

export const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

export const downloadBlob = (blob, filename = "download") => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
};

// ----------------------------------------------------------------------
// Events (simple bus)
// ----------------------------------------------------------------------

const bus = new EventTarget();

export const onEvent = (name, handler) => {
  const fn = (e) => handler(e.detail, e);
  bus.addEventListener(name, fn);
  return () => bus.removeEventListener(name, fn);
};
export const emit = (name, detail) =>
  bus.dispatchEvent(new CustomEvent(name, { detail }));

export const toast = (message, { type = "info", timeout = 3500 } = {}) => {
  emit(EVENTS.TOAST, {
    id: uid("toast"),
    type,
    message,
    timeout,
    createdAt: Date.now(),
  });
};

// ----------------------------------------------------------------------
// Validation helpers
// ----------------------------------------------------------------------

export const isMobileIR = (s) =>
  REGEX.MOBILE_IR.test(toEnglishDigits(String(s || "")));
export const isEmail = (s) => REGEX.EMAIL.test(String(s || ""));
export const isNationalIdIR = (s) =>
  REGEX.NATIONAL_ID_IR.test(toEnglishDigits(String(s || "")));
export const isPostalCodeIR = (s) =>
  REGEX.POSTAL_CODE_IR.test(toEnglishDigits(String(s || "")));

// ----------------------------------------------------------------------
// Misc
// ----------------------------------------------------------------------

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const debounce = (fn, wait = 250) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
};
export const throttle = (fn, wait = 250) => {
  let last = 0,
    timer;
  return (...args) => {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      last = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
};

// ----------------------------------------------------------------------
// Init helpers
// ----------------------------------------------------------------------

export const initAppHeaderUser = (user) => {
  const el = document.getElementById("header-user");
  if (!el) return;
  el.textContent = user?.full_name ? `سلام، ${user.full_name}` : "خوش آمدید";
};

export const formatError = (err, fallback = "خطای نامشخص رخ داده است") => {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  if (err.data?.error) return err.data.error;
  if (err.data?.message) return err.data.message;
  return fallback;
};

// Expose some globals for quick debugging (optional)
if (typeof window !== "undefined") {
  window.zarmindHelpers = {
    toPersianDigits,
    toEnglishDigits,
    formatNumber,
    formatPrice,
    formatWeight,
    formatDate,
    formatDateTime,
    timeAgo,
    apiFetch,
    api,
    buildQuery,
    parseQueryString,
    storage,
    getAccessToken,
    setAccessToken,
    clearTokens,
    setApiBaseUrl,
    getApiBaseUrl,
  };
}

export default {
  toPersianDigits,
  toEnglishDigits,
  formatNumber,
  formatPrice,
  formatWeight,
  parseNumber,
  formatDate,
  formatDateTime,
  timeAgo,
  storage,
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  applyTheme,
  initTheme,
  setApiBaseUrl,
  getApiBaseUrl,
  apiFetch,
  api,
  buildQuery,
  parseQueryString,
  getPaginationMeta,
  qs,
  qsa,
  on,
  delegate,
  createEl,
  fileToBase64,
  downloadBlob,
  onEvent,
  emit,
  toast,
  isMobileIR,
  isEmail,
  isNationalIdIR,
  isPostalCodeIR,
  sleep,
  debounce,
  throttle,
  uid,
  escapeHTML,
  initAppHeaderUser,
  formatError,
};
