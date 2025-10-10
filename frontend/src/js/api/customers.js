// ======================================================================
// Zarmind Customers API (frontend)
// - Customers CRUD
// - Balance/Credit operations
// - Search/filters/pagination
// - Account summary, history, transactions, lifetime value
// - Reports/statistics/top/near-credit/debtors/inactive/new
// - Bulk operations
// - Credit checks (canPurchase/availableCredit)
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
// Customers CRUD
// ----------------------------------------------------------------------

export async function listCustomers({ page, limit, filters = {} } = {}) {
  const qs = buildQuery({ page, limit, ...filters });
  const res = await fetchWithRefresh(API.CUSTOMERS.ROOT + qs, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getCustomer(id) {
  const res = await fetchWithRefresh(API.CUSTOMERS.ITEM(id), { method: "GET" });
  return unwrap(res);
}

export async function createCustomer(data) {
  const res = await fetchWithRefresh(API.CUSTOMERS.ROOT, {
    method: "POST",
    body: data,
  });
  return unwrap(res);
}

export async function updateCustomer(id, data) {
  const res = await fetchWithRefresh(API.CUSTOMERS.ITEM(id), {
    method: "PUT",
    body: data,
  });
  return unwrap(res);
}

export async function deleteCustomer(id) {
  const res = await fetchWithRefresh(API.CUSTOMERS.ITEM(id), {
    method: "DELETE",
  });
  return unwrap(res);
}

export async function restoreCustomer(id) {
  const res = await fetchWithRefresh(API.CUSTOMERS.ROOT + `/${id}/restore`, {
    method: "PATCH",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Balance & Credit
// ----------------------------------------------------------------------

export async function adjustBalance(id, { type, amount, reason } = {}) {
  const res = await fetchWithRefresh(API.CUSTOMERS.ROOT + `/${id}/balance`, {
    method: "PATCH",
    body: { type, amount, reason },
  });
  return unwrap(res);
}

export async function addDebt(id, amount, reason) {
  const res = await fetchWithRefresh(API.CUSTOMERS.ROOT + `/${id}/debt/add`, {
    method: "PATCH",
    body: { amount, reason },
  });
  return unwrap(res);
}

export async function reduceDebt(id, amount, reason) {
  const res = await fetchWithRefresh(
    API.CUSTOMERS.ROOT + `/${id}/debt/reduce`,
    {
      method: "PATCH",
      body: { amount, reason },
    }
  );
  return unwrap(res);
}

export async function settleAccount(id) {
  const res = await fetchWithRefresh(API.CUSTOMERS.ROOT + `/${id}/settle`, {
    method: "PATCH",
  });
  return unwrap(res);
}

export async function updateCreditLimit(id, credit_limit) {
  const res = await fetchWithRefresh(API.CUSTOMERS.CREDIT_LIMIT(id), {
    method: "PATCH",
    body: { credit_limit },
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Search / Lists
// ----------------------------------------------------------------------

export async function searchCustomers(query, limit = 10) {
  const qs = buildQuery({ query, limit, q: query });
  const res = await fetchWithRefresh(API.CUSTOMERS.SEARCH + qs, {
    method: "GET",
  });
  return unwrap(res);
}

export async function advancedSearch(filters = {}) {
  const qs = buildQuery(filters);
  const res = await fetchWithRefresh(API.CUSTOMERS.ADVANCED + qs, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getDebtors() {
  const res = await fetchWithRefresh(API.CUSTOMERS.DEBTORS, { method: "GET" });
  return unwrap(res);
}

export async function getCreditors() {
  const res = await fetchWithRefresh(API.CUSTOMERS.CREDITORS, {
    method: "GET",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Account & History
// ----------------------------------------------------------------------

export async function getAccountSummary(id) {
  const res = await fetchWithRefresh(API.CUSTOMERS.ACCOUNT(id), {
    method: "GET",
  });
  return unwrap(res);
}

export async function getPurchaseHistory(id) {
  const res = await fetchWithRefresh(API.CUSTOMERS.PURCHASE_HISTORY(id), {
    method: "GET",
  });
  return unwrap(res);
}

export async function getTransactions(id) {
  const res = await fetchWithRefresh(API.CUSTOMERS.TRANSACTIONS(id), {
    method: "GET",
  });
  return unwrap(res);
}

export async function getLifetimeValue(id) {
  const res = await fetchWithRefresh(API.CUSTOMERS.LIFETIME_VALUE(id), {
    method: "GET",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Reports & Statistics
// ----------------------------------------------------------------------

export async function getStatistics() {
  const res = await fetchWithRefresh(API.CUSTOMERS.STATISTICS, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getTopCustomers(limit = 10) {
  const qs = buildQuery({ limit });
  const res = await fetchWithRefresh(API.CUSTOMERS.TOP + qs, { method: "GET" });
  return unwrap(res);
}

export async function getDebtorReport() {
  const res = await fetchWithRefresh(API.CUSTOMERS.DEBTOR_REPORT, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getCustomersNearingCreditLimit(threshold = 80) {
  const qs = buildQuery({ threshold });
  const res = await fetchWithRefresh(API.CUSTOMERS.NEAR_CREDIT_LIMIT + qs, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getNewCustomers() {
  const res = await fetchWithRefresh(API.CUSTOMERS.NEW, { method: "GET" });
  return unwrap(res);
}

export async function getInactiveCustomers(days = 90) {
  const qs = buildQuery({ days });
  const res = await fetchWithRefresh(API.CUSTOMERS.INACTIVE + qs, {
    method: "GET",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Bulk Operations
// ----------------------------------------------------------------------

export async function bulkSetActive({ customer_ids, is_active }) {
  const res = await fetchWithRefresh(API.CUSTOMERS.BULK_ACTIVE, {
    method: "POST",
    body: { customer_ids, is_active },
  });
  return unwrap(res);
}

export async function bulkUpdateCreditLimit({ customer_ids, credit_limit }) {
  const res = await fetchWithRefresh(API.CUSTOMERS.BULK_CREDIT_LIMIT, {
    method: "POST",
    body: { customer_ids, credit_limit },
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Credit Checks
// ----------------------------------------------------------------------

export async function canPurchase(id, amount) {
  const qs = buildQuery({ amount });
  const res = await fetchWithRefresh(API.CUSTOMERS.CAN_PURCHASE(id) + qs, {
    method: "GET",
  });
  return unwrap(res);
}

export async function getAvailableCredit(id) {
  const res = await fetchWithRefresh(API.CUSTOMERS.AVAILABLE_CREDIT(id), {
    method: "GET",
  });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Default export
// ----------------------------------------------------------------------

export default {
  // CRUD
  listCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  restoreCustomer,

  // Balance & Credit
  adjustBalance,
  addDebt,
  reduceDebt,
  settleAccount,
  updateCreditLimit,

  // Search / Lists
  searchCustomers,
  advancedSearch,
  getDebtors,
  getCreditors,

  // Account & History
  getAccountSummary,
  getPurchaseHistory,
  getTransactions,
  getLifetimeValue,

  // Reports & Statistics
  getStatistics,
  getTopCustomers,
  getDebtorReport,
  getCustomersNearingCreditLimit,
  getNewCustomers,
  getInactiveCustomers,

  // Bulk
  bulkSetActive,
  bulkUpdateCreditLimit,

  // Credit checks
  canPurchase,
  getAvailableCredit,
};
