// ======================================================================
// Zarmind Sidebar Component (Vanilla JS)
// - Renders main navigation (RTL-friendly)
// - Highlights active route
// - Listens to route change events
// - Mobile drawer toggle (via 'ui:toggle-sidebar' event)
// - Optional badges (low stock, pending payments) via API if provided
// ======================================================================

import { APP, ROUTES, API, EVENTS } from "../utils/constants.js";

import { qs, qsa, on, delegate, emit, onEvent } from "../utils/helpers.js";

const SIDEBAR_ID = "sidebar";
const DRAWER_OVERLAY_CLASS = "drawer-overlay";

// Fallback route-changed event name if constants is not available
const ROUTE_CHANGED_EVENT =
  (EVENTS && EVENTS.ROUTE_CHANGED) || "app:route-changed";

// Local UI event name used by navbar
const TOGGLE_SIDEBAR_EVENT = "ui:toggle-sidebar";

// ----------------------------------------------------------------------
// Markup
// ----------------------------------------------------------------------

function sidebarHTML() {
  return `
    <nav class="menu" id="sidebar-menu">
      <div class="section">منو</div>

      <a href="${ROUTES.DASHBOARD}" class="menu-item" data-route="dashboard">
        <span class="icon">🏠</span>
        <span>داشبورد</span>
        <span class="badge" data-badge="dashboard" style="display:none;"></span>
      </a>

      <a href="${ROUTES.INVENTORY}" class="menu-item" data-route="inventory">
        <span class="icon">📦</span>
        <span>موجودی</span>
        <span class="badge" data-badge="inventory" style="display:none;"></span>
      </a>

      <a href="${ROUTES.SALES}" class="menu-item" data-route="sales">
        <span class="icon">🧾</span>
        <span>فروش</span>
        <span class="badge" data-badge="sales" style="display:none;"></span>
      </a>

      <a href="${ROUTES.CUSTOMERS}" class="menu-item" data-route="customers">
        <span class="icon">👥</span>
        <span>مشتریان</span>
        <span class="badge" data-badge="customers" style="display:none;"></span>
      </a>

      <a href="${ROUTES.REPORTS}" class="menu-item" data-route="reports">
        <span class="icon">📊</span>
        <span>گزارش‌ها</span>
        <span class="badge" data-badge="reports" style="display:none;"></span>
      </a>

      <a href="${ROUTES.SETTINGS}" class="menu-item" data-route="settings">
        <span class="icon">⚙️</span>
        <span>تنظیمات</span>
      </a>

      <div class="section" style="margin-top:12px;">درباره</div>
      <div class="menu-item" tabindex="0" aria-label="درباره زرمند" style="cursor:default;">
        <span class="icon">💎</span>
        <span>${APP.NAME}</span>
        <span class="badge" title="نسخه">${APP.VERSION}</span>
      </div>
    </nav>
  `;
}

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

function highlightActive(root, hash) {
  const menu = qs("#sidebar-menu", root);
  if (!menu) return;
  const links = qsa("a.menu-item[data-route]", menu);
  links.forEach((a) => a.classList.remove("active"));

  const clean = (hash || "").split("?")[0];
  const active = Array.from(links).find(
    (a) => (a.getAttribute("href") || "").split("?")[0] === clean
  );
  if (active) active.classList.add("active");
}

function ensureOverlay() {
  let overlay = qs(`.${DRAWER_OVERLAY_CLASS}`);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = DRAWER_OVERLAY_CLASS;
    document.body.appendChild(overlay);
  }
  return overlay;
}

function openDrawer(sidebarEl) {
  const overlay = ensureOverlay();
  overlay.classList.add("open");
  sidebarEl.classList.add("drawer");
  sidebarEl.classList.add("open");
  document.body.classList.add("drawer-open");
}

function closeDrawer(sidebarEl) {
  const overlay = ensureOverlay();
  overlay.classList.remove("open");
  sidebarEl.classList.remove("open");
  // keep .drawer class for styling when open only; remove to avoid interfering desktop
  sidebarEl.classList.remove("drawer");
  document.body.classList.remove("drawer-open");
}

function toggleDrawer(sidebarEl) {
  if (sidebarEl.classList.contains("open")) closeDrawer(sidebarEl);
  else openDrawer(sidebarEl);
}

function isMobile() {
  return window.innerWidth <= 1024;
}

function setBadge(root, key, value) {
  const el = qs(`[data-badge="${key}"]`, root);
  if (!el) return;
  const n = Number(value) || 0;
  if (n > 0) {
    el.textContent = n > 99 ? "99+" : String(n);
    el.style.display = "inline-flex";
  } else {
    el.style.display = "none";
  }
}

// Optionally fetch quick counts/badges (low stock, pending payments)
async function updateBadges(root, ctx) {
  if (!ctx || !ctx.api || !ctx.constants) return;
  try {
    // Inventory alerts
    const inv = await ctx.api.get(ctx.constants.API.INVENTORY.ALERTS);
    const invData = inv?.data || inv || {};
    const low = Array.isArray(invData.lowStock)
      ? invData.lowStock.length
      : invData.lowStock || 0;
    const out = Array.isArray(invData.outOfStock)
      ? invData.outOfStock.length
      : invData.outOfStock || 0;
    setBadge(root, "inventory", low + out);
  } catch {
    // ignore
  }

  try {
    // Pending payments
    const pend = await ctx.api.get(ctx.constants.API.SALES.PAYMENTS_PENDING);
    const list = pend?.data || pend || [];
    setBadge(root, "sales", Array.isArray(list) ? list.length : 0);
  } catch {
    // ignore
  }

  // You can add more badges here (customers with debt, etc.)
}

// ----------------------------------------------------------------------
// Mount / Unmount
// ----------------------------------------------------------------------

export default function mountSidebar(root, ctx = {}) {
  // Resolve target container
  const container =
    root ||
    qs(`#${SIDEBAR_ID}`) ||
    (() => {
      const aside = document.createElement("aside");
      aside.id = SIDEBAR_ID;
      document.body.prepend(aside);
      return aside;
    })();

  container.classList.add("sidebar");
  container.innerHTML = sidebarHTML();

  // Highlight current route
  highlightActive(container, location.hash || ROUTES.DASHBOARD);

  // Click -> navigate (SPA)
  const offClick = delegate(
    container,
    "click",
    "a.menu-item[data-route]",
    (e, a) => {
      e.preventDefault();
      const href = a.getAttribute("href") || "#/dashboard";
      if (typeof ctx.navigate === "function") ctx.navigate(href);
      else location.hash = href;
      if (isMobile()) closeDrawer(container);
    }
  );

  // Update highlight on route changes
  const onHash = on(window, "hashchange", () =>
    highlightActive(container, location.hash)
  );
  const onRouteChanged = on(window, ROUTE_CHANGED_EVENT, (ev) =>
    highlightActive(container, ev?.detail?.path || location.hash)
  );

  // Toggle mobile drawer when receiving UI event
  const offToggle = onEvent(TOGGLE_SIDEBAR_EVENT, () => {
    if (!isMobile()) return;
    toggleDrawer(container);
  });

  // Close drawer on overlay click
  const overlay = ensureOverlay();
  const offOverlay = on(overlay, "click", () => {
    if (container.classList.contains("open")) closeDrawer(container);
  });

  // Close drawer on window resize changes
  const offResize = on(window, "resize", () => {
    if (!isMobile()) {
      // Ensure overlay hidden and drawer closed on desktop
      closeDrawer(container);
    }
  });

  // Populate badges if API available
  updateBadges(container, ctx).catch(() => {});

  // Return unmount
  return function unmount() {
    try {
      offClick && offClick();
      onHash && onHash();
      onRouteChanged && onRouteChanged();
      offToggle && offToggle();
      offOverlay && offOverlay();
      offResize && offResize();
      // Cleanup overlay visibility (do not remove DOM to reuse)
      const ov = qs(`.${DRAWER_OVERLAY_CLASS}`);
      if (ov) ov.classList.remove("open");
      container.classList.remove("open", "drawer");
    } catch {}
  };
}

// Named export
export const Sidebar = { mount: mountSidebar };
