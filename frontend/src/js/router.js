// ======================================================================
// Zarmind SPA Router (Hash-based)
// - Lightweight router with params, guards, hooks, and DOM mounting
// - Supports patterns like "#/sales/:id", "#/inventory", "#/customers/:id"
// - Integrates with events (ROUTE_CHANGED) if constants.js is available
// ======================================================================

/* Usage example:
import createRouter from './router.js';

const router = createRouter({
  root: document.getElementById('app'),
  routes: [
    { path: '#/dashboard', load: () => import('./pages/dashboard.js') },
    { path: '#/inventory', load: () => import('./pages/inventory.js') },
    { path: '#/sales/:id', load: () => import('./pages/sales.js') },
  ],
});

router.start();
*/

let EVENTS;
try {
  // Optional import (avoid hard dependency)
  ({ EVENTS } = await import('./utils/constants.js'));
} catch { /* ignore */ }

const ROUTE_CHANGED = EVENTS?.ROUTE_CHANGED || 'app:route-changed';

// ----------------------------------------------------------------------
// Utilities
// ----------------------------------------------------------------------

const isFn = (v) => typeof v === 'function';
const stripHash = (h) => (h || '').replace(/^[#!]+/, '');
const ensureHash = (h) => (h?.startsWith('#') ? h : '#' + (h || ''));
const stripQuery = (p) => (p || '').split('?')[0];
const getHash = () => (typeof location !== 'undefined' ? location.hash : '') || '#/';
const samePath = (a, b) => stripQuery(a) === stripQuery(b);

/** Parse querystring from a hash like "#/path?foo=bar" */
export const parseQuery = (hashOrSearch = getHash()) => {
  const idx = hashOrSearch.indexOf('?');
  const search = idx >= 0 ? hashOrSearch.slice(idx + 1) : '';
  const sp = new URLSearchParams(search);
  const out = {};
  sp.forEach((v, k) => {
    if (out[k] !== undefined) {
      if (!Array.isArray(out[k])) out[k] = [out[k]];
      out[k].push(v);
    } else {
      out[k] = v;
    }
  });
  return out;
};

/** Build querystring from object -> "?k=v&..." */
export const buildQuery = (params = {}) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, x));
    else sp.append(k, v);
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
};

/** Convert route pattern ("/sales/:id") to regex + keys */
const pathToRegex = (pattern) => {
  const keys = [];
  // remove hash prefix if included
  const clean = stripHash(pattern.startsWith('#') ? pattern.slice(1) : pattern);

  const regexStr = clean
    .replace(/(^\/+|\/+$)/g, '') // trim slashes
    .split('/')
    .map((seg) => {
      if (seg.startsWith(':')) {
        keys.push(seg.slice(1));
        return '([^/]+?)';
      }
      // escape regex special chars
      return seg.replace("/[.*+?^${}()|[```\```/g, '\\$&'");
    })
    .join('/');

  const final = new RegExp(`^${regexStr}$`, 'i');
  return { regex: final, keys };
};

/** Match a hash path ("#/sales/123") against a pattern ("#/sales/:id") */
export const matchPath = (hashPath, pattern) => {
  const curr = stripQuery(stripHash(hashPath.startsWith('#') ? hashPath.slice(1) : hashPath)).replace(/(^\/+|\/+$)/g, '');
  const patt = stripHash(pattern.startsWith('#') ? pattern.slice(1) : pattern).replace(/(^\/+|\/+$)/g, '');
  if (patt === '') return curr === '';

  const { regex, keys } = pathToRegex(patt);
  const m = curr.match(regex);
  if (!m) return null;

  const params = {};
  keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1] || '')));
  return params;
};

// ----------------------------------------------------------------------
// Router factory
// ----------------------------------------------------------------------

export default function createRouter({
  routes = [],
  root = null,
  notFound = defaultNotFound,
  beforeEach = [],
  afterEach = [],
} = {}) {
  const state = {
    current: null,
    params: {},
    query: {},
    meta: {},
    mounted: {
      unmount: null,
      mod: null,
      path: null,
    },
    started: false,
  };

  const registry = routes.map(normalizeRoute);
  const beforeHooks = Array.isArray(beforeEach) ? [...beforeEach] : [];
  const afterHooks = Array.isArray(afterEach) ? [...afterEach] : [];

  // ------------- API ---------------

  const api = {
    addRoute(route) {
      registry.push(normalizeRoute(route));
      return api;
    },
    removeRoute(path) {
      const i = registry.findIndex((r) => r.path === path);
      if (i >= 0) registry.splice(i, 1);
      return api;
    },
    onBeforeEach(fn) {
      if (isFn(fn)) beforeHooks.push(fn);
      return api;
    },
    onAfterEach(fn) {
      if (isFn(fn)) afterHooks.push(fn);
      return api;
    },
    getCurrent() {
      return { path: state.current, params: { ...state.params }, query: { ...state.query } };
    },
    navigate,
    start,
    stop,
  };

  // ------------- Core ---------------

  function normalizeRoute(r) {
    const path = ensureHash(r.path || '#/');
    return {
      name: r.name || path,
      path,
      load: r.load,          // () => import('./pages/...js')
      mount: r.mount,        // (root, ctx) => unmount
      unmount: r.unmount,    // () => void
      guard: r.guard,        // (ctx) => true | false | redirect string
      meta: r.meta || {},
    };
  }

  async function start() {
    if (state.started) return;
    state.started = true;
    window.addEventListener('hashchange', resolve);
    window.addEventListener('popstate', resolve);
    await resolve();
  }

  function stop() {
    if (!state.started) return;
    state.started = false;
    window.removeEventListener('hashchange', resolve);
    window.removeEventListener('popstate', resolve);
  }

  function navigate(to, { replace = false, query } = {}) {
    let target = ensureHash(to || '#/');
    if (query && typeof query === 'object') target += buildQuery(query);
    if (replace) {
      history.replaceState(null, '', target);
      resolve();
    } else {
      location.hash = target;
    }
  }

  // ------------- Resolution ---------------

  async function resolve() {
    const hash = getHash() || '#/';
    const pathOnly = ensureHash(stripQuery(hash));
    const queryObj = parseQuery(hash);

    // Find matching route
    let matched, params = {};
    for (const r of registry) {
      const m = matchPath(pathOnly, r.path);
      if (m) {
        matched = r;
        params = m;
        break;
      }
    }

    if (!matched) {
      await mountNotFound(pathOnly, queryObj);
      return;
    }

    const ctx = {
      path: pathOnly,
      params,
      query: queryObj,
      meta: matched.meta,
      navigate,
      router: api,
    };

    // Run beforeEach hooks (can redirect)
    for (const hook of beforeHooks) {
      const res = await Promise.resolve(hook(ctx));
      if (res === false) return; // canceled
      if (typeof res === 'string') {
        navigate(res, { replace: true });
        return;
      }
    }

    // Guard per-route (can redirect)
    if (isFn(matched.guard)) {
      const ok = await Promise.resolve(matched.guard(ctx));
      if (ok === false) return;
      if (typeof ok === 'string') {
        navigate(ok, { replace: true });
        return;
      }
    }

    // Mount route
    await mountRoute(matched, ctx);

    // Run afterEach
    for (const hook of afterHooks) {
      await Promise.resolve(hook(ctx));
    }

    // Emit event
    try {
      window.dispatchEvent(new CustomEvent(ROUTE_CHANGED, { detail: ctx }));
    } catch { /* ignore */ }
  }

  async function mountRoute(route, ctx) {
    // Skip re-mounting same path (but update query/params in state)
    if (samePath(state.mounted.path || '', ctx.path)) {
      state.current = ctx.path;
      state.params = ctx.params;
      state.query = ctx.query;
      state.meta = route.meta || {};
      return;
    }

    // Unmount previous
    await safeUnmount();

    state.current = ctx.path;
    state.params = ctx.params;
    state.query = ctx.query;
    state.meta = route.meta || {};

    // Decide how to mount: route.mount or route.load (dynamic import)
    let unmount = null;

    if (isFn(route.mount)) {
      const res = await Promise.resolve(route.mount(root, ctx));
      unmount = isFn(res) ? res : route.unmount || null;
    } else if (isFn(route.load)) {
      try {
        const mod = await route.load();
        // export shapes:
        // - default(root, ctx) -> unmount
        // - default(ctx) -> unmount
        // - mount(root, ctx) -> unmount
        // - render(root, ctx) + optional unmount
        let ret = null;
        if (isFn(mod.default)) {
          ret = mod.default.length >= 2 ? mod.default(root, ctx) : mod.default(ctx);
        } else if (isFn(mod.mount)) {
          ret = mod.mount(root, ctx);
        } else if (isFn(mod.render)) {
          ret = mod.render(root, ctx);
        } else if (root) {
          root.innerHTML = defaultPageHTML(ctx.path);
        }
        unmount = isFn(ret) ? ret : mod.unmount || route.unmount || null;
        state.mounted.mod = mod;
      } catch (e) {
        if (root) renderError(root, e, ctx.path);
      }
    } else if (root) {
      root.innerHTML = defaultPageHTML(ctx.path);
    }

    state.mounted.unmount = isFn(unmount) ? unmount : null;
    state.mounted.path = ctx.path;
  }

  async function safeUnmount() {
    try {
      if (isFn(state.mounted.unmount)) {
        await Promise.resolve(state.mounted.unmount());
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[Router] unmount error:', e);
    } finally {
      state.mounted.unmount = null;
      state.mounted.mod = null;
      state.mounted.path = null;
    }
  }

  async function mountNotFound(path, queryObj) {
    await safeUnmount();
    state.current = path;
    state.params = {};
    state.query = queryObj;
    state.meta = {};
    if (isFn(notFound)) {
      await Promise.resolve(notFound(root, { path, query: queryObj, navigate }));
    } else if (root) {
      root.innerHTML = `
        <div class="container p-6">
          <div class="page-header"><div class="page-title">یافت نشد</div></div>
          <div class="empty">
            <div class="title">صفحه مورد نظر یافت نشد</div>
            <div class="subtitle">مسیر: <code class="kbd">${path}</code></div>
            <div class="mt-4"><a class="btn" href="#/dashboard">بازگشت به داشبورد</a></div>
          </div>
        </div>
      `;
    }
  }

  return api;
}

// ----------------------------------------------------------------------
// Default renderers (fallbacks)
// ----------------------------------------------------------------------

function defaultNotFound(root, ctx) {
  if (!root) return;
  root.innerHTML = `
    <div class="container p-6">
      <div class="page-header"><div class="page-title">یافت نشد</div></div>
      <div class="empty">
        <div class="title">صفحه مورد نظر یافت نشد</div>
        <div class="subtitle">مسیر: <code class="kbd">${ctx?.path || ''}</code></div>
        <div class="mt-4"><a class="btn" href="#/dashboard">بازگشت به داشبورد</a></div>
      </div>
    </div>
  `;
}

function defaultPageHTML(path) {
  return `
    <div class="container p-6">
      <div class="page-header"><div class="page-title">صفحه</div></div>
      <div class="card card-body">
        <p>این مسیر هنوز پیاده‌سازی نشده است: <code class="kbd">${path}</code></p>
      </div>
    </div>
  `;
}

function renderError(root, err, path) {
  root.innerHTML = `
    <div class="container p-6">
      <div class="page-header"><div class="page-title">خطا</div></div>
      <div class="card">
        <div class="card-body">
          <p class="mb-3">خطایی در بارگذاری صفحه رخ داد (${path}):</p>
          <pre class="code" style="white-space:pre-wrap">${(err && (err.stack || err.message)) || err}</pre>
        </div>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------
// Named helpers (optional consumers)
// ----------------------------------------------------------------------

export const navigate = (to, opts) => {
  const target = ensureHash(to || '#/');
  if (opts?.replace) {
    history.replaceState(null, '', target);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = target;
  }
};