// ======================================================================
// Zarmind - Sales Page
// - Loads sales view and manages: stats, filters, table, reports, charts
// - Integrates Sales API
// ======================================================================

import { ROUTES, API, LABELS_FA } from "../utils/constants.js";

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
  formatDateTimeFa,
  statusBadge,
  labelPaymentFa,
} from "../utils/formatters.js";

import SalesAPI from "../api/sales.js";
import createTable from "../components/table.js";
import Modal from "../components/modal.js";
import { lineChart, doughnutChart } from "../components/chart.js";

// ----------------------------------------------------------------------
// Template loader
// ----------------------------------------------------------------------

async function loadTemplate() {
  const candidates = [
    "/views/sales.html",
    "./views/sales.html",
    "../views/sales.html",
    "../../src/views/sales.html",
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
        <div class="page-title">فروش</div>
        <div class="page-actions"><button class="btn ghost" id="sales-refresh">↻ به‌روزرسانی</button></div>
      </div>
      <div class="card card-body">در حال توسعه صفحه فروش…</div>
    </div>
  `;
}

// ----------------------------------------------------------------------
// Page mount
// ----------------------------------------------------------------------

export default async function mountSales(root, ctx = {}) {
  const html = await loadTemplate();
  root.innerHTML = html;

  // Elements
  const el = {
    // Header
    refresh: qs("#sales-refresh", root),
    btnNew: qs("#btn-sale-new", root),
    btnReport: qs("#btn-sales-report", root),

    // Stats
    statTodayRevenue: qs("#stat-today-revenue", root),
    statTodayCount: qs("#stat-today-count", root),
    statMonthRevenue: qs("#stat-month-revenue", root),
    statPendingAmount: qs("#stat-pending-amount", root),

    // Filters
    fSearch: qs("#filter-search", root),
    fCustomer: qs("#filter-customer", root),
    fStart: qs("#filter-start", root),
    fEnd: qs("#filter-end", root),
    fStatus: qs("#filter-status", root),
    fSaleType: qs("#filter-sale-type", root),
    fPayment: qs("#filter-payment-method", root),
    btnApplyFilters: qs("#btn-apply-filters", root),
    btnResetFilters: qs("#btn-reset-filters", root),
    btnExport: qs("#btn-export", root),

    // Charts
    chartSalesTrendWrap: qs("#chart-sales-trend", root),
    chartPaymentMethodsWrap: qs("#chart-payment-methods", root),
    chartSalesPeriod: qs("#chart-sales-period", root),

    // Table
    tableRoot: qs("#sales-table", root),
    tableSearch: qs("#table-search", root),
    pageSize: qs("#page-size", root),

    // Lists
    listPending: qs("#list-pending-payments", root),
    tableRecent: qs("#table-recent-sales", root),
  };

  // State
  let offs = [];
  let table = null;
  let charts = {
    salesTrend: null,
    paymentMethods: null,
  };
  let filters = {};

  // Wire events
  wireEvents();

  // Initial loads
  await Promise.allSettled([loadStats(), loadSideLists(), loadCharts()]);
  mountTableComponent();

  // Return unmount
  return function unmount() {
    try {
      offs.forEach((off) => off && off());
    } catch {}
    try {
      table && table.destroy();
    } catch {}
    try {
      charts.salesTrend && charts.salesTrend.destroy();
    } catch {}
    try {
      charts.paymentMethods && charts.paymentMethods.destroy();
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
              loadSideLists(),
              loadCharts(),
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
            "ثبت فروش جدید در این نسخه فراهم نیست.\nلطفاً از API یا ابزارهای دیگر استفاده کنید.",
            { title: "ثبت فروش" }
          );
        })
      );

    if (el.btnReport)
      offs.push(
        on(el.btnReport, "click", async () => {
          try {
            const rep = await SalesAPI.getReport();
            const data = rep?.data || rep || {};
            const content = createEl("div", {
              html: `
            <div class="grid" style="gap:8px">
              <div>تعداد فروش: <strong>${toPersianDigits(String(data?.salesCount ?? 0))}</strong></div>
              <div>جمع درآمد: <strong>${formatCurrency(data?.totalRevenue ?? 0)}</strong></div>
            </div>
          `,
            });
            Modal.open({ title: "گزارش فروش", content, size: "md" });
          } catch (err) {
            toast(formatError(err, "خطا در دریافت گزارش فروش"), {
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

    // Export
    if (el.btnExport)
      offs.push(
        on(el.btnExport, "click", async () => {
          try {
            const rep = await SalesAPI.getReport();
            const blob = new Blob(
              [JSON.stringify(rep?.data || rep || {}, null, 2)],
              { type: "application/json;charset=utf-8" }
            );
            downloadBlob(blob, `sales-report-${Date.now()}.json`);
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
  // Data loaders
  // ------------------------------------------------------------------

  async function loadStats() {
    try {
      const perf = await SalesAPI.getPerformance();
      const s = perf?.data || perf || {};
      const { today, month } = s;
      const pend = await SalesAPI.getPendingPayments();
      const pendingList = pend?.data || pend || [];
      const pendingAmount = pendingList.reduce(
        (sum, p) => sum + (p.remaining_amount || 0),
        0
      );

      setText(el.statTodayRevenue, formatCurrency(today?.revenue ?? 0));
      setText(el.statTodayCount, toPersianDigits(String(today?.count ?? 0)));
      setText(el.statMonthRevenue, formatCurrency(month?.revenue ?? 0));
      setText(el.statPendingAmount, formatCurrency(pendingAmount));
    } catch (err) {
      console.warn("Stat load error:", err);
    }
  }

  async function loadSideLists() {
    try {
      const pend = await SalesAPI.getPendingPayments();
      renderList(
        el.listPending,
        pend?.data || pend || [],
        (s) => ({
          left: `شماره ${s.sale_number || s.id}`,
          right: `مانده: ${formatCurrency(s.remaining_amount || 0)}`,
        }),
        6
      );
    } catch {
      renderList(el.listPending, []);
    }

    try {
      const recent = await SalesAPI.getRecentSales(5);
      renderRecentSalesTable(el.tableRecent, recent?.data || recent || []);
    } catch {
      renderRecentSalesTable(el.tableRecent, []);
    }
  }

  async function loadCharts() {
    try {
      const trend = await SalesAPI.getSalesTrend("daily", 30);
      renderSalesTrend(trend?.data || trend || []);
    } catch {}
    try {
      const rep = await SalesAPI.getReport();
      renderPaymentMethods(
        rep?.data?.byPaymentMethod || rep?.byPaymentMethod || []
      );
    } catch {}
  }

  // ------------------------------------------------------------------
  // Renderers
  // ------------------------------------------------------------------

  function renderList(container, list, mapper, limit = 8) {
    if (!container) return;
    if (!list?.length) {
      container.innerHTML = `<div class="empty"><div class="title">موردی نیست</div></div>`;
      return;
    }
    container.innerHTML = list
      .slice(0, limit)
      .map((x) => {
        const { left, right } = mapper(x);
        return `<div class="list-item"><div>${left}</div><div class="badge">${right}</div></div>`;
      })
      .join("");
  }

  function renderRecentSalesTable(tbody, list) {
    if (!tbody) return;
    if (!list?.length) {
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty"><div class="title">فروشی نیست</div></div></td></tr>`;
      return;
    }
    tbody.innerHTML = list
      .map((s) => {
        const badge = statusBadge(s.status);
        return `
        <tr>
          <td>${formatDateTimeFa(s.sale_date)}</td>
          <td>${s.sale_number}</td>
          <td>${s.customer_name || "—"}</td>
          <td class="num">${formatCurrency(s.final_amount)}</td>
          <td><span class="${badge.className}">${badge.text}</span></td>
        </tr>
      `;
      })
      .join("");
  }

  // ... (renderSalesTrend, renderPaymentMethods from dashboard.js)

  function renderSalesTrend(rows = []) {
    if (!el.chartSalesTrendWrap) return;
    const labels = [];
    const values = [];
    rows.forEach((r) => {
      labels.push(toPersianDigits(String(r.period || r.date || "")));
      values.push(Number(r.amount || 0));
    });

    try {
      charts.salesTrend && charts.salesTrend.destroy();
    } catch {}
    charts.salesTrend = lineChart(el.chartSalesTrendWrap, {
      labels,
      series: [
        {
          label: "درآمد",
          data: values,
          color: "#22c55e",
          opts: { fill: true },
        },
      ],
      options: {
        plugins: { tooltip: { format: "money" } },
        scales: {
          y: {
            ticks: { callback: (v) => formatCurrency(v, { suffix: false }) },
          },
        },
      },
    });
    if (el.chartSalesPeriod)
      el.chartSalesPeriod.textContent = toPersianDigits(`۳۰ روز اخیر`);
  }

  function renderPaymentMethods(byPayment = []) {
    if (!el.chartPaymentMethodsWrap) return;
    const labels = [];
    const data = [];
    byPayment.forEach((pm) => {
      labels.push(labelPaymentFa(pm.method || pm.payment_method));
      data.push(Number(pm.amount || 0));
    });

    try {
      charts.paymentMethods && charts.paymentMethods.destroy();
    } catch {}
    charts.paymentMethods = doughnutChart(el.chartPaymentMethodsWrap, {
      labels,
      data,
      options: { plugins: { tooltip: { format: "money" } } },
    });
  }

  // ------------------------------------------------------------------
  // Filters
  // ------------------------------------------------------------------

  function applyFilters() {
    filters = {
      search: (el.fSearch?.value || "").trim(),
      customer_id: (el.fCustomer?.value || "").trim(),
      startDate: el.fStart?.value || "",
      endDate: el.fEnd?.value || "",
      status: el.fStatus?.value || "",
      sale_type: el.fSaleType?.value || "",
      payment_method: el.fPayment?.value || "",
    };
    table && table.setFilters(normalizeFilters(filters));
  }

  function resetFilters() {
    [
      el.fSearch,
      el.fCustomer,
      el.fStart,
      el.fEnd,
      el.fStatus,
      el.fSaleType,
      el.fPayment,
    ].forEach((f) => f && (f.value = ""));
    filters = {};
    table && table.setFilters({});
  }

  function normalizeFilters(f) {
    const out = {};
    if (f.search) out.search = f.search;
    if (f.customer_id) out.customer_id = f.customer_id;
    if (f.startDate) out.startDate = f.startDate;
    if (f.endDate) out.endDate = f.endDate;
    if (f.status) out.status = f.status;
    if (f.sale_type) out.sale_type = f.sale_type;
    if (f.payment_method) out.payment_method = f.payment_method;
    return out;
  }

  // ------------------------------------------------------------------
  // Table
  // ------------------------------------------------------------------

  function mountTableComponent() {
    const columns = [
      {
        key: "sale_date",
        header: "تاریخ",
        sortable: true,
        format: (v) => formatDateTimeFa(v),
      },
      { key: "sale_number", header: "شماره", sortable: true },
      { key: "customer_name", header: "مشتری", sortable: true },
      {
        key: "items_count",
        header: "آیتم",
        sortable: false,
        align: "center",
        format: (v) => toPersianDigits(String(v || "۰")),
      },
      currencyColumn("final_amount", "مبلغ نهایی"),
      currencyColumn("paid_amount", "پرداخت‌شده"),
      currencyColumn("remaining_amount", "مانده"),
      {
        key: "payment_method",
        header: "روش پرداخت",
        sortable: true,
        format: (v) => labelPaymentFa(v),
      },
      {
        key: "status",
        header: "وضعیت",
        sortable: true,
        render: (row) => {
          const b = statusBadge(row.status);
          return `<span class="${b.className}">${b.text}</span>`;
        },
      },
    ];

    const actions = [
      {
        label: "پرداخت",
        className: "sm",
        showIf: (row) => row.remaining_amount > 0 && row.status !== "cancelled",
        onClick: async (row) => {
          const val = await Modal.prompt(
            `مبلغ پرداخت (مانده: ${formatCurrency(row.remaining_amount)}):`,
            { title: "افزودن پرداخت", inputType: "number", okText: "ثبت" }
          );
          if (val === null) return;
          const amt = parseNumber(val);
          if (!isFinite(amt) || amt <= 0 || amt > row.remaining_amount)
            return toast("مبلغ نامعتبر است", { type: "warn" });
          try {
            await SalesAPI.addPayment(row.id, {
              amount: amt,
              payment_method: "cash",
            });
            toast("پرداخت ثبت شد", { type: "success" });
            table.reload();
          } catch (err) {
            toast(formatError(err), { type: "error" });
          }
        },
      },
      {
        label: "لغو",
        className: "sm danger ghost",
        showIf: (row) => row.status !== "cancelled",
        onClick: async (row) => {
          const ok = await Modal.confirm(
            `فروش "${row.sale_number}" لغو شود؟ موجودی به انبار باز می‌گردد.`,
            { title: "لغو فروش" }
          );
          if (!ok) return;
          try {
            await SalesAPI.cancelSale(row.id);
            toast("فروش لغو شد", { type: "success" });
            table.reload();
          } catch (err) {
            toast(formatError(err), { type: "error" });
          }
        },
      },
      {
        label: "حذف",
        className: "sm danger ghost",
        showIf: (row) => row.status === "draft",
        onClick: async (row) => {
          const ok = await Modal.confirm(
            `پیش‌فاکتور "${row.sale_number}" حذف شود؟ این عمل غیرقابل بازگشت است.`,
            { title: "حذف" }
          );
          if (!ok) return;
          try {
            await SalesAPI.deleteSale(row.id);
            toast("حذف شد", { type: "success" });
            table.reload();
          } catch (err) {
            toast(formatError(err), { type: "error" });
          }
        },
      },
      {
        label: "جزئیات",
        className: "sm",
        onClick: async (row) => {
          try {
            const res = await SalesAPI.getSale(row.id);
            const sale = res?.data || res || {};
            const content = createEl("div", {
              html: `
                <div class="grid" style="gap:8px;">
                  <div>شماره: <strong>${sale.sale_number || "—"}</strong></div>
                  <div>مشتری: <strong>${sale.customer_name || "—"}</strong></div>
                  <div>مبلغ کل: <strong>${formatCurrency(sale.total_amount)}</strong></div>
                  <div>تخفیف: <strong>${formatCurrency(sale.discount)}</strong></div>
                  <div>مالیات: <strong>${formatCurrency(sale.tax)}</strong></div>
                  <div>نهایی: <strong>${formatCurrency(sale.final_amount)}</strong></div>
                  <div>پرداختی: <strong>${formatCurrency(sale.paid_amount)}</strong></div>
                  <div>مانده: <strong>${formatCurrency(sale.remaining_amount)}</strong></div>
                </div>
              `,
            });
            Modal.open({ title: "جزئیات فروش", content, size: "md" });
          } catch (err) {
            toast(formatError(err, "خطا در دریافت جزئیات"), { type: "error" });
          }
        },
      },
    ];

    table = createTable(el.tableRoot, {
      idField: "id",
      columns,
      actions,
      selectable: true,
      data: async ({
        page,
        limit,
        sortBy,
        sortDir,
        search,
        filters: tblFilters,
      }) => {
        const f = {
          ...(tblFilters || {}),
          ...(normalizeFilters(filters) || {}),
        };
        if (el.tableSearch?.value)
          f.search = (el.tableSearch.value || "").trim();
        const resp = await SalesAPI.listSales({ page, limit, filters: f });
        const data = resp?.data || resp || {};
        const rows = Array.isArray(data)
          ? data
          : data.sales || data.items || [];
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

// Debounce helper
function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
