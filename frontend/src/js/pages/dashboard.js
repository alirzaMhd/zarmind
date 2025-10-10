// ======================================================================
// Zarmind - Dashboard Page
// - Loads dashboard view and populates stats, charts, and lists
// - Uses Report/Sales/Inventory endpoints
// - Renders Chart.js charts via components/chart.js
// ======================================================================

import { API, ROUTES } from "../utils/constants.js";
import {
  qs,
  qsa,
  on,
  toast,
  formatError,
  toPersianDigits,
} from "../utils/helpers.js";

import {
  formatCurrency,
  formatDateTimeFa,
  timeAgoFa,
  labelPaymentFa,
  statusBadge,
} from "../utils/formatters.js";

import { lineChart, doughnutChart } from "../components/chart.js";

// ----------------------------------------------------------------------
// Template loader (tries multiple paths, falls back to inline)
// ----------------------------------------------------------------------

async function loadTemplate() {
  const candidates = [
    "/views/dashboard.html",
    "./views/dashboard.html",
    "../views/dashboard.html",
    "../../src/views/dashboard.html",
  ];
  for (const href of candidates) {
    try {
      const res = await fetch(href, { cache: "no-cache" });
      if (res.ok) return await res.text();
    } catch {
      // ignore
    }
  }
  // Minimal fallback
  return `
    <div class="container p-6">
      <div class="page-header">
        <div class="page-title">داشبورد</div>
        <div class="page-actions"><button class="btn ghost" id="dash-refresh">↻ به‌روزرسانی</button></div>
      </div>
      <div class="card card-body">در حال توسعه داشبورد…</div>
    </div>
  `;
}

// ----------------------------------------------------------------------
// Page mount
// ----------------------------------------------------------------------

export default async function mountDashboard(root, ctx = {}) {
  const html = await loadTemplate();
  root.innerHTML = html;

  // Elements
  const el = {
    refresh: qs("#dash-refresh", root),

    // Stat cards
    statTodayRevenue: qs("#stat-today-revenue", root),
    statTodaySales: qs("#stat-today-sales", root),
    statPendingAmount: qs("#stat-pending-amount", root),
    statLowStock: qs("#stat-low-stock", root),

    // Charts
    chartSalesTrendWrap: qs("#chart-sales-trend", root),
    chartSalesPeriod: qs("#chart-sales-period", root),
    chartPaymentMethodsWrap: qs("#chart-payment-methods", root),

    // Lists
    tblRecentSales: qs("#table-recent-sales", root),
    listLowStock: qs("#list-low-stock", root),
    listPendingPayments: qs("#list-pending-payments", root),

    // Quick info
    badgeGoldPrice: qs("#gold-price-today", root),
    badgeActiveProducts: qs("#active-products-count", root),
  };

  let offs = [];
  let charts = {
    salesTrend: null,
    paymentMethods: null,
  };

  // Wire refresh
  if (el.refresh) {
    offs.push(
      on(el.refresh, "click", async () => {
        try {
          el.refresh.disabled = true;
          await loadAll();
          toast("داشبورد به‌روزرسانی شد", { type: "success" });
        } catch (err) {
          toast(formatError(err, "خطا در به‌روزرسانی"), { type: "error" });
        } finally {
          el.refresh.disabled = false;
        }
      })
    );
  }

  // Initial load
  await loadAll().catch((err) => {
    console.error("[Dashboard] init error:", err);
    toast(formatError(err, "خطا در دریافت اطلاعات داشبورد"), { type: "error" });
  });

  // Return unmount
  return function unmount() {
    try {
      offs.forEach((off) => off && off());
    } catch {}
    try {
      charts.salesTrend && charts.salesTrend.destroy();
    } catch {}
    try {
      charts.paymentMethods && charts.paymentMethods.destroy();
    } catch {}
  };

  // ------------------------------------------------------------------
  // Loaders
  // ------------------------------------------------------------------

  async function loadAll() {
    // dashboard stats (recent, alerts, pending)
    const dashP = ctx.api.get(API.REPORTS.DASHBOARD);
    // charts data
    const trendP = ctx.api.get(`${API.SALES.TREND}?period=daily&days=30`);
    const salesReportP = ctx.api.get(API.REPORTS.SALES); // for payment methods breakdown (recent period)
    // quick stats
    const goldPriceP = ctx.api.get(
      `${API.INVENTORY.GOLD_PRICE_CURRENT}?carat=18`
    );

    const [dashRes, trendRes, salesReportRes, goldRes] =
      await Promise.allSettled([dashP, trendP, salesReportP, goldPriceP]);

    // Dashboard data
    if (dashRes.status === "fulfilled") {
      const d = dashRes.value?.data || dashRes.value || {};
      renderStats(d);
      renderRecentSales(d.recentSales || []);
      renderLowStock(d.stockAlerts || []);
      renderPendingPayments(d.pendingPayments || []);
      // Quick badges
      setText(
        el.badgeActiveProducts,
        toPersianDigits(String(d?.inventory?.active ?? "0"))
      );
    } else {
      // keep skeletons
    }

    // Gold price (18k)
    if (goldRes.status === "fulfilled") {
      const gp = goldRes.value?.data || goldRes.value || {};
      const price = gp?.price || 0;
      setText(el.badgeGoldPrice, formatCurrency(price));
    }

    // Charts
    if (trendRes.status === "fulfilled") {
      const rows = trendRes.value?.data || trendRes.value || [];
      renderSalesTrend(rows);
    }
    if (salesReportRes.status === "fulfilled") {
      const rep = salesReportRes.value?.data || salesReportRes.value || {};
      renderPaymentMethods(rep?.byPaymentMethod || []);
    }
  }

  // ------------------------------------------------------------------
  // Renderers: Stats / Lists
  // ------------------------------------------------------------------

  function renderStats(d) {
    // Sales
    const sales = d.sales || {};
    setText(el.statTodayRevenue, formatCurrency(sales.todayRevenue || 0));
    setText(el.statTodaySales, toPersianDigits(String(sales.today || 0)));

    // Pending = sum of remaining_amount across open invoices (dashboard transactions.pendingAmount)
    const tx = d.transactions || {};
    setText(el.statPendingAmount, formatCurrency(tx.pendingAmount || 0));

    // Low stock count
    const inv = d.inventory || {};
    const lowCount = Number(inv.lowStock || 0) + Number(inv.outOfStock || 0);
    setText(el.statLowStock, toPersianDigits(String(lowCount)));
  }

  function renderRecentSales(list) {
    if (!el.tblRecentSales) return;
    if (!Array.isArray(list) || list.length === 0) {
      el.tblRecentSales.innerHTML = `<tr><td colspan="5"><div class="empty"><div class="title">فروشی ثبت نشده است</div></div></td></tr>`;
      return;
    }

    const rows = list
      .slice(0, 8)
      .map((s) => {
        const badge = statusBadge(s.status || "draft");
        return `
        <tr>
          <td>${formatDateTimeFa(s.sale_date)}</td>
          <td><a class="link" href="${ROUTES.SALES}?q=${encodeURIComponent(s.sale_number || "")}">${s.sale_number || "—"}</a></td>
          <td>${s.customer_name || "—"}</td>
          <td class="num">${formatCurrency(s.final_amount || 0)}</td>
          <td><span class="${badge.className}">${badge.text}</span></td>
        </tr>
      `;
      })
      .join("");

    el.tblRecentSales.innerHTML = rows;
  }

  function renderLowStock(items) {
    if (!el.listLowStock) return;
    if (!Array.isArray(items) || items.length === 0) {
      el.listLowStock.innerHTML = `<div class="empty"><div class="title">هشداری وجود ندارد</div></div>`;
      return;
    }
    el.listLowStock.innerHTML = items
      .slice(0, 6)
      .map((p) => {
        const name = p.name || "محصول";
        const stock =
          typeof p.stock_quantity === "number"
            ? toPersianDigits(String(p.stock_quantity))
            : "—";
        const min =
          typeof p.min_stock_level === "number"
            ? toPersianDigits(String(p.min_stock_level))
            : "—";
        return `
        <div class="list-item">
          <div>${name}</div>
          <div class="badge warning">موجودی: ${stock} / حداقل: ${min}</div>
        </div>
      `;
      })
      .join("");
  }

  function renderPendingPayments(items) {
    if (!el.listPendingPayments) return;
    if (!Array.isArray(items) || items.length === 0) {
      el.listPendingPayments.innerHTML = `<div class="empty"><div class="title">پرداخت معوقی وجود ندارد</div></div>`;
      return;
    }
    el.listPendingPayments.innerHTML = items
      .slice(0, 6)
      .map((p) => {
        const num = p.sale_number || "—";
        const remain = p.remaining_amount || p.remaining || 0;
        const days =
          typeof p.days_overdue === "number"
            ? toPersianDigits(String(p.days_overdue))
            : "";
        return `
        <div class="list-item">
          <div>فاکتور ${num}</div>
          <div class="badge danger">${formatCurrency(remain)} ${days ? `· ${days} روز گذشته` : ""}</div>
        </div>
      `;
      })
      .join("");
  }

  // ------------------------------------------------------------------
  // Renderers: Charts
  // ------------------------------------------------------------------

  function renderSalesTrend(rows = []) {
    if (!el.chartSalesTrendWrap) return;

    const labels = [];
    const values = [];
    rows.forEach((r) => {
      // API /sales/trend returns: { period, count, amount }
      labels.push(toPersianDigits(String(r.period || r.date || "")));
      values.push(Number(r.amount || 0));
    });

    // Destroy previous
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
        plugins: {
          tooltip: { mode: "index", intersect: false, format: "money" },
        },
        scales: {
          y: {
            ticks: { callback: (v) => formatCurrency(v, { suffix: false }) },
          },
        },
      },
    });

    // Period label (approx.)
    if (el.chartSalesPeriod) {
      el.chartSalesPeriod.textContent = toPersianDigits(`۳۰ روز اخیر`);
    }
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
      options: {
        plugins: {
          tooltip: { format: "money" },
        },
      },
    });
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  function setText(node, text) {
    if (!node) return;
    node.textContent = text || "";
  }
}
