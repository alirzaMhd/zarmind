// ======================================================================
// Zarmind Sales API (frontend)
// - Sales CRUD
// - Payments (add/pendings/overdue)
// - Filters/pagination/search
// - Reports, statistics, trends, performance
// - Invoice/Receipt generators
// ======================================================================

import { API } from "../utils/constants.js";
import { apiFetch, buildQuery } from "../utils/helpers.js";

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
// Sales CRUD
// ----------------------------------------------------------------------

export async function listSales({ page, limit, filters = {} } = {}) {
  const qs = buildQuery({ page, limit, ...filters });
  const res = await fetchWithRefresh(API.SALES.ROOT + qs, { method: "GET" });
  return unwrap(res);
}

export async function getSale(id) {
  const res = await fetchWithRefresh(API.SALES.ITEM(id), { method: "GET" });
  return unwrap(res);
}

export async function getSaleByNumber(saleNumber) {
  const res = await fetchWithRefresh(API.SALES.NUMBER(saleNumber), {
    method: "GET",
  });
  return unwrap(res);
}

export async function createSale(data) {
  const res = await fetchWithRefresh(API.SALES.ROOT, {
    method: "POST",
    body: data,
  });
  return unwrap(res);
}

export async function updateSale(id, data) {
  const res = await fetchWithRefresh(API.SALES.ITEM(id), {
    method: "PUT",
    body: data,
  });
  return unwrap(res);
}

export async function deleteSale(id) {
  const res = await fetchWithRefresh(API.SALES.ITEM(id), { method: "DELETE" });
  return unwrap(res);
}

export async function cancelSale(id, reason) {
  const res = await fetchWithRefresh(API.SALES.CANCEL(id), {
    method: "POST",
    body: reason ? { reason } : {},
  });
  return unwrap(res);
}

export async function updateStatus(id, status) {
  const res = await fetchWithRefresh(API.SALES.STATUS(id), {
    method: "PATCH",
    body: { status },
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Payments
// ----------------------------------------------------------------------

export async function addPayment(
  id,
  { amount, payment_method, reference_number, notes } = {}
) {
  const res = await fetchWithRefresh(API.SALES.PAYMENTS(id), {
    method: "POST",
    body: { amount, payment_method, reference_number, notes },
  });
  return unwrap(res);
}

export async function getPendingPayments() {
  const res = await fetchWithRefresh(API.SALES.PAYMENTS_PENDING, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getOverduePayments(days = 30) {
  const qs = buildQuery({ days });
  const res = await fetchWithRefresh(API.SALES.PAYMENTS_OVERDUE + qs, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getSalesByCustomer(customerId) {
  const res = await fetchWithRefresh(API.SALES.CUSTOMER_SALES(customerId), {
    method: "GET",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Reports & Analytics
// ----------------------------------------------------------------------

export async function getReport({ startDate, endDate } = {}) {
  const qs = buildQuery({ startDate, endDate });
  const res = await fetchWithRefresh(API.SALES.REPORT + qs, { method: "GET" });
  return unwrap(res);
}

export async function getPerformance() {
  const res = await fetchWithRefresh(API.SALES.PERFORMANCE, { method: "GET" });
  return unwrap(res);
}

export async function getTodaySales() {
  const res = await fetchWithRefresh(API.SALES.TODAY, { method: "GET" });
  return unwrap(res);
}

export async function getTodayRevenue() {
  const res = await fetchWithRefresh(API.SALES.TODAY_REVENUE, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getRecentSales(limit = 10) {
  const qs = buildQuery({ limit });
  const res = await fetchWithRefresh(API.SALES.RECENT + qs, { method: "GET" });
  return unwrap(res);
}

export async function getStatistics(startDate, endDate) {
  const qs = buildQuery({ startDate, endDate });
  const res = await fetchWithRefresh(API.SALES.STATISTICS + qs, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getSalesByDateRange(startDate, endDate) {
  const qs = buildQuery({ startDate, endDate });
  const res = await fetchWithRefresh(API.SALES.RANGE + qs, { method: "GET" });
  return unwrap(res);
}

export async function getBestSellingProducts(limit = 10, startDate, endDate) {
  const qs = buildQuery({ limit, startDate, endDate });
  const res = await fetchWithRefresh(API.SALES.BEST_PRODUCTS + qs, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getSalesTrend(period = "daily", days = 30) {
  const qs = buildQuery({ period, days });
  const res = await fetchWithRefresh(API.SALES.TREND + qs, { method: "GET" });
  return unwrap(res);
}

export async function getConversionRate(startDate, endDate) {
  const qs = buildQuery({ startDate, endDate });
  const res = await fetchWithRefresh(API.SALES.CONVERSION + qs, {
    method: "GET",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Invoice & Receipt
// ----------------------------------------------------------------------

export async function generateInvoice(id) {
  const res = await fetchWithRefresh(API.SALES.INVOICE(id), { method: "GET" });
  return unwrap(res);
}

export async function generateReceipt(transactionId) {
  const res = await fetchWithRefresh(API.SALES.RECEIPT(transactionId), {
    method: "GET",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Default export
// ----------------------------------------------------------------------

export default {
  // CRUD
  listSales,
  getSale,
  getSaleByNumber,
  createSale,
  updateSale,
  deleteSale,
  cancelSale,
  updateStatus,

  // Payments
  addPayment,
  getPendingPayments,
  getOverduePayments,
  getSalesByCustomer,

  // Reports & Analytics
  getReport,
  getPerformance,
  getTodaySales,
  getTodayRevenue,
  getRecentSales,
  getStatistics,
  getSalesByDateRange,
  getBestSellingProducts,
  getSalesTrend,
  getConversionRate,

  // Invoice & Receipt
  generateInvoice,
  generateReceipt,
};
