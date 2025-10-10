// ======================================================================
// Zarmind Data Table Component (Vanilla JS)
// - Columns: key, header, sortable, width, align, className, format, render
// - Data: local array or remote loader ({ page, limit, sortBy, sortDir, search, filters })
// - Features: sorting, pagination, search, selection, actions, sticky header
// - UI classes: .table-wrapper, .table-toolbar, .data-table, .table-scroll, .pagination
// - Returns API: reload, setData, getSelected, clearSelection, setSearch, setFilters, destroy
// ======================================================================

import {
  qs,
  qsa,
  on,
  delegate,
  createEl,
  debounce,
  clamp,
  formatError,
  storage,
  toPersianDigits,
} from "../utils/helpers.js";

import { PAGINATION } from "../utils/constants.js";

import {
  formatNumberFa,
  formatCurrency,
  dateCell,
  weightCell,
} from "../utils/formatters.js";

// ----------------------------------------------------------------------
// Defaults
// ----------------------------------------------------------------------

const DEFAULTS = {
  idField: "id",
  columns: [], // [{ key, header, sortable, width, align, className, format, render(row, value), headerClass, sortKey }]
  data: [], // array OR async loader fn (ctx)
  server: false, // true => use remote loader
  page: 1,
  limit: PAGINATION.DEFAULT_LIMIT,
  pageSizes: [10, 20, 50, 100],
  stickyHeader: true,
  striped: true,
  selectable: false,
  multiSelect: true,
  selectionPreserve: true, // keep selections across pages (server)
  actions: [], // [{ label, icon, className, onClick(row), showIf(row) }]
  emptyText: "داده‌ای برای نمایش وجود ندارد",
  searchable: true,
  searchPlaceholder: "جستجو…",
  persistKey: null, // 'table:inventory'
  toolbar: {
    left: null, // (container, api) => {}
    right: null, // (container, api) => {}
  },
  onRowClick: null, // (row, event) => {}
  onSelectionChange: null, // (selectedRows, selectedIds) => {}
  onLoaded: null, // ({ rows, total, page, limit }) => {}
};

// ----------------------------------------------------------------------
// Component Factory
// ----------------------------------------------------------------------

export default function createTable(root, options = {}) {
  const cfg = { ...DEFAULTS, ...options };
  const state = {
    page: cfg.page,
    limit: cfg.limit,
    total: 0,
    sortBy: null,
    sortDir: null, // 'asc' | 'desc'
    rows: [],
    loading: false,
    search: "",
    filters: {},
    selected: new Set(), // of ids
    selectedRows: new Map(), // id -> row (if preserve)
  };

  const el = {
    wrapper: null,
    toolbar: null,
    search: null,
    size: null,
    table: null,
    thead: null,
    tbody: null,
    scroll: null,
    pagination: null,
    info: null,
    prev: null,
    next: null,
    headerSelectAll: null,
  };

  // ------------------------------------------
  // Persistence
  // ------------------------------------------
  if (cfg.persistKey) {
    try {
      const saved = JSON.parse(storage.get(cfg.persistKey) || "{}");
      if (saved.limit) state.limit = saved.limit;
      if (saved.sortBy) state.sortBy = saved.sortBy;
      if (saved.sortDir) state.sortDir = saved.sortDir;
      if (saved.search) state.search = saved.search;
    } catch {}
  }

  const persist = () => {
    if (!cfg.persistKey) return;
    const data = {
      limit: state.limit,
      sortBy: state.sortBy,
      sortDir: state.sortDir,
      search: state.search,
    };
    storage.set(cfg.persistKey, JSON.stringify(data));
  };

  // ------------------------------------------
  // Init DOM
  // ------------------------------------------

  function mount() {
    const container = root || document.createElement("div");
    container.innerHTML = "";
    container.classList.add("table-wrapper");

    // Toolbar
    const toolbar = createEl("div", { className: "table-toolbar" });
    const left = createEl("div", {
      className: "toolbar-left",
      attrs: { style: "display:flex;gap:8px;align-items:center;" },
    });
    const right = createEl("div", {
      className: "toolbar-right",
      attrs: {
        style:
          "display:flex;gap:8px;align-items:center;margin-inline-start:auto;",
      },
    });

    // Search
    let searchInput = null;
    if (cfg.searchable) {
      const form = createEl("form", {
        className: "field",
        attrs: { role: "search" },
      });
      searchInput = createEl("input", {
        attrs: {
          type: "search",
          placeholder: cfg.searchPlaceholder || "جستجو…",
          value: state.search || "",
        },
        className: "search-input",
      });
      form.appendChild(searchInput);
      right.appendChild(form);

      on(form, "submit", (e) => {
        e.preventDefault();
        setSearch(searchInput.value);
      });
      const debounced = debounce(() => setSearch(searchInput.value), 400);
      on(searchInput, "input", debounced);
    }

    // Page size
    const sizeSel = createEl("select", {
      className: "field",
      attrs: { "aria-label": "تعداد در صفحه" },
    });
    cfg.pageSizes.forEach((n) => {
      const opt = createEl("option", {
        text: String(n),
        attrs: { value: String(n) },
      });
      if (n === state.limit) opt.selected = true;
      sizeSel.appendChild(opt);
    });
    on(sizeSel, "change", () => {
      setPageSize(parseInt(sizeSel.value, 10) || state.limit);
    });
    right.appendChild(sizeSel);

    // Custom toolbar slots
    if (typeof cfg.toolbar.left === "function") {
      try {
        cfg.toolbar.left(left, api);
      } catch {}
    }
    if (typeof cfg.toolbar.right === "function") {
      try {
        cfg.toolbar.right(right, api);
      } catch {}
    }

    toolbar.appendChild(left);
    toolbar.appendChild(right);

    // Scroll + Table
    const scroll = createEl("div", { className: "table-scroll" });
    const table = createEl("table", { className: "data-table" });
    const thead = createEl("thead");
    const tbody = createEl("tbody");

    table.appendChild(thead);
    table.appendChild(tbody);
    scroll.appendChild(table);

    // Pagination
    const pagination = createEl("div", { className: "pagination" });
    const prev = createEl("button", { className: "page-btn", text: "‹" });
    const info = createEl("div", { className: "page-info", text: "" });
    const next = createEl("button", { className: "page-btn", text: "›" });

    on(prev, "click", () => setPage(state.page - 1));
    on(next, "click", () => setPage(state.page + 1));

    pagination.appendChild(prev);
    pagination.appendChild(next);
    pagination.appendChild(info);

    // Compose
    container.appendChild(toolbar);
    container.appendChild(scroll);
    container.appendChild(pagination);

    // Save refs
    el.wrapper = container;
    el.toolbar = toolbar;
    el.search = searchInput;
    el.size = sizeSel;
    el.table = table;
    el.thead = thead;
    el.tbody = tbody;
    el.scroll = scroll;
    el.pagination = pagination;
    el.prev = prev;
    el.next = next;
    el.info = info;

    // Render header once
    renderHeader();

    // Initial data
    load();

    return container;
  }

  function renderHeader() {
    const tr = createEl("tr");
    tr.innerHTML = "";

    // Selection column
    if (cfg.selectable) {
      const thSel = createEl("th", {
        className: "num",
        attrs: { style: "width:36px;" },
      });
      const cb = createEl("input", {
        attrs: { type: "checkbox", "aria-label": "انتخاب همه" },
      });
      on(cb, "change", () => toggleSelectAll(cb.checked));
      thSel.appendChild(cb);
      tr.appendChild(thSel);
      el.headerSelectAll = cb;
    }

    cfg.columns.forEach((col) => {
      const th = createEl("th", { text: col.header || col.key || "" });
      if (col.headerClass) th.className = col.headerClass;
      if (col.width)
        th.style.width =
          typeof col.width === "number" ? `${col.width}px` : String(col.width);
      if (col.align) th.style.textAlign = col.align;
      if (col.sortable !== false) {
        th.classList.add("sortable");
        const sortSpan = createEl("span", { className: "sort", text: "▲" });
        th.appendChild(sortSpan);
        on(th, "click", () => toggleSort(col));
      }
      tr.appendChild(th);
    });

    // Actions column
    if (cfg.actions && cfg.actions.length) {
      const thAction = createEl("th", {
        text: "عملیات",
        attrs: { style: "width:1%;white-space:nowrap" },
      });
      tr.appendChild(thAction);
    }

    el.thead.innerHTML = "";
    el.thead.appendChild(tr);

    // Apply current sort indicator
    refreshSortIndicators();
  }

  function refreshSortIndicators() {
    const ths = qsa("th", el.thead);
    ths.forEach((th) => {
      th.classList.remove("sort-asc", "sort-desc");
    });
    if (!state.sortBy) return;
    const idx = indexOfColumn(state.sortBy);
    if (idx >= 0) {
      const th = ths[cfg.selectable ? idx + 1 : idx]; // offset if selection col
      if (th)
        th.classList.add(state.sortDir === "desc" ? "sort-desc" : "sort-asc");
    }
  }

  function indexOfColumn(sortKey) {
    return cfg.columns.findIndex((c) => (c.sortKey || c.key) === sortKey);
  }

  // ------------------------------------------
  // Data loading
  // ------------------------------------------

  async function load() {
    state.loading = true;
    renderLoading();
    try {
      let rows = [];
      let total = 0;
      if (typeof cfg.data === "function") {
        // remote loader
        const res = await cfg.data({
          page: state.page,
          limit: state.limit,
          sortBy: state.sortBy,
          sortDir: state.sortDir,
          search: state.search,
          filters: state.filters,
        });
        rows = res?.rows || res?.data || [];
        total = Number(res?.total ?? rows.length ?? 0);
      } else {
        // local data array
        const all = Array.isArray(cfg.data) ? cfg.data.slice() : [];
        // filter (simple search on stringified)
        const filtered = state.search
          ? all.filter((row) =>
              JSON.stringify(row)
                .toLowerCase()
                .includes(state.search.toLowerCase())
            )
          : all;
        // sort
        const { sortBy, sortDir } = state;
        if (sortBy) {
          const col = cfg.columns[indexOfColumn(sortBy)];
          const key = col?.key || sortBy;
          filtered.sort((a, b) => {
            const av = getValue(a, col);
            const bv = getValue(b, col);
            if (av == null && bv == null) return 0;
            if (av == null) return sortDir === "asc" ? -1 : 1;
            if (bv == null) return sortDir === "asc" ? 1 : -1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            return 0;
          });
        }
        total = filtered.length;
        const start = (state.page - 1) * state.limit;
        rows = filtered.slice(start, start + state.limit);
      }

      state.rows = rows;
      state.total = total;
      state.loading = false;
      renderBody();
      renderPagination();
      if (typeof cfg.onLoaded === "function") {
        try {
          cfg.onLoaded({ rows, total, page: state.page, limit: state.limit });
        } catch {}
      }
    } catch (err) {
      state.loading = false;
      renderError(formatError(err, "خطا در بارگذاری داده‌ها"));
    } finally {
      persist();
    }
  }

  // ------------------------------------------
  // Rendering
  // ------------------------------------------

  function renderLoading() {
    el.tbody.innerHTML = `
      <tr><td colspan="${columnSpan()}">
        <div class="skeleton" style="height: 160px;"></div>
      </td></tr>
    `;
  }

  function renderError(message) {
    el.tbody.innerHTML = `
      <tr><td colspan="${columnSpan()}">
        <div class="empty">
          <div class="title">خطا</div>
          <div class="subtitle">${message}</div>
        </div>
      </td></tr>
    `;
    renderPagination(); // still draw footer
  }

  function renderEmpty() {
    el.tbody.innerHTML = `
      <tr><td colspan="${columnSpan()}">
        <div class="empty">
          <div class="title">${cfg.emptyText}</div>
          <div class="subtitle">تعداد ردیف‌ها: ۰</div>
        </div>
      </td></tr>
    `;
  }

  function columnSpan() {
    return (
      (cfg.selectable ? 1 : 0) +
      cfg.columns.length +
      (cfg.actions && cfg.actions.length ? 1 : 0)
    );
  }

  function renderBody() {
    if (!state.rows || state.rows.length === 0) {
      renderEmpty();
      refreshHeaderSelection();
      return;
    }

    const frag = document.createDocumentFragment();

    state.rows.forEach((row, rIdx) => {
      const tr = createEl("tr");
      if (typeof cfg.rowClass === "function") {
        try {
          tr.className = cfg.rowClass(row, rIdx) || "";
        } catch {}
      }

      // Selection cell
      if (cfg.selectable) {
        const tdSel = createEl("td", { className: "num" });
        const id = getRowId(row);
        const cb = createEl("input", {
          attrs: { type: "checkbox", "data-id": String(id) },
        });
        cb.checked = state.selected.has(id);
        on(cb, "change", () => {
          toggleSelectRow(id, row, cb.checked);
        });
        tdSel.appendChild(cb);
        tr.appendChild(tdSel);
      }

      // Data cells
      for (const col of cfg.columns) {
        const td = createEl("td");
        if (col.className) td.className = col.className;
        if (col.align) td.style.textAlign = col.align;

        let value = getValue(row, col);

        // Render precedence: render(row, value) -> format -> default
        if (typeof col.render === "function") {
          try {
            const out = col.render(row, value, { rowIndex: rIdx, column: col });
            if (out instanceof Node) td.appendChild(out);
            else td.innerHTML = out ?? "";
          } catch {
            td.textContent = value ?? "";
          }
        } else if (typeof col.format === "function") {
          try {
            td.innerHTML = col.format(value, row) ?? "";
          } catch {
            td.textContent = value ?? "";
          }
        } else {
          // heuristics: number/money/date (basic)
          if (typeof value === "number") td.textContent = formatNumberFa(value);
          else td.textContent = value == null ? "" : String(value);
        }

        tr.appendChild(td);
      }

      // Actions
      if (cfg.actions && cfg.actions.length) {
        const tdAct = createEl("td", { className: "cell-actions" });
        cfg.actions.forEach((action) => {
          if (typeof action?.showIf === "function" && !action.showIf(row))
            return;
          const btn = createEl("button", {
            className: ["btn", "sm", action.className]
              .filter(Boolean)
              .join(" "),
            text: action.icon
              ? `${action.icon} ${action.label || ""}`
              : action.label || "اقدام",
          });
          on(btn, "click", (e) => {
            e.stopPropagation();
            try {
              action.onClick && action.onClick(row, e, api);
            } catch {}
          });
          tdAct.appendChild(btn);
        });
        tr.appendChild(tdAct);
      }

      // Row click
      if (typeof cfg.onRowClick === "function") {
        on(tr, "click", (e) => {
          // avoid triggering when clicking action buttons or checkboxes
          const isCtrl =
            e.target.closest("button") ||
            e.target.closest("a") ||
            e.target.tagName === "INPUT";
          if (isCtrl) return;
          try {
            cfg.onRowClick(row, e);
          } catch {}
        });
      }

      frag.appendChild(tr);
    });

    el.tbody.innerHTML = "";
    el.tbody.appendChild(frag);
    refreshHeaderSelection();
  }

  function renderPagination() {
    const totalPages = Math.max(
      1,
      Math.ceil(state.total / Math.max(1, state.limit))
    );
    const current = clamp(state.page, 1, totalPages);

    el.prev.disabled = current <= 1;
    el.next.disabled = current >= totalPages;

    const start = state.total === 0 ? 0 : (current - 1) * state.limit + 1;
    const end = Math.min(current * state.limit, state.total);

    el.info.textContent = toPersianDigits(
      `نمایش ${start}-${end} از ${state.total}`
    );
  }

  // ------------------------------------------
  // Selection
  // ------------------------------------------

  function getRowId(row) {
    const id = row?.[cfg.idField];
    return id != null ? id : JSON.stringify(row);
  }

  function toggleSelectAll(checked) {
    const ids = [];
    const rows = [];
    qsa('tbody input[type="checkbox"][data-id]', el.table).forEach((cb) => {
      const id = cb.getAttribute("data-id");
      cb.checked = checked;
      ids.push(id);
    });

    state.rows.forEach((r) => {
      const id = String(getRowId(r));
      if (ids.includes(id)) {
        if (checked) {
          state.selected.add(id);
          if (cfg.selectionPreserve) state.selectedRows.set(id, r);
        } else {
          state.selected.delete(id);
          if (cfg.selectionPreserve) state.selectedRows.delete(id);
        }
      }
    });

    notifySelection();
  }

  function toggleSelectRow(id, row, checked) {
    const key = String(id);
    if (!cfg.multiSelect && checked) {
      // single select
      state.selected.forEach((sid) => {
        if (sid !== key) state.selected.delete(sid);
      });
      // uncheck other checkboxes in current page
      qsa('tbody input[type="checkbox"][data-id]', el.table).forEach((cb) => {
        if (cb.getAttribute("data-id") !== key) cb.checked = false;
      });
    }

    if (checked) {
      state.selected.add(key);
      if (cfg.selectionPreserve) state.selectedRows.set(key, row);
    } else {
      state.selected.delete(key);
      if (cfg.selectionPreserve) state.selectedRows.delete(key);
    }

    refreshHeaderSelection();
    notifySelection();
  }

  function refreshHeaderSelection() {
    if (!cfg.selectable || !el.headerSelectAll) return;
    const boxes = qsa('tbody input[type="checkbox"][data-id]', el.table);
    if (boxes.length === 0) {
      el.headerSelectAll.checked = false;
      el.headerSelectAll.indeterminate = false;
      return;
    }
    const checkedCount = boxes.filter((cb) => cb.checked).length;
    el.headerSelectAll.checked =
      checkedCount === boxes.length && boxes.length > 0;
    el.headerSelectAll.indeterminate =
      checkedCount > 0 && checkedCount < boxes.length;
  }

  function notifySelection() {
    if (typeof cfg.onSelectionChange === "function") {
      try {
        const ids = Array.from(state.selected);
        const rows = cfg.selectionPreserve
          ? Array.from(state.selectedRows.values())
          : state.rows.filter((r) => ids.includes(String(getRowId(r))));
        cfg.onSelectionChange(rows, ids);
      } catch {}
    }
  }

  // ------------------------------------------
  // Sorting
  // ------------------------------------------

  function toggleSort(col) {
    if (col.sortable === false) return;
    const sortKey = col.sortKey || col.key;
    if (!sortKey) return;

    if (state.sortBy !== sortKey) {
      state.sortBy = sortKey;
      state.sortDir = "asc";
    } else {
      state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
    }
    persist();
    refreshSortIndicators();
    // Reset page when sorting
    state.page = 1;
    load();
  }

  // ------------------------------------------
  // API helpers
  // ------------------------------------------

  function setPageSize(n) {
    if (!n || n <= 0) return;
    state.limit = n;
    state.page = 1;
    persist();
    load();
  }

  function setPage(p) {
    const totalPages = Math.max(
      1,
      Math.ceil(state.total / Math.max(1, state.limit))
    );
    state.page = clamp(p, 1, totalPages);
    load();
  }

  function setSearch(s) {
    state.search = (s || "").trim();
    persist();
    state.page = 1;
    load();
  }

  function setFilters(filters = {}) {
    state.filters = filters || {};
    state.page = 1;
    load();
  }

  function setData(data = []) {
    cfg.data = Array.isArray(data) ? data : [];
    state.page = 1;
    load();
  }

  function reload() {
    load();
  }

  function getSelected() {
    const ids = Array.from(state.selected);
    const rows = cfg.selectionPreserve
      ? Array.from(state.selectedRows.values())
      : state.rows.filter((r) => ids.includes(String(getRowId(r))));
    return { ids, rows };
  }

  function clearSelection() {
    state.selected.clear();
    state.selectedRows.clear();
    qsa('tbody input[type="checkbox"][data-id]', el.table).forEach(
      (cb) => (cb.checked = false)
    );
    refreshHeaderSelection();
    notifySelection();
  }

  function updateColumns(columns = []) {
    cfg.columns = columns;
    renderHeader();
    load();
  }

  function updateOptions(newOpts = {}) {
    Object.assign(cfg, newOpts || {});
    renderHeader();
    load();
  }

  function destroy() {
    try {
      el.wrapper?.remove();
    } catch {}
  }

  const api = {
    el,
    state,
    reload,
    setData,
    getSelected,
    clearSelection,
    setSearch,
    setFilters,
    setPage,
    setPageSize,
    updateColumns,
    updateOptions,
    destroy,
  };

  // ------------------------------------------
  // Utils
  // ------------------------------------------

  function getValue(row, col) {
    if (!col) return undefined;
    // accessor(row) overrides key
    if (typeof col.accessor === "function") {
      try {
        return col.accessor(row);
      } catch {
        return undefined;
      }
    }
    return row?.[col.key];
  }

  // ------------------------------------------
  // Mount now
  // ------------------------------------------

  const mounted = mount();
  if (root && mounted !== root) {
    root.innerHTML = "";
    root.appendChild(mounted);
  }

  return api;
}

// ----------------------------------------------------------------------
// Named exports (helpers)
// ----------------------------------------------------------------------

export function defaultColumnsFromObject(obj = {}) {
  return Object.keys(obj).map((k) => ({
    key: k,
    header: k,
    sortable: true,
  }));
}

export function currencyColumn(key, header = "مبلغ") {
  return {
    key,
    header,
    sortable: true,
    align: "end",
    format: (v) => formatCurrency(v),
  };
}

export function numberColumn(key, header = "عدد") {
  return {
    key,
    header,
    sortable: true,
    align: "end",
    format: (v) => formatNumberFa(v),
  };
}

export function dateColumn(key, header = "تاریخ", fmt) {
  return {
    key,
    header,
    sortable: true,
    format: (v) => dateCell(v, fmt),
  };
}

export function weightColumn(key, header = "وزن", unit) {
  return {
    key,
    header,
    sortable: true,
    align: "end",
    format: (v) => weightCell(v, unit),
  };
}
