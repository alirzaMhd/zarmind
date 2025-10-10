// ======================================================================
// Zarmind - Customers Page
// - Loads customers view and manages: stats, filters, table,
//   balance/credit operations, quick lists, bulk actions, export
// ======================================================================

import { ROUTES } from "../utils/constants.js";

import {
  qs,
  qsa,
  on,
  toast,
  formatError,
  toPersianDigits,
  parseNumber,
  createEl,
  downloadBlob,
} from "../utils/helpers.js";

import {
  formatCurrency,
  formatDateFa,
  timeAgoFa,
  formatMobile,
} from "../utils/formatters.js";

import CustomersAPI from "../api/customers.js";
import createTable, {
  currencyColumn,
  numberColumn,
  dateColumn,
} from "../components/table.js";
import Modal from "../components/modal.js";

// ----------------------------------------------------------------------
// Template loader
// ----------------------------------------------------------------------

async function loadTemplate() {
  const candidates = [
    "/views/customers.html",
    "./views/customers.html",
    "../views/customers.html",
    "../../src/views/customers.html",
  ];
  for (const href of candidates) {
    try {
      const res = await fetch(href, { cache: "no-cache" });
      if (res.ok) return await res.text();
    } catch {}
  }
  // Minimal fallback
  return `
    <div class="container p-6">
      <div class="page-header">
        <div class="page-title">مشتریان</div>
        <div class="page-actions">
          <button class="btn ghost" id="cust-refresh">↻ به‌روزرسانی</button>
        </div>
      </div>
      <div class="card card-body">در حال توسعه صفحه مشتریان…</div>
    </div>
  `;
}

// ----------------------------------------------------------------------
// Page mount
// ----------------------------------------------------------------------

export default async function mountCustomers(root, ctx = {}) {
  const html = await loadTemplate();
  root.innerHTML = html;

  // Elements
  const el = {
    // Header actions
    refresh: qs("#cust-refresh", root),
    btnNew: qs("#btn-customer-new", root),
    btnReport: qs("#btn-customer-report", root),

    // Stats
    statTotal: qs("#stat-total-customers", root),
    statActive: qs("#stat-active-customers", root),
    statDebtors: qs("#stat-debtors", root),
    statTotalDebt: qs("#stat-total-debt", root),

    // Toolbar filters
    fSearch: qs("#filter-search", root),
    fCity: qs("#filter-city", root),
    fActive: qs("#filter-active", root),
    fHasDebt: qs("#filter-hasdebt", root),
    fHasCredit: qs("#filter-hascredit", root),
    btnApplyFilters: qs("#btn-apply-filters", root),
    btnResetFilters: qs("#btn-reset-filters", root),

    // Bulk
    btnBulkActive: qs("#btn-bulk-active", root),
    btnBulkCreditLimit: qs("#btn-bulk-credit-limit", root),
    btnExport: qs("#btn-export", root),

    // Quick info badges
    badgeNew: qs("#badge-new-customers", root),
    badgeInactive: qs("#badge-inactive-customers", root),

    // Table
    tableRoot: qs("#customers-table", root),
    tableSearch: qs("#table-search", root),
    pageSize: qs("#page-size", root),

    // Lists
    listDebtors: qs("#list-debtors", root),
    listNew: qs("#list-new-customers", root),
    listInactive: qs("#list-inactive-customers", root),
  };

  // State
  let offs = [];
  let table = null;

  // Filters (server-side)
  let filters = {
    search: "",
    city: "",
    isActive: "",
    hasDebt: "",
    hasCredit: "",
  };

  // Wire events
  wireEvents();

  // Initial loads
  await Promise.allSettled([loadStats(), loadQuickBadges(), loadSideLists()]);
  mountTableComponent();

  // Return unmount
  return function unmount() {
    try {
      offs.forEach((off) => off && off());
    } catch {}
    try {
      table && table.destroy();
    } catch {}
  };

  // ------------------------------------------------------------------
  // Events
  // ------------------------------------------------------------------

  function wireEvents() {
    if (el.refresh)
      offs.push(
        on(el.refresh, "click", async () => {
          try {
            el.refresh.disabled = true;
            await Promise.allSettled([
              loadStats(),
              loadQuickBadges(),
              loadSideLists(),
            ]);
            table && table.reload();
            toast("به‌روزرسانی شد", { type: "success" });
          } catch (err) {
            toast(formatError(err, "خطا در به‌روزرسانی"), { type: "error" });
          } finally {
            el.refresh.disabled = false;
          }
        })
      );

    if (el.btnNew)
      offs.push(
        on(el.btnNew, "click", () => {
          Modal.alert(
            "ثبت مشتری جدید در این نسخه به‌صورت سریع فراهم نیست.\nاز API یا بخش تنظیمات استفاده کنید.",
            { title: "افزودن مشتری" }
          );
        })
      );

    if (el.btnReport)
      offs.push(
        on(el.btnReport, "click", async () => {
          try {
            const res = await CustomersAPI.getStatistics();
            const s = res?.data || res || {};
            const content = createEl("div", {
              html: `
            <div class="grid" style="gap:8px;">
              <div>کل مشتریان: <strong>${toPersianDigits(String(s.totalCustomers ?? s.total ?? "0"))}</strong></div>
              <div>فعال: <strong>${toPersianDigits(String(s.activeCustomers ?? s.active ?? "0"))}</strong></div>
              <div>بدهکاران: <strong>${toPersianDigits(String(s.customersWithDebt ?? "0"))}</strong></div>
              <div>جمع بدهی: <strong>${formatCurrency(s.totalDebt ?? 0)}</strong></div>
              <div>میانگین خرید: <strong>${formatCurrency(s.averagePurchasePerCustomer ?? 0)}</strong></div>
            </div>
          `,
            });
            Modal.open({ title: "گزارش مشتریان", content, size: "md" });
          } catch (err) {
            toast(formatError(err, "خطا در دریافت گزارش مشتریان"), {
              type: "error",
            });
          }
        })
      );

    // Filters
    if (el.btnApplyFilters)
      offs.push(on(el.btnApplyFilters, "click", applyFilters));
    if (el.btnResetFilters)
      offs.push(on(el.btnResetFilters, "click", resetFilters));

    // Bulk: active toggle
    if (el.btnBulkActive)
      offs.push(
        on(el.btnBulkActive, "click", async () => {
          if (!table) return;
          const { ids } = table.getSelected();
          if (!ids.length)
            return toast("هیچ ردیفی انتخاب نشده است", { type: "warn" });
          const yes = await Modal.confirm(
            `تغییر وضعیت ${toPersianDigits(ids.length)} مشتری؟`,
            { title: "تغییر وضعیت گروهی" }
          );
          if (!yes) return;
          try {
            el.btnBulkActive.disabled = true;
            // Toggle based on first row status (heuristic)
            const currentRows = table.state.rows || [];
            const first = currentRows.find((r) => ids.includes(String(r.id)));
            const makeActive = !(first && first.is_active === true);
            await CustomersAPI.bulkSetActive({
              customer_ids: ids,
              is_active: makeActive,
            });
            toast("وضعیت به‌روزرسانی شد", { type: "success" });
            table.reload();
          } catch (err) {
            toast(formatError(err, "خطا در تغییر وضعیت"), { type: "error" });
          } finally {
            el.btnBulkActive.disabled = false;
          }
        })
      );

    // Bulk: credit limit
    if (el.btnBulkCreditLimit)
      offs.push(
        on(el.btnBulkCreditLimit, "click", async () => {
          if (!table) return;
          const { ids } = table.getSelected();
          if (!ids.length)
            return toast("هیچ ردیفی انتخاب نشده است", { type: "warn" });
          const val = await Modal.prompt("سقف اعتبار (تومان):", {
            title: "تغییر گروهی سقف اعتبار",
            inputType: "number",
            okText: "ثبت",
          });
          if (val === null) return;
          const credit_limit = parseNumber(val);
          if (!isFinite(credit_limit) || credit_limit < 0)
            return toast("سقف اعتبار نامعتبر است", { type: "warn" });
          try {
            el.btnBulkCreditLimit.disabled = true;
            await CustomersAPI.bulkUpdateCreditLimit({
              customer_ids: ids,
              credit_limit,
            });
            toast("سقف اعتبار بروزرسانی شد", { type: "success" });
            table.reload();
          } catch (err) {
            toast(formatError(err, "خطا در بروزرسانی سقف اعتبار"), {
              type: "error",
            });
          } finally {
            el.btnBulkCreditLimit.disabled = false;
          }
        })
      );

    // Export
    if (el.btnExport)
      offs.push(
        on(el.btnExport, "click", async () => {
          try {
            const stats = await CustomersAPI.getStatistics();
            const blob = new Blob(
              [JSON.stringify(stats?.data || stats || {}, null, 2)],
              { type: "application/json;charset=utf-8" }
            );
            downloadBlob(blob, `customers-report-${Date.now()}.json`);
            toast("خروجی JSON دانلود شد", { type: "success" });
          } catch (err) {
            toast(formatError(err, "خطا در خروجی گرفتن"), { type: "error" });
          }
        })
      );

    // Table controls
    if (el.tableSearch)
      offs.push(
        on(
          el.tableSearch,
          "input",
          debounce(
            () => table && table.setSearch(el.tableSearch.value || ""),
            400
          )
        )
      );
    if (el.pageSize)
      offs.push(
        on(
          el.pageSize,
          "change",
          () => table && table.setPageSize(parseInt(el.pageSize.value, 10))
        )
      );
  }

  // ------------------------------------------------------------------
  // Stats
  // ------------------------------------------------------------------

  async function loadStats() {
    try {
      const res = await CustomersAPI.getStatistics();
      const s = res?.data || res || {};
      setText(
        el.statTotal,
        toPersianDigits(String(s.totalCustomers ?? s.total ?? 0))
      );
      setText(
        el.statActive,
        toPersianDigits(String(s.activeCustomers ?? s.active ?? 0))
      );
      setText(
        el.statDebtors,
        toPersianDigits(String(s.customersWithDebt ?? 0))
      );
      setText(el.statTotalDebt, formatCurrency(s.totalDebt ?? 0));
    } catch {
      // keep skeletons
    }
  }

  // ------------------------------------------------------------------
  // Quick badges
  // ------------------------------------------------------------------

  async function loadQuickBadges() {
    try {
      const list = await CustomersAPI.getNewCustomers();
      const count = Array.isArray(list)
        ? list.length
        : (list?.data || []).length || 0;
      setText(el.badgeNew, toPersianDigits(String(count)));
    } catch {
      setText(el.badgeNew, "۰");
    }

    try {
      const list2 = await CustomersAPI.getInactiveCustomers(90);
      const count2 = Array.isArray(list2)
        ? list2.length
        : (list2?.data || []).length || 0;
      setText(el.badgeInactive, toPersianDigits(String(count2)));
    } catch {
      setText(el.badgeInactive, "۰");
    }
  }

  // ------------------------------------------------------------------
  // Side lists
  // ------------------------------------------------------------------

  async function loadSideLists() {
    // Debtors
    try {
      const rep = await CustomersAPI.getDebtorReport();
      renderList(
        el.listDebtors,
        rep?.data || rep || [],
        (c) => ({
          left: c.full_name || "—",
          right: `بدهی: ${formatCurrency(c.debt_amount || c.balance || 0)}`,
        }),
        6
      );
    } catch {
      renderList(el.listDebtors, []);
    }
    // New customers
    try {
      const list = await CustomersAPI.getNewCustomers();
      renderList(
        el.listNew,
        list?.data || list || [],
        (c) => ({
          left: c.full_name || "—",
          right: formatMobile(c.phone || ""),
        }),
        6
      );
    } catch {
      renderList(el.listNew, []);
    }
    // Inactive customers
    try {
      const list2 = await CustomersAPI.getInactiveCustomers(90);
      renderList(
        el.listInactive,
        list2?.data || list2 || [],
        (c) => ({
          left: c.full_name || "—",
          right: c.last_purchase_date
            ? `آخرین خرید: ${timeAgoFa(c.last_purchase_date)}`
            : "—",
        }),
        8
      );
    } catch {
      renderList(el.listInactive, []);
    }
  }

  function renderList(
    container,
    list = [],
    mapper = (x) => ({ left: String(x), right: "" }),
    limit = 8
  ) {
    if (!container) return;
    if (!Array.isArray(list) || list.length === 0) {
      container.innerHTML = `<div class="empty"><div class="title">موردی نیست</div></div>`;
      return;
    }
    const items = list
      .slice(0, limit)
      .map((x) => {
        const { left, right } = mapper(x);
        return `
        <div class="list-item">
          <div>${left}</div>
          <div class="badge">${right}</div>
        </div>
      `;
      })
      .join("");
    container.innerHTML = items;
  }

  // ------------------------------------------------------------------
  // Filters
  // ------------------------------------------------------------------

  function applyFilters() {
    filters = {
      search: (el.fSearch?.value || "").trim(),
      city: (el.fCity?.value || "").trim(),
      isActive: el.fActive?.value || "",
      hasDebt: el.fHasDebt?.value || "",
      hasCredit: el.fHasCredit?.value || "",
    };
    table && table.setFilters(normalizeFilters(filters));
  }

  function resetFilters() {
    [el.fSearch, el.fCity, el.fActive, el.fHasDebt, el.fHasCredit].forEach(
      (f) => f && (f.value = "")
    );
    filters = {
      search: "",
      city: "",
      isActive: "",
      hasDebt: "",
      hasCredit: "",
    };
    table && table.setFilters(normalizeFilters(filters));
  }

  function normalizeFilters(f) {
    const out = {};
    if (f.search) out.search = f.search;
    if (f.city) out.city = f.city;
    if (f.isActive) out.isActive = f.isActive === "true";
    if (f.hasDebt) out.hasDebt = f.hasDebt === "true";
    if (f.hasCredit) out.hasCredit = f.hasCredit === "true";
    return out;
  }

  // ------------------------------------------------------------------
  // Table
  // ------------------------------------------------------------------

  function mountTableComponent() {
    const columns = [
      { key: "customer_code", header: "کد", sortable: true },
      { key: "full_name", header: "نام", sortable: true },
      {
        key: "phone",
        header: "موبایل",
        sortable: false,
        format: (v) => formatMobile(v),
      },
      { key: "email", header: "ایمیل", sortable: false },
      { key: "city", header: "شهر", sortable: true },
      {
        key: "balance",
        header: "مانده",
        sortable: true,
        align: "end",
        format: (v) => formatCurrency(v || 0),
      },
      {
        key: "credit_limit",
        header: "سقف اعتبار",
        sortable: true,
        align: "end",
        format: (v) => formatCurrency(v || 0),
      },
      {
        key: "last_purchase_date",
        header: "آخرین خرید",
        sortable: true,
        format: (v) => (v ? timeAgoFa(v) : "—"),
      },
      {
        key: "total_purchases",
        header: "مجموع خرید",
        sortable: true,
        align: "end",
        format: (v) => formatCurrency(v || 0),
      },
      {
        key: "is_active",
        header: "وضعیت",
        sortable: true,
        render: (row, v) =>
          `<span class="badge ${v ? "success" : "danger"}">${v ? "فعال" : "غیرفعال"}</span>`,
      },
    ];

    const actions = [
      {
        label: "غیرفعال",
        className: "sm",
        showIf: (row) => row.is_active,
        onClick: async (row) => {
          const ok = await Modal.confirm(
            `مشتری "${row.full_name}" غیرفعال شود؟`,
            { title: "غیرفعال کردن" }
          );
          if (!ok) return;
          try {
            await CustomersAPI.deleteCustomer(row.id);
            table.reload();
            toast("مشتری غیرفعال شد", { type: "success" });
          } catch (err) {
            toast(formatError(err), { type: "error" });
          }
        },
      },
      {
        label: "بازیابی",
        className: "sm",
        showIf: (row) => !row.is_active,
        onClick: async (row) => {
          try {
            await CustomersAPI.restoreCustomer(row.id);
            table.reload();
            toast("مشتری فعال شد", { type: "success" });
          } catch (err) {
            toast(formatError(err), { type: "error" });
          }
        },
      },
      {
        label: "افزایش بدهی",
        className: "sm",
        onClick: async (row) => {
          const val = await Modal.prompt("مبلغ افزایش بدهی:", {
            title: "افزایش بدهی",
            inputType: "number",
            okText: "ثبت",
          });
          if (val === null) return;
          const amt = parseNumber(val);
          if (!isFinite(amt) || amt <= 0)
            return toast("مبلغ نامعتبر است", { type: "warn" });
          try {
            await CustomersAPI.addDebt(row.id, amt);
            toast("بدهی افزایش یافت", { type: "success" });
            table.reload();
          } catch (err) {
            toast(formatError(err), { type: "error" });
          }
        },
      },
      {
        label: "کاهش بدهی",
        className: "sm",
        onClick: async (row) => {
          const val = await Modal.prompt("مبلغ پرداخت/کاهش:", {
            title: "کاهش بدهی",
            inputType: "number",
            okText: "ثبت",
          });
          if (val === null) return;
          const amt = parseNumber(val);
          if (!isFinite(amt) || amt <= 0)
            return toast("مبلغ نامعتبر است", { type: "warn" });
          try {
            await CustomersAPI.reduceDebt(row.id, amt);
            toast("بدهی کاهش یافت", { type: "success" });
            table.reload();
          } catch (err) {
            toast(formatError(err), { type: "error" });
          }
        },
      },
      {
        label: "سقف اعتبار",
        className: "sm",
        onClick: async (row) => {
          const val = await Modal.prompt("سقف اعتبار جدید (تومان):", {
            title: "سقف اعتبار",
            inputType: "number",
            okText: "ثبت",
          });
          if (val === null) return;
          const cl = parseNumber(val);
          if (!isFinite(cl) || cl < 0)
            return toast("مقدار نامعتبر است", { type: "warn" });
          try {
            await CustomersAPI.updateCreditLimit(row.id, cl);
            toast("سقف اعتبار بروزرسانی شد", { type: "success" });
            table.reload();
          } catch (err) {
            toast(formatError(err), { type: "error" });
          }
        },
      },
      {
        label: "حساب",
        className: "sm",
        onClick: async (row) => {
          try {
            const res = await CustomersAPI.getAccountSummary(row.id);
            const acc = res?.data || res || {};
            const content = createEl("div", {
              html: `
                <div class="grid" style="gap:8px;">
                  <div>نام: <strong>${row.full_name || "—"}</strong></div>
                  <div>مانده: <strong>${formatCurrency(acc.balance ?? row.balance ?? 0)}</strong></div>
                  <div>سقف اعتبار: <strong>${formatCurrency(acc.customer?.credit_limit ?? row.credit_limit ?? 0)}</strong></div>
                  <div>مجموع خرید: <strong>${formatCurrency(acc.totalPurchases ?? row.total_purchases ?? 0)}</strong></div>
                  <div>وضعیت: <span class="badge ${row.is_active ? "success" : "danger"}">${row.is_active ? "فعال" : "غیرفعال"}</span></div>
                </div>
              `,
            });
            Modal.open({ title: "خلاصه حساب مشتری", content, size: "md" });
          } catch (err) {
            toast(formatError(err, "خطا در دریافت حساب"), { type: "error" });
          }
        },
      },
    ];

    table = createTable(el.tableRoot, {
      idField: "id",
      columns,
      actions,
      selectable: true,
      selectionPreserve: true,
      page: 1,
      limit: parseInt(el.pageSize?.value || "20", 10),
      pageSizes: [10, 20, 50, 100],
      searchable: false,
      data: async ({
        page,
        limit,
        sortBy,
        sortDir,
        search,
        filters: tblFilters,
      }) => {
        // Combine toolbar filters and internal table search
        const f = {
          ...(tblFilters || {}),
          ...(normalizeFilters(filters) || {}),
        };
        if (el.tableSearch?.value)
          f.search = (el.tableSearch.value || "").trim();
        const resp = await CustomersAPI.listCustomers({
          page,
          limit,
          filters: f,
        });
        const data = resp?.data || resp || {};
        const rows = Array.isArray(data)
          ? data
          : data.customers || data.items || [];
        const total = Array.isArray(data) ? data.length : data.total || 0;
        return { rows, total };
      },
      onLoaded: ({ limit }) => {
        if (el.pageSize) {
          const v = String(limit);
          if (el.pageSize.value !== v) el.pageSize.value = v;
        }
      },
    });
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  function setText(node, text) {
    if (node) node.textContent = text || "";
  }
}

// Debounce helper (local)
function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
