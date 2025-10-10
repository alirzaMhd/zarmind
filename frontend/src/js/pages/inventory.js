// ======================================================================
// Zarmind - Inventory Page
// - Loads inventory view and manages: stats, filters, table, gold price,
//   AI scale helper, bulk actions, alerts lists
// ======================================================================

import {
  ROUTES,
  LABELS_FA,
  PRODUCT_CATEGORIES,
  PRODUCT_TYPES,
  CARAT_OPTIONS,
  WEIGHT_UNITS,
} from "../utils/constants.js";

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
  formatWeightFa,
  labelCategoryFa,
  labelTypeFa,
  statusBadge,
} from "../utils/formatters.js";

import InventoryAPI from "../api/inventory.js";
import createTable, {
  currencyColumn,
  numberColumn,
  weightColumn,
  dateColumn,
} from "../components/table.js";
import Camera from "../components/camera.js";
import Modal from "../components/modal.js";

// ----------------------------------------------------------------------
// Template loader
// ----------------------------------------------------------------------

async function loadTemplate() {
  const candidates = [
    "/views/inventory.html",
    "./views/inventory.html",
    "../views/inventory.html",
    "../../src/views/inventory.html",
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
        <div class="page-title">موجودی</div>
        <div class="page-actions">
          <button class="btn ghost" id="inv-refresh">↻ به‌روزرسانی</button>
        </div>
      </div>
      <div class="card card-body">در حال توسعه صفحه موجودی…</div>
    </div>
  `;
}

// ----------------------------------------------------------------------
// Page mount
// ----------------------------------------------------------------------

export default async function mountInventory(root, ctx = {}) {
  const html = await loadTemplate();
  root.innerHTML = html;

  // Elements
  const el = {
    refresh: qs("#inv-refresh", root),
    btnNew: qs("#btn-product-new", root),
    btnReport: qs("#btn-inventory-report", root),

    // Stats
    statTotal: qs("#stat-total-products", root),
    statValue: qs("#stat-total-value", root),
    statWeight: qs("#stat-total-weight", root),
    statLowOut: qs("#stat-low-out", root),

    // Filters toolbar
    fSearch: qs("#filter-search", root),
    fCategory: qs("#filter-category", root),
    fType: qs("#filter-type", root),
    fCarat: qs("#filter-carat", root),
    fActive: qs("#filter-active", root),
    fLow: qs("#filter-lowstock", root),
    btnApplyFilters: qs("#btn-apply-filters", root),
    btnResetFilters: qs("#btn-reset-filters", root),

    // Bulk / prices
    btnBulkPrice: qs("#btn-bulk-price", root),
    btnRecalc: qs("#btn-recalc-prices", root),
    btnExport: qs("#btn-export", root),

    // Gold panel
    goldLatest: qs("#gold-18-latest", root),
    goldCarat: qs("#gold-carat", root),
    goldPrice: qs("#gold-price", root),
    goldDate: qs("#gold-date", root),
    btnGoldSet: qs("#btn-gold-set", root),

    // AI scale helper
    cameraRoot: qs("#camera-root", root),
    btnCameraStart: qs("#btn-camera-start", root),
    weightOutput: qs("#weight-output", root),
    btnCopyWeight: qs("#btn-copy-weight", root),

    // Quick actions
    qaNewProduct: qs("#qa-new-product", root),
    qaLow: qs("#qa-low-stock", root),
    qaOut: qs("#qa-out-of-stock", root),
    qaRestoreAll: qs("#qa-restore-all", root),

    // Table search/page-size
    tableSearch: qs("#table-search", root),
    pageSize: qs("#page-size", root),

    // Alerts lists
    listLow: qs("#list-low-stock", root),
    listOut: qs("#list-out-of-stock", root),

    // Table container (we will mount component here)
    tableRoot: qs("#inventory-table", root),
  };

  // State
  let offs = [];
  let camera = null;
  let table = null;

  // Filters state (server-side)
  let filters = {
    search: "",
    category: "",
    type: "",
    carat: "",
    isActive: "",
    lowStock: "",
  };

  // Wire events
  wireEvents();

  // Initial loads
  await Promise.allSettled([loadStats(), loadGoldLatest(), loadAlertsLists()]);
  mountTableComponent();
  mountCameraComponent();

  // Return unmount
  return function unmount() {
    try {
      offs.forEach((off) => off && off());
    } catch {}
    try {
      table && table.destroy();
    } catch {}
    try {
      camera && camera.destroy();
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
              loadGoldLatest(),
              loadAlertsLists(),
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
            "ثبت محصول جدید به‌زودی در این نسخه اضافه می‌شود.\nاز API یا بخش تنظیمات استفاده کنید.",
            { title: "افزودن محصول" }
          );
        })
      );

    if (el.btnReport)
      offs.push(
        on(el.btnReport, "click", async () => {
          try {
            const rep = await InventoryAPI.getReport();
            const data = rep?.data || rep || {};
            const content = createEl("div", {
              html: `
            <div class="grid" style="gap:8px">
              <div>تعداد محصولات فعال: <strong>${toPersianDigits(String(data?.activeProducts ?? data?.active ?? "0"))}</strong></div>
              <div>ارزش موجودی: <strong>${formatCurrency(data?.totalValue ?? 0)}</strong></div>
              <div>وزن کل: <strong>${toPersianDigits(String(data?.totalWeight ?? 0))}</strong> گرم</div>
            </div>
          `,
            });
            Modal.open({ title: "گزارش موجودی", content, size: "md" });
          } catch (err) {
            toast(formatError(err, "خطا در دریافت گزارش موجودی"), {
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

    // Bulk
    if (el.btnRecalc)
      offs.push(
        on(el.btnRecalc, "click", async () => {
          try {
            el.btnRecalc.disabled = true;
            const updated = await InventoryAPI.recalculatePrices(
              filters?.category || undefined
            );
            toast(
              `قیمت ${toPersianDigits(String(updated || 0))} محصول بروزرسانی شد`,
              { type: "success" }
            );
            table && table.reload();
          } catch (err) {
            toast(formatError(err, "خطا در بروزرسانی قیمت‌ها"), {
              type: "error",
            });
          } finally {
            el.btnRecalc.disabled = false;
          }
        })
      );

    if (el.btnBulkPrice)
      offs.push(
        on(el.btnBulkPrice, "click", async () => {
          const value = await Modal.prompt("درصد تغییر قیمت (مثبت/منفی):", {
            title: "تغییر گروهی قیمت",
            size: "sm",
            inputType: "number",
            okText: "اعمال",
          });
          if (value === null || value === undefined || value === "") return;
          const percentage = parseNumber(value);
          if (!isFinite(percentage))
            return toast("درصد نامعتبر است", { type: "warn" });
          try {
            el.btnBulkPrice.disabled = true;
            const updated = await InventoryAPI.bulkUpdatePrices({
              percentage,
              category: filters.category || undefined,
              type: filters.type || undefined,
            });
            toast(
              `قیمت ${toPersianDigits(String(updated || 0))} محصول تغییر کرد`,
              { type: "success" }
            );
            table && table.reload();
          } catch (err) {
            toast(formatError(err, "خطا در تغییر گروهی قیمت"), {
              type: "error",
            });
          } finally {
            el.btnBulkPrice.disabled = false;
          }
        })
      );

    if (el.btnExport)
      offs.push(
        on(el.btnExport, "click", async () => {
          try {
            const rep = await InventoryAPI.getReport();
            const blob = new Blob(
              [JSON.stringify(rep?.data || rep || {}, null, 2)],
              { type: "application/json;charset=utf-8" }
            );
            downloadBlob(blob, `inventory-report-${Date.now()}.json`);
            toast("خروجی JSON دانلود شد", { type: "success" });
          } catch (err) {
            toast(formatError(err, "خطا در خروجی گرفتن"), { type: "error" });
          }
        })
      );

    // Gold price
    if (el.btnGoldSet) offs.push(on(el.btnGoldSet, "click", setGoldPrice));

    // AI helper
    if (el.btnCameraStart)
      offs.push(
        on(el.btnCameraStart, "click", () => {
          try {
            camera && camera.start && camera.start();
          } catch {}
        })
      );
    if (el.btnCopyWeight)
      offs.push(
        on(el.btnCopyWeight, "click", async () => {
          const v = (el.weightOutput?.value || "").trim();
          if (!v) return;
          try {
            await navigator.clipboard.writeText(v);
            toast("کپی شد", { type: "success" });
          } catch {}
        })
      );

    // Quick actions
    if (el.qaNewProduct)
      offs.push(
        on(el.qaNewProduct, "click", () => {
          Modal.alert("ثبت سریع محصول در این نسخه فراهم نیست.", {
            title: "اقدام سریع",
          });
        })
      );
    if (el.qaLow)
      offs.push(
        on(el.qaLow, "click", () => {
          el.fLow && (el.fLow.value = "true");
          applyFilters();
          scrollInto(el.tableRoot);
        })
      );
    if (el.qaOut)
      offs.push(
        on(el.qaOut, "click", async () => {
          try {
            const list = await InventoryAPI.getOutOfStock();
            if (table) {
              table.setData(Array.isArray(list) ? list : list?.data || []);
              toast("نمایش آیتم‌های ناموجود (حالت محلی)", { type: "info" });
            }
          } catch (err) {
            toast(formatError(err), { type: "error" });
          }
          scrollInto(el.tableRoot);
        })
      );
    if (el.qaRestoreAll)
      offs.push(
        on(el.qaRestoreAll, "click", async () => {
          if (!table) return;
          const { ids } = table.getSelected();
          if (!ids.length)
            return toast("هیچ ردیفی انتخاب نشده است", { type: "warn" });
          const ok = await Modal.confirm(
            `فعال‌سازی ${toPersianDigits(ids.length)} مورد؟`,
            { title: "فعال‌سازی گروهی" }
          );
          if (!ok) return;
          try {
            await InventoryAPI.bulkSetActive({
              product_ids: ids,
              is_active: true,
            });
            toast("به‌روزرسانی انجام شد", { type: "success" });
            table.reload();
          } catch (err) {
            toast(formatError(err), { type: "error" });
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
      const res = await InventoryAPI.getStatistics();
      const stats = res?.data || res || {};
      setText(el.statTotal, toPersianDigits(String(stats.total || 0)));
      setText(el.statValue, formatCurrency(stats.totalValue || 0));
      setText(el.statWeight, toPersianDigits(String(stats.totalWeight || 0)));
      const low = Number(stats.lowStock || 0) + Number(stats.outOfStock || 0);
      setText(el.statLowOut, toPersianDigits(String(low || 0)));
    } catch (err) {
      // keep skeletons
    }
  }

  // ------------------------------------------------------------------
  // Gold price
  // ------------------------------------------------------------------

  async function loadGoldLatest() {
    try {
      const res = await InventoryAPI.getCurrentGoldPrice(18);
      const data = res?.data || res || {};
      setText(
        el.goldLatest,
        formatCurrency(data?.price || data?.price_per_gram || 0)
      );
    } catch {}
  }

  async function setGoldPrice() {
    const carat = parseInt(el.goldCarat?.value || "18", 10);
    const price_per_gram = parseNumber(el.goldPrice?.value);
    const date = el.goldDate?.value ? new Date(el.goldDate.value) : null;
    if (!isFinite(price_per_gram) || price_per_gram <= 0) {
      return toast("قیمت هر گرم نامعتبر است", { type: "warn" });
    }
    try {
      el.btnGoldSet.disabled = true;
      await InventoryAPI.setGoldPrice({ carat, price_per_gram, date });
      toast("قیمت ثبت شد", { type: "success" });
      await loadGoldLatest();
    } catch (err) {
      toast(formatError(err, "خطا در ثبت قیمت"), { type: "error" });
    } finally {
      el.btnGoldSet.disabled = false;
    }
  }

  // ------------------------------------------------------------------
  // Alerts lists
  // ------------------------------------------------------------------

  async function loadAlertsLists() {
    // Low stock
    try {
      const low = await InventoryAPI.getLowStock();
      renderLowList(el.listLow, low?.data || low || []);
    } catch {
      renderLowList(el.listLow, []);
    }
    // Out of stock
    try {
      const out = await InventoryAPI.getOutOfStock();
      renderOutList(el.listOut, out?.data || out || []);
    } catch {
      renderOutList(el.listOut, []);
    }
  }

  function renderLowList(container, list) {
    if (!container) return;
    if (!Array.isArray(list) || list.length === 0) {
      container.innerHTML = `<div class="empty"><div class="title">موردی نیست</div></div>`;
      return;
    }
    container.innerHTML = list
      .slice(0, 8)
      .map(
        (p) => `
      <div class="list-item">
        <div>${p.name || "—"}</div>
        <div class="badge warning">موجودی: ${toPersianDigits(String(p.stock_quantity || 0))}</div>
      </div>
    `
      )
      .join("");
  }

  function renderOutList(container, list) {
    if (!container) return;
    if (!Array.isArray(list) || list.length === 0) {
      container.innerHTML = `<div class="empty"><div class="title">موردی نیست</div></div>`;
      return;
    }
    container.innerHTML = list
      .slice(0, 8)
      .map(
        (p) => `
      <div class="list-item">
        <div>${p.name || "—"}</div>
        <div class="badge danger">موجودی: 0</div>
      </div>
    `
      )
      .join("");
  }

  // ------------------------------------------------------------------
  // Filters
  // ------------------------------------------------------------------

  function applyFilters() {
    filters = {
      search: (el.fSearch?.value || "").trim(),
      category: el.fCategory?.value || "",
      type: el.fType?.value || "",
      carat: el.fCarat?.value || "",
      isActive: el.fActive?.value || "",
      lowStock: el.fLow?.value || "",
    };
    table && table.setFilters(normalizeFilters(filters));
  }

  function resetFilters() {
    [
      el.fSearch,
      el.fCategory,
      el.fType,
      el.fCarat,
      el.fActive,
      el.fLow,
    ].forEach((f) => f && (f.value = ""));
    filters = {
      search: "",
      category: "",
      type: "",
      carat: "",
      isActive: "",
      lowStock: "",
    };
    table && table.setFilters(normalizeFilters(filters));
  }

  function normalizeFilters(f) {
    const out = {};
    if (f.search) out.search = f.search;
    if (f.category) out.category = f.category;
    if (f.type) out.type = f.type;
    if (f.carat) out.carat = parseInt(f.carat, 10);
    if (f.isActive) out.isActive = f.isActive === "true";
    if (f.lowStock) out.lowStock = f.lowStock === "true";
    return out;
  }

  // ------------------------------------------------------------------
  // Table
  // ------------------------------------------------------------------

  function mountTableComponent() {
    const columns = [
      { key: "code", header: "کد", sortable: true },
      { key: "name", header: "نام", sortable: true },
      {
        key: "category",
        header: "دسته",
        sortable: true,
        format: (v) => labelCategoryFa(v),
      },
      {
        key: "type",
        header: "نوع",
        sortable: true,
        format: (v) => labelTypeFa(v),
      },
      numberColumn("carat", "عیار"),
      {
        key: "weight",
        header: "وزن (گرم)",
        sortable: true,
        align: "end",
        format: (v) => formatWeightFa(v, WEIGHT_UNITS.GRAM),
      },
      {
        key: "selling_price",
        header: "قیمت (تومان)",
        sortable: true,
        align: "end",
        format: (v) => formatCurrency(v),
      },
      numberColumn("stock_quantity", "موجودی"),
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
          const ok = await Modal.confirm(`محصول "${row.name}" غیرفعال شود؟`, {
            title: "غیرفعال کردن",
          });
          if (!ok) return;
          try {
            await InventoryAPI.deleteProduct(row.id);
            table.reload();
            toast("محصول غیرفعال شد", { type: "success" });
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
            await InventoryAPI.restoreProduct(row.id);
            table.reload();
            toast("محصول فعال شد", { type: "success" });
          } catch (err) {
            toast(formatError(err), { type: "error" });
          }
        },
      },
      {
        label: "تصویر",
        className: "sm",
        onClick: async (row) => {
          // Quick file input
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              await InventoryAPI.updateImage(row.id, { file });
              toast("تصویر بروزرسانی شد", { type: "success" });
              table.reload();
            } catch (err) {
              toast(formatError(err), { type: "error" });
            }
          };
          input.click();
        },
      },
      {
        label: "افزایش موجودی",
        className: "sm",
        onClick: async (row) => {
          const val = await Modal.prompt("مقدار افزایش موجودی:", {
            title: "افزایش موجودی",
            inputType: "number",
            okText: "ثبت",
          });
          if (val === null) return;
          const qty = parseNumber(val);
          if (!isFinite(qty) || qty <= 0)
            return toast("مقدار نامعتبر است", { type: "warn" });
          try {
            await InventoryAPI.increaseStock(row.id, qty);
            toast("موجودی افزایش یافت", { type: "success" });
            table.reload();
          } catch (err) {
            toast(formatError(err), { type: "error" });
          }
        },
      },
      {
        label: "کاهش موجودی",
        className: "sm",
        onClick: async (row) => {
          const val = await Modal.prompt("مقدار کاهش موجودی:", {
            title: "کاهش موجودی",
            inputType: "number",
            okText: "ثبت",
          });
          if (val === null) return;
          const qty = parseNumber(val);
          if (!isFinite(qty) || qty <= 0)
            return toast("مقدار نامعتبر است", { type: "warn" });
          try {
            await InventoryAPI.decreaseStock(row.id, qty);
            toast("موجودی کاهش یافت", { type: "success" });
            table.reload();
          } catch (err) {
            toast(formatError(err), { type: "error" });
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
      searchable: false, // we have our own inputs
      data: async ({
        page,
        limit,
        sortBy,
        sortDir,
        search,
        filters: tblFilters,
      }) => {
        // Combine table's search with toolbar search
        const f = {
          ...(tblFilters || {}),
          ...(normalizeFilters(filters) || {}),
        };
        if (el.tableSearch?.value)
          f.search = (el.tableSearch.value || "").trim();
        // Server call
        const resp = await InventoryAPI.listProducts({
          page,
          limit,
          filters: f,
        });
        const data = resp?.data || resp || {};
        // Accept both array and {products,total}
        const rows = Array.isArray(data)
          ? data
          : data.products || data.items || [];
        const total = Array.isArray(data) ? data.length : data.total || 0;
        return { rows, total };
      },
      onLoaded: ({ total, page, limit }) => {
        // update page-size selector to reflect current limit
        if (el.pageSize) {
          const v = String(limit);
          if (el.pageSize.value !== v) el.pageSize.value = v;
        }
      },
    });
  }

  // ------------------------------------------------------------------
  // Camera
  // ------------------------------------------------------------------

  function mountCameraComponent() {
    if (!el.cameraRoot) return;
    camera = Camera(el.cameraRoot, {
      fillInput: el.weightOutput,
      convertTo: WEIGHT_UNITS.GRAM,
      onResult: (res) => {
        if (res?.weight) toast("وزن ثبت شد", { type: "success" });
      },
    });
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  function setText(node, text) {
    if (node) node.textContent = text || "";
  }

  function scrollInto(node) {
    try {
      node?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {}
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
