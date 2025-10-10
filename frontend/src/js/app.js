// ======================================================================
// Zarmind Frontend App (Vanilla JS SPA)
// - Bootstraps theme, auth, router, header/sidebar UI
// - Lazy-loads pages in src/js/pages/*
// - Provides minimal toast + page lifecycle (mount/unmount)
// ======================================================================

import { APP, ROUTES, API, STORAGE_KEYS, EVENTS } from "./utils/constants.js";

import {
  initTheme,
  setApiBaseUrl,
  api,
  storage,
  qs,
  qsa,
  on,
  emit,
  onEvent,
  initAppHeaderUser,
  toast,
  formatError,
} from "./utils/helpers.js";

// ----------------------------------------------------------------------
// Global State
// ----------------------------------------------------------------------

let state = {
  user: null,
  route: null,
  page: {
    mod: null,
    unmount: null,
  },
};

// ----------------------------------------------------------------------
// Boot
// ----------------------------------------------------------------------

(async function boot() {
  try {
    // Theme
    initTheme();

    // Optional: allow overriding API base via localStorage
    const savedApi = storage.get(STORAGE_KEYS.API_BASE_URL);
    if (savedApi) setApiBaseUrl(savedApi);

    // Wire UI events (toasts)
    setupToastListener();

    // Header user placeholder
    initAppHeaderUser(null);

    // Sidebar interactions (active link highlight)
    setupSidebar();

    // Router
    window.addEventListener("hashchange", handleRouteChange);
    window.addEventListener("popstate", handleRouteChange);

    // Try get current user (if token exists)
    await loadCurrentUser();

    // Initial route
    if (!location.hash) {
      navigate(ROUTES.DASHBOARD);
    } else {
      await handleRouteChange();
    }

    // Hide initial loader (index.html fallback skeleton)
    hideAppLoader();
    emit(EVENTS.APP_READY);
  } catch (err) {
    console.error("[Zarmind] Boot error:", err);
    toast(formatError(err, "خطا در راه‌اندازی برنامه"), { type: "error" });
    hideAppLoader();
  }
})();

// ----------------------------------------------------------------------
// Auth
// ----------------------------------------------------------------------

async function loadCurrentUser() {
  try {
    const me = await api.get(API.AUTH.ME);
    state.user = me?.data || me; // supports both wrapped and plain
    initAppHeaderUser(state.user);
    markAuthUI(true);
  } catch (err) {
    // 401 is expected if not logged-in
    state.user = null;
    initAppHeaderUser(null);
    markAuthUI(false);
  }
}

async function signIn({ username, email, password, rememberMe = true }) {
  try {
    const body = username
      ? { username, password, rememberMe }
      : { email, password, rememberMe };
    const endpoint = username ? API.AUTH.LOGIN : API.AUTH.LOGIN_EMAIL;

    const res = await api.post(endpoint, body);
    const data = res?.data || res;

    // Persist tokens
    if (data?.accessToken)
      storage.set(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
    if (data?.refreshToken)
      storage.set(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);

    // Save user
    state.user = data?.user || null;
    storage.setJSON(STORAGE_KEYS.USER, state.user);

    initAppHeaderUser(state.user);
    markAuthUI(true);
    emit(EVENTS.AUTH_LOGIN, state.user);

    toast("ورود موفقیت‌آمیز بود", { type: "success" });
    navigate(ROUTES.DASHBOARD);
  } catch (err) {
    throw err;
  }
}

async function signOut() {
  try {
    await api.post(API.AUTH.LOGOUT, {});
  } catch {
    // ignore
  } finally {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    storage.remove(STORAGE_KEYS.REFRESH_TOKEN);
    storage.remove(STORAGE_KEYS.USER);
    state.user = null;
    initAppHeaderUser(null);
    markAuthUI(false);
    emit(EVENTS.AUTH_LOGOUT);
    navigate(ROUTES.LOGIN);
  }
}

function markAuthUI(isAuthed) {
  const sidebar = qs("#sidebar");
  if (sidebar) {
    sidebar.classList.toggle("hidden", !isAuthed && window.innerWidth < 1024);
  }
  // You could also toggle header actions, etc.
}

// ----------------------------------------------------------------------
// Router
// ----------------------------------------------------------------------

const ROUTE_MAP = {
  "#/dashboard": () => import("./pages/dashboard.js"),
  "#/inventory": () => import("./pages/inventory.js"),
  "#/sales": () => import("./pages/sales.js"),
  "#/customers": () => import("./pages/customers.js"),
  "#/reports": () => import("./pages/reports.js"),
  "#/settings": () => import("./pages/settings.js"),
  "#/login": () => import("./pages/login.js"),
};

function normalizeHash(h) {
  if (!h) return ROUTES.DASHBOARD;
  const clean = h.split("?")[0];
  return clean;
}

async function handleRouteChange() {
  const hash = normalizeHash(location.hash || ROUTES.DASHBOARD);
  state.route = hash;

  // Auth guard (all except login)
  if (!state.user && hash !== ROUTES.LOGIN) {
    navigate(ROUTES.LOGIN, { replace: true });
    return;
  }
  // Prevent going to login if already authed
  if (state.user && hash === ROUTES.LOGIN) {
    navigate(ROUTES.DASHBOARD, { replace: true });
    return;
  }

  highlightSidebar(hash);
  await mountRoute(hash);
}

async function mountRoute(hash) {
  const appRoot = qs("#app");
  if (!appRoot) return;

  // Call previous unmount (if any)
  try {
    if (typeof state.page.unmount === "function") {
      await state.page.unmount();
    }
  } catch (e) {
    console.warn("[Zarmind] Page unmount error:", e);
  } finally {
    state.page.unmount = null;
    state.page.mod = null;
  }

  // Reset content with a small placeholder (optional)
  appRoot.innerHTML = `
    <div class="container p-6">
      <div class="skeleton" style="height: 12px; width: 28%; margin-bottom: 18px;"></div>
      <div class="skeleton" style="height: 240px; width: 100%; border-radius: 8px;"></div>
    </div>
  `;

  // Resolve module loader
  const loader = ROUTE_MAP[hash];
  let mod;
  try {
    mod = loader ? await loader() : null;
  } catch (e) {
    console.error("[Zarmind] Failed to load page module for", hash, e);
    mod = null;
  }

  // Build page context
  const ctx = {
    user: state.user,
    setUser: (u) => {
      state.user = u;
      initAppHeaderUser(u);
    },
    auth: {
      isAuthenticated: () => !!state.user,
      signIn,
      signOut,
    },
    navigate,
    api,
    constants: { APP, ROUTES, API, STORAGE_KEYS, EVENTS },
    helpers: {
      toast,
      emit,
      onEvent,
      qs,
      qsa,
    },
    route: hash,
  };

  // Mount logic
  try {
    appRoot.innerHTML = ""; // clear placeholder

    if (!mod) {
      renderNotFound(appRoot, hash);
      return;
    }

    // Accept various export shapes:
    // - default: function (root, ctx) {}
    // - mount(ctx): returns unmount
    // - render(root, ctx)
    let unmount = null;

    if (typeof mod.default === "function") {
      // default(root, ctx) or default(ctx)
      const res =
        mod.default.length >= 2 ? mod.default(appRoot, ctx) : mod.default(ctx);
      unmount = typeof res === "function" ? res : mod.unmount || null;
    } else if (typeof mod.mount === "function") {
      const res = mod.mount(appRoot, ctx);
      unmount = typeof res === "function" ? res : mod.unmount || null;
    } else if (typeof mod.render === "function") {
      mod.render(appRoot, ctx);
      unmount = mod.unmount || null;
    } else {
      // Fallback: simple title
      renderSimplePage(appRoot, hash);
    }

    state.page.mod = mod;
    state.page.unmount = unmount || null;
  } catch (e) {
    console.error("[Zarmind] Page mount error:", e);
    toast("خطا در بارگذاری صفحه", { type: "error" });
    renderError(appRoot, e);
  }
}

function navigate(hash, { replace = false } = {}) {
  if (!hash) return;
  if (replace) {
    history.replaceState(null, "", hash);
    handleRouteChange();
  } else {
    location.hash = hash;
  }
}

// ----------------------------------------------------------------------
// Sidebar / Header UI
// ----------------------------------------------------------------------

function setupSidebar() {
  // Activate on click
  const menu = qs("#sidebar-menu");
  if (!menu) return;

  on(menu, "click", (e) => {
    const a = e.target.closest("a[data-route]");
    if (!a) return;
    e.preventDefault();
    const href = a.getAttribute("href") || a.dataset.href || "#/dashboard";
    navigate(href);
  });

  // Initial highlight
  highlightSidebar(location.hash);
}

function highlightSidebar(hash) {
  const links = qsa("#sidebar-menu a[data-route]");
  links.forEach((a) => a.classList.remove("active"));
  const active = Array.from(links).find(
    (a) => (a.getAttribute("href") || "").split("?")[0] === hash
  );
  if (active) active.classList.add("active");
}

function hideAppLoader() {
  const el = qs("#app-loading");
  if (el) el.classList.add("hidden");
}

// ----------------------------------------------------------------------
// Toasts
// ----------------------------------------------------------------------

function setupToastListener() {
  // Simple in-app toast container
  let container = qs(".toast");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast";
    document.body.appendChild(container);
  }

  onEvent(EVENTS.TOAST, (payload) => {
    const { id, type = "info", message, timeout = 3500 } = payload || {};
    const el = document.createElement("div");
    el.className = `alert ${type === "error" ? "error" : type === "warn" ? "warn" : type === "success" ? "success" : "info"}`;
    el.innerHTML = `
      <span>${message || ""}</span>
      <button class="icon-btn" style="margin-inline-start:auto">✕</button>
    `;
    container.appendChild(el);

    const remove = () => {
      try {
        el.remove();
      } catch {}
    };
    el.querySelector("button")?.addEventListener("click", remove);
    if (timeout > 0) setTimeout(remove, timeout);
  });
}

// ----------------------------------------------------------------------
// Fallback renderers
// ----------------------------------------------------------------------

function renderSimplePage(root, hash) {
  root.innerHTML = `
    <div class="container p-6">
      <div class="page-header">
        <div class="page-title">صفحه</div>
      </div>
      <div class="card card-body">
        <p>این صفحه هنوز پیاده‌سازی نشده است: <code class="kbd">${hash}</code></p>
      </div>
    </div>
  `;
}

function renderNotFound(root, hash) {
  root.innerHTML = `
    <div class="container p-6">
      <div class="page-header">
        <div class="page-title">یافت نشد</div>
      </div>
      <div class="empty">
        <div class="title">صفحه مورد نظر یافت نشد</div>
        <div class="subtitle"> مسیر: <span class="code">${hash}</span> </div>
        <div class="mt-4">
          <a class="btn" href="${ROUTES.DASHBOARD}">بازگشت به داشبورد</a>
        </div>
      </div>
    </div>
  `;
}

function renderError(root, err) {
  root.innerHTML = `
    <div class="container p-6">
      <div class="page-header">
        <div class="page-title">خطا</div>
      </div>
      <div class="card">
        <div class="card-body">
          <p class="mb-3">خطایی رخ داد:</p>
          <pre class="code" style="white-space:pre-wrap">${(err && (err.stack || err.message)) || err}</pre>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------
// Expose minimal app API (for pages)
// ----------------------------------------------------------------------

export const App = {
  getUser: () => state.user,
  setUser: (u) => {
    state.user = u;
    initAppHeaderUser(u);
  },
  navigate,
  signIn,
  signOut,
};

window.ZarmindApp = App;
