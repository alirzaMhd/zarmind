// ======================================================================
// Zarmind Inventory API (frontend)
// - Products CRUD
// - Stock operations
// - Search/filters/pagination
// - Gold price endpoints
// - Reports/statistics/alerts
// - Product image upload
// ======================================================================

import { API } from "../utils/constants.js";
import { apiFetch, buildQuery, formatError } from "../utils/helpers.js";

import AuthAPI from "./auth.js"; // for refresh on 401

// ----------------------------------------------------------------------
// Internal: fetch with 1-time refresh retry
// ----------------------------------------------------------------------

async function fetchWithRefresh(path, opts = {}) {
  try {
    return await apiFetch(path, opts);
  } catch (err) {
    if (err && err.status === 401) {
      const ok = await tryRefreshToken();
      if (ok) return await apiFetch(path, opts);
    }
    throw err;
  }
}

async function tryRefreshToken() {
  try {
    await AuthAPI.refresh();
    return true;
  } catch {
    return false;
  }
}

const unwrap = (res) => res?.data ?? res;

// ----------------------------------------------------------------------
// Products CRUD
// ----------------------------------------------------------------------

export async function listProducts({ page, limit, filters = {} } = {}) {
  const qs = buildQuery({ page, limit, ...filters });
  const res = await fetchWithRefresh(API.INVENTORY.ROOT + qs, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getProduct(id) {
  const res = await fetchWithRefresh(API.INVENTORY.ITEM(id), { method: "GET" });
  return unwrap(res);
}

export async function getProductWithPrice(id) {
  const res = await fetchWithRefresh(API.INVENTORY.PRICE_LIVE(id), {
    method: "GET",
  });
  return unwrap(res);
}

export async function createProduct(data) {
  const res = await fetchWithRefresh(API.INVENTORY.ROOT, {
    method: "POST",
    body: data,
  });
  return unwrap(res);
}

export async function updateProduct(id, data) {
  const res = await fetchWithRefresh(API.INVENTORY.ITEM(id), {
    method: "PUT",
    body: data,
  });
  return unwrap(res);
}

export async function deleteProduct(id) {
  const res = await fetchWithRefresh(API.INVENTORY.ITEM(id), {
    method: "DELETE",
  });
  return unwrap(res);
}

export async function restoreProduct(id) {
  const res = await fetchWithRefresh(API.INVENTORY.ROOT + `/${id}/restore`, {
    method: "PATCH",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Product Images
// ----------------------------------------------------------------------

/**
 * Update product image
 * @param {string} id
 * @param {Object} payload { file?: Blob|File, image_url?: string }
 */
export async function updateImage(id, { file, image_url } = {}) {
  if (file) {
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetchWithRefresh(API.INVENTORY.IMAGE(id), {
      method: "PUT",
      json: false,
      body: fd,
    });
    return unwrap(res);
  }
  if (image_url) {
    const res = await fetchWithRefresh(API.INVENTORY.IMAGE(id), {
      method: "PUT",
      body: { image_url },
    });
    return unwrap(res);
  }
  throw new Error("فایل یا آدرس تصویر الزامی است");
}

export async function removeImage(id) {
  const res = await fetchWithRefresh(API.INVENTORY.IMAGE(id), {
    method: "DELETE",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Stock operations
// ----------------------------------------------------------------------

export async function updateStock(id, { type, quantity, reason } = {}) {
  const res = await fetchWithRefresh(API.INVENTORY.STOCK(id), {
    method: "PATCH",
    body: { type, quantity, reason },
  });
  return unwrap(res);
}

export async function increaseStock(id, quantity, reason) {
  const res = await fetchWithRefresh(API.INVENTORY.STOCK_INCREASE(id), {
    method: "PATCH",
    body: { quantity, reason },
  });
  return unwrap(res);
}

export async function decreaseStock(id, quantity, reason) {
  const res = await fetchWithRefresh(API.INVENTORY.STOCK_DECREASE(id), {
    method: "PATCH",
    body: { quantity, reason },
  });
  return unwrap(res);
}

export async function setStock(id, quantity, reason) {
  const res = await fetchWithRefresh(API.INVENTORY.STOCK_SET(id), {
    method: "PATCH",
    body: { quantity, reason },
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Search / Lists
// ----------------------------------------------------------------------

export async function searchProducts(query, limit = 10) {
  const qs = buildQuery({ query, limit, q: query });
  const res = await fetchWithRefresh(API.INVENTORY.SEARCH + qs, {
    method: "GET",
  });
  return unwrap(res);
}

export async function advancedSearch(filters = {}) {
  const qs = buildQuery(filters);
  const res = await fetchWithRefresh(API.INVENTORY.ADVANCED + qs, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getLowStock() {
  const res = await fetchWithRefresh(API.INVENTORY.LOW_STOCK, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getOutOfStock() {
  const res = await fetchWithRefresh(API.INVENTORY.OUT_OF_STOCK, {
    method: "GET",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Prices (gold) and bulk operations
// ----------------------------------------------------------------------

export async function recalculatePrices(category) {
  const res = await fetchWithRefresh(API.INVENTORY.RECALC_PRICES, {
    method: "POST",
    body: category ? { category } : {},
  });
  return unwrap(res);
}

export async function bulkUpdatePrices({ percentage, category, type }) {
  const res = await fetchWithRefresh(API.INVENTORY.BULK_PRICE, {
    method: "POST",
    body: { percentage, category, type },
  });
  return unwrap(res);
}

export async function bulkSetActive({ product_ids, is_active }) {
  const res = await fetchWithRefresh(API.INVENTORY.BULK_ACTIVE, {
    method: "POST",
    body: { product_ids, is_active },
  });
  return unwrap(res);
}

export async function getCurrentGoldPrice(carat = 18) {
  const qs = buildQuery({ carat });
  const res = await fetchWithRefresh(API.INVENTORY.GOLD_PRICE_CURRENT + qs, {
    method: "GET",
  });
  return unwrap(res);
}

export async function setGoldPrice({ carat, price_per_gram, date }) {
  const body = { carat, price_per_gram, ...(date ? { date } : {}) };
  const res = await fetchWithRefresh(API.INVENTORY.GOLD_PRICE_SET, {
    method: "POST",
    body,
  });
  return unwrap(res);
}

export async function getGoldPriceHistory(carat = 18, days = 30) {
  const qs = buildQuery({ carat, days });
  const res = await fetchWithRefresh(API.INVENTORY.GOLD_PRICE_HISTORY + qs, {
    method: "GET",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Reports & Stats
// ----------------------------------------------------------------------

export async function getReport() {
  const res = await fetchWithRefresh(API.INVENTORY.REPORT, { method: "GET" });
  return unwrap(res);
}

export async function getStatistics() {
  const res = await fetchWithRefresh(API.INVENTORY.STATISTICS, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getStockAlerts() {
  const res = await fetchWithRefresh(API.INVENTORY.ALERTS, { method: "GET" });
  return unwrap(res);
}

export async function getProductPerformance(id) {
  const res = await fetchWithRefresh(API.INVENTORY.PERFORMANCE(id), {
    method: "GET",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Default export
// ----------------------------------------------------------------------

export default {
  // CRUD
  listProducts,
  getProduct,
  getProductWithPrice,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,

  // Image
  updateImage,
  removeImage,

  // Stock
  updateStock,
  increaseStock,
  decreaseStock,
  setStock,

  // Search / lists
  searchProducts,
  advancedSearch,
  getLowStock,
  getOutOfStock,

  // Bulk & Gold
  recalculatePrices,
  bulkUpdatePrices,
  bulkSetActive,
  getCurrentGoldPrice,
  setGoldPrice,
  getGoldPriceHistory,

  // Reports & Stats
  getReport,
  getStatistics,
  getStockAlerts,
  getProductPerformance,
};
