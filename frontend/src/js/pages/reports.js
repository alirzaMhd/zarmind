// ======================================================================
// Zarmind - Reports Page
// - Loads reports view and populates data for sales, inventory, customers
// - Uses Report API endpoints
// - Renders Chart.js charts via components/chart.js
// ======================================================================

import {
  qs,
  qsa,
  on,
  toast,
  formatError,
  toPersianDigits,
  downloadBlob,
} from "../utils/helpers.js";

import {
  formatCurrency,
  formatNumberFa,
  formatPercent,
  timeAgoFa,
} from "../utils/formatters.js";

import ReportsAPI from "../api/reports.js";
import { lineChart, doughnutChart, barChart } from "../components/chart.js";

// ----------------------------------------------------------------------
// Template loader
// ----------------------------------------------------------------------

async function loadTemplate() {
  const candidates = [
    "/views/reports.html",
    "./views/reports.html",
    "../views/reports.html",
    "../../src/views/reports.html",
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
        <div class="page-title">گزارش‌ها</div>
        <div class="page-actions"><button class="btn ghost" id="reports-refresh">↻ به‌روزرسانی</button></div>
      </div>
      <div class="card card-body">در حال توسعه صفحه گزارش‌ها…</div>
    </div>
  `;
}

// ----------------------------------------------------------------------
// Page mount
// ----------------------------------------------------------------------

export default async function mountReports(root, ctx = {}) {
  const html = await loadTemplate();
  root.innerHTML = html;

  // Elements
  const el = {
    refresh: qs("#reports-refresh", root),
    btnExport: qs("#btn-export-all", root),
    reportType: qs("#report-type", root),
    filterStart: qs("#filter-start", root),
    filterEnd: qs("#filter-end", root),
    btnApply: qs("#btn-apply-filters", root),
    btnReset: qs("#btn-reset-filters", root),
    content: qs("#report-content", root),
  };

  // State
  let offs = [];
  let currentReportType = "sales";
  let currentReportData = null;
  let charts = {};

  // Wire events
  wireEvents();

  // Initial load (default to sales)
  await loadReport();

  // Return unmount
  return function unmount() {
    try {
      offs.forEach((off) => off && off());
    } catch {}
    destroyCharts();
  };

  // ------------------------------------------------------------------
  // Events
  // ------------------------------------------------------------------

  function wireEvents() {
    if (el.refresh)
      offs.push(
        on(el.refresh, "click", async () => {
          await loadReport();
          toast("گزارش به‌روزرسانی شد", { type: "success" });
        })
      );

    if (el.btnExport)
      offs.push(
        on(el.btnExport, "click", () => {
          if (!currentReportData)
            return toast("گزارشی برای خروجی گرفتن وجود ندارد", {
              type: "warn",
            });
          const blob = new Blob([JSON.stringify(currentReportData, null, 2)], {
            type: "application/json;charset=utf-8",
          });
          downloadBlob(blob, `${currentReportType}-report-${Date.now()}.json`);
        })
      );

    if (el.btnApply)
      offs.push(
        on(el.btnApply, "click", async () => {
          currentReportType = el.reportType?.value || "sales";
          await loadReport();
        })
      );

    if (el.btnReset)
      offs.push(
        on(el.btnReset, "click", () => {
          el.filterStart.value = "";
          el.filterEnd.value = "";
          el.reportType.value = "sales";
          currentReportType = "sales";
          el.content.innerHTML = `<div class="empty"><div class="title">گزارش خود را انتخاب کنید</div></div>`;
        })
      );
  }

  // ------------------------------------------------------------------
  // Main loader
  // ------------------------------------------------------------------

  async function loadReport() {
    el.content.innerHTML = `<div class="skeleton" style="height:320px;border-radius:8px;"></div>`;
    destroyCharts();

    try {
      const type = el.reportType?.value || "sales";
      const startDate = el.filterStart?.value || undefined;
      const endDate = el.filterEnd?.value || undefined;

      let report;
      switch (type) {
        case "sales":
          report = await ReportsAPI.getSalesReport({ startDate, endDate });
          renderSalesReport(report?.data || report);
          break;
        case "inventory":
          report = await ReportsAPI.getInventoryReport();
          renderInventoryReport(report?.data || report);
          break;
        case "customers":
          report = await ReportsAPI.getCustomerReport();
          renderCustomerReport(report?.data || report);
          break;
        case "financial":
          report = await ReportsAPI.getFinancialReport({ startDate, endDate });
          // Implement render function
          renderPlaceholder(type, report?.data || report);
          break;
        case "profit-loss":
          report = await ReportsAPI.getProfitLossReport({ startDate, endDate });
          // Implement render function
          renderPlaceholder(type, report?.data || report);
          break;
        default:
          throw new Error("نوع گزارش نامعتبر است");
      }

      currentReportData = report?.data || report;
    } catch (err) {
      toast(formatError(err, "خطا در تولید گزارش"), { type: "error" });
      el.content.innerHTML = `<div class="empty"><div class="title">خطا در تولید گزارش</div><div class="subtitle">${formatError(err)}</div></div>`;
    }
  }

  function destroyCharts() {
    Object.values(charts).forEach((ch) => ch && ch.destroy && ch.destroy());
    charts = {};
  }

  // ------------------------------------------------------------------
  // Renderers
  // ------------------------------------------------------------------

  function renderSalesReport(data) {
    if (!data) return renderPlaceholder("sales");
    const tpl = qs("#template-sales-report");
    if (!tpl) return;
    el.content.innerHTML = tpl.innerHTML;

    // Stats
    setStat("salesCount", toPersianDigits(String(data.salesCount || 0)));
    setStat("totalRevenue", formatCurrency(data.totalRevenue || 0));
    setStat("averageSaleValue", formatCurrency(data.averageSaleValue || 0));
    setStat("grossProfit", formatCurrency(data.grossProfit || 0)); // often 0 if cost not calculated

    // Charts
    charts.dailySales = lineChart(qs("#chart-daily-sales", el.content), {
      labels: data.dailyBreakdown?.map((d) => d.date) || [],
      series: [
        {
          label: "درآمد",
          data: data.dailyBreakdown?.map((d) => d.revenue) || [],
          color: "#22c55e",
          opts: { fill: true },
        },
      ],
      yFormat: "money",
    });

    charts.paymentMethods = doughnutChart(
      qs("#chart-payment-methods", el.content),
      {
        labels:
          data.byPaymentMethod?.map(
            (p) => LABELS_FA.PAYMENT[p.method] || p.method
          ) || [],
        data: data.byPaymentMethod?.map((p) => p.amount) || [],
        yFormat: "money",
      }
    );

    // Tables
    renderTable("top-products", data.topProducts, [
      (row) => row.product_name,
      (row) => toPersianDigits(String(row.quantity_sold)),
      (row) => formatCurrency(row.revenue),
    ]);

    renderTable("top-customers", data.topCustomers, [
      (row) => row.customer_name,
      (row) => toPersianDigits(String(row.sale_count)),
      (row) => formatCurrency(row.total_amount),
    ]);
  }

  function renderInventoryReport(data) {
    if (!data) return renderPlaceholder("inventory");
    const tpl = qs("#template-inventory-report");
    if (!tpl) return;
    el.content.innerHTML = tpl.innerHTML;

    // Stats
    setStat("totalProducts", toPersianDigits(String(data.totalProducts || 0)));
    setStat("totalValue", formatCurrency(data.totalValue || 0));
    setStat(
      "totalWeight",
      toPersianDigits(String(data.totalWeight?.toFixed(2) || 0))
    );
    setStat(
      "lowAndOut",
      toPersianDigits(
        String((data.lowStockItems || 0) + (data.outOfStockItems || 0))
      )
    );

    // Charts
    charts.invCategory = doughnutChart(qs("#chart-inv-category", el.content), {
      labels:
        data.byCategory?.map(
          (c) => LABELS_FA.CATEGORY[c.category] || c.category
        ) || [],
      data: data.byCategory?.map((c) => c.value) || [],
      yFormat: "money",
    });

    // Tables
    renderTable("by-carat", data.byCarat, [
      (row) => toPersianDigits(String(row.carat)),
      (row) => toPersianDigits(String(row.count)),
      (row) => toPersianDigits(String(row.weight?.toFixed(2) || 0)),
      (row) => formatCurrency(row.value),
    ]);
    renderTable("top-value-products", data.topValueProducts, [
      (row) => row.name,
      (row) => toPersianDigits(String(row.stock_quantity)),
      (row) => formatCurrency(row.total_value),
    ]);
    renderTable("low-stock", data.lowStockProducts, [
      (row) => row.name,
      (row) => toPersianDigits(String(row.stock_quantity)),
      (row) => toPersianDigits(String(row.min_stock_level)),
    ]);
  }

  function renderCustomerReport(data) {
    if (!data) return renderPlaceholder("customers");
    const tpl = qs("#template-customers-report");
    if (!tpl) return;
    el.content.innerHTML = tpl.innerHTML;

    // Stats
    setStat(
      "totalCustomers",
      toPersianDigits(String(data.totalCustomers || 0))
    );
    setStat("newCustomers", toPersianDigits(String(data.newCustomers || 0)));
    setStat("totalDebt", formatCurrency(data.totalDebt || 0));
    setStat(
      "retentionRate",
      formatPercent(data.retentionRate || 0, { fraction: false })
    );

    // Charts
    const seg = data.customerSegmentation || {};
    charts.custSegment = barChart(qs("#chart-cust-segment", el.content), {
      labels: ["VIP", "معمولی", "کم‌تکرار", "غیرفعال"],
      series: [
        {
          label: "تعداد مشتری",
          data: [seg.vip, seg.regular, seg.occasional, seg.inactive],
          color: "#0ea5e9",
        },
      ],
      yFormat: "number",
    });

    // Tables
    renderTable("by-city", data.customersByCity, [
      (row) => row.city,
      (row) => toPersianDigits(String(row.count)),
      (row) => formatPercent(row.percentage, { fraction: false }),
    ]);
    renderTable("top-customers", data.topCustomers, [
      (row) => row.full_name,
      (row) => formatCurrency(row.total_purchases),
      (row) => toPersianDigits(String(row.total_orders || 0)),
      (row) =>
        row.last_purchase_date ? timeAgoFa(row.last_purchase_date) : "—",
    ]);
  }

  function renderPlaceholder(type, data) {
    el.content.innerHTML = `
      <div class="card card-body">
        <h2 class="card-title">گزارش ${type}</h2>
        <p>نمایش این گزارش هنوز پیاده‌سازی نشده است. داده‌ها:</p>
        <pre class="code">${JSON.stringify(data, null, 2)}</pre>
      </div>
    `;
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  function setStat(key, value) {
    const node = qs(`[data-stat="${key}"]`, el.content);
    if (node) node.textContent = value;
  }

  function renderTable(key, data, renderers) {
    const tbody = qs(`[data-table="${key}"]`, el.content);
    if (!tbody) return;
    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${renderers.length}">داده‌ای نیست</td></tr>`;
      return;
    }
    tbody.innerHTML = data
      .map(
        (row) =>
          `<tr>${renderers.map((fn) => `<td>${fn(row)}</td>`).join("")}</tr>`
      )
      .join("");
  }
}
