// ======================================================================
// Zarmind Reports API (frontend)
// - Handles all report endpoints: dashboard, sales, inventory, customers
//   financial, P&L, gold trend, comparative
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
// Dashboard & Quick Stats
// ----------------------------------------------------------------------

export async function getDashboardStats() {
  const res = await fetchWithRefresh(API.REPORTS.DASHBOARD, { method: "GET" });
  return unwrap(res);
}

export async function getQuickStats() {
  const res = await fetchWithRefresh(API.REPORTS.QUICK_STATS, {
    method: "GET",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Sales Reports
// ----------------------------------------------------------------------

export async function getSalesReport({ startDate, endDate } = {}) {
  const qs = buildQuery({ startDate, endDate });
  const res = await fetchWithRefresh(API.REPORTS.SALES + qs, { method: "GET" });
  return unwrap(res);
}

export async function getComparativeSalesReport({
  currentStart,
  currentEnd,
  previousStart,
  previousEnd,
}) {
  const qs = buildQuery({
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
  });
  const res = await fetchWithRefresh(API.REPORTS.COMPARATIVE_SALES + qs, {
    method: "GET",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Inventory Reports
// ----------------------------------------------------------------------

export async function getInventoryReport() {
  const res = await fetchWithRefresh(API.REPORTS.INVENTORY, { method: "GET" });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Customer Reports
// ----------------------------------------------------------------------

export async function getCustomerReport() {
  const res = await fetchWithRefresh(API.REPORTS.CUSTOMERS, { method: "GET" });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Financial Reports
// ----------------------------------------------------------------------

export async function getFinancialReport({ startDate, endDate } = {}) {
  const qs = buildQuery({ startDate, endDate });
  const res = await fetchWithRefresh(API.REPORTS.FINANCIAL + qs, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getProfitLossReport({ startDate, endDate } = {}) {
  const qs = buildQuery({ startDate, endDate });
  const res = await fetchWithRefresh(API.REPORTS.PROFIT_LOSS + qs, {
    method: "GET",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Gold Price Trends
// ----------------------------------------------------------------------

export async function getGoldPriceTrend(carat = 18, days = 30) {
  const qs = buildQuery({ carat, days });
  const res = await fetchWithRefresh(API.REPORTS.GOLD_PRICE_TREND + qs, {
    method: "GET",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Export
// ----------------------------------------------------------------------

export async function exportReport(reportData) {
  const res = await fetchWithRefresh(API.REPORTS.EXPORT, {
    method: "POST",
    body: { report: reportData },
  });
  // This endpoint might return a JSON blob directly
  return res;
}

// ----------------------------------------------------------------------
// Default export
// ----------------------------------------------------------------------

export default {
  // Dashboard
  getDashboardStats,
  getQuickStats,

  // Sales
  getSalesReport,
  getComparativeSalesReport,

  // Inventory
  getInventoryReport,

  // Customers
  getCustomerReport,

  // Financial
  getFinancialReport,
  getProfitLossReport,

  // Gold
  getGoldPriceTrend,

  // Export
  exportReport,
};
