// ======================================================================
// Zarmind Navbar Component (Vanilla JS)
// - Renders top navigation bar (brand, search, actions, user menu)
// - Handles theme toggle, sidebar toggle, user dropdown, logout
// - Updates on auth events
// ======================================================================

import {
  APP,
  ROUTES,
  EVENTS,
  STORAGE_KEYS,
  THEMES,
  PLACEHOLDERS,
} from "../utils/constants.js";

import {
  qs,
  on,
  delegate,
  storage,
  applyTheme,
  toPersianDigits,
  emit,
  onEvent,
} from "../utils/helpers.js";

const SELECTORS = {
  DROPDOWN_TOGGLE: ".dropdown-toggle",
  DROPDOWN_MENU: ".dropdown-menu",
  THEME_TOGGLE: ".theme-toggle",
  SIDEBAR_TOGGLE: ".sidebar-toggle",
  SEARCH_FORM: ".navbar-search",
  SEARCH_INPUT: '.navbar-search input[type="search"]',
  USER_NAME: ".user-name",
  USER_AVATAR: ".user-avatar",
  HEADER_USER: "#header-user",
};

const EVENTS_UI = {
  TOGGLE_SIDEBAR: "ui:toggle-sidebar",
};

function getNextTheme(current) {
  // Cycle dark <-> light (you can switch to auto if you like)
  return current === "dark" ? "light" : "dark";
}

function getCurrentTheme() {
  return storage.get(STORAGE_KEYS.THEME) || "dark";
}

function setThemeButtonIcon(btn, theme) {
  if (!btn) return;
  // Moon for dark, Sun for light
  btn.textContent = theme === "dark" ? "🌙" : "☀️";
  btn.setAttribute("title", theme === "dark" ? "تم تیره" : "تم روشن");
}

function userAvatar(user) {
  return user?.avatar || PLACEHOLDERS.AVATAR;
}

function userName(user) {
  return user?.full_name || user?.username || "کاربر";
}

function navHTML(user) {
  const theme = getCurrentTheme();

  return `
    <div class="navbar">
      <button class="icon-btn sidebar-toggle" aria-label="باز کردن منو">
        ☰
      </button>

      <div class="navbar-brand">
        <img src="${APP.LOGO}" alt="${APP.NAME}" />
        <span>${APP.NAME}</span>
      </div>

      <form class="navbar-search" role="search" aria-label="جستجو">
        <div class="field">
          <input type="search" placeholder="جستجو در محصولات، مشتریان، فاکتورها…" aria-label="جستجو" />
        </div>
      </form>

      <div class="navbar-actions">
        <button class="icon-btn theme-toggle" aria-label="تغییر تم" title="تغییر تم"></button>

        <div class="dropdown user-menu">
          <button class="dropdown-toggle field" aria-haspopup="true" aria-expanded="false">
            <img class="avatar user-avatar" src="${userAvatar(user)}" alt="آواتار" />
            <span class="user-name">${userName(user)}</span>
          </button>
          <div class="dropdown-menu" role="menu">
            <div class="dropdown-item" data-action="profile">پروفایل</div>
            <div class="dropdown-item" data-action="settings">تنظیمات</div>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item" data-action="logout">خروج</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateHeaderUserText(user) {
  const el = qs(SELECTORS.HEADER_USER);
  if (!el) return;
  el.textContent = user?.full_name ? `سلام، ${user.full_name}` : "خوش آمدید";
}

// Mount component
export default function mountNavbar(root, ctx = {}) {
  const container = root || qs("header") || document.body;
  container.innerHTML = navHTML(ctx.user);

  const btnTheme = qs(SELECTORS.THEME_TOGGLE, container);
  setThemeButtonIcon(btnTheme, getCurrentTheme());

  // Update #header-user (global header placeholder)
  updateHeaderUserText(ctx.user);

  // ------------------ Event handlers ------------------

  // Sidebar toggle (mobile)
  const offSidebarToggle = on(
    qs(SELECTORS.SIDEBAR_TOGGLE, container),
    "click",
    () => {
      emit(EVENTS_UI.TOGGLE_SIDEBAR);
      // Optional: toggle a class on body if you implement a drawer
      document.body.classList.toggle("drawer-open");
    }
  );

  // Theme toggle
  const offTheme = on(btnTheme, "click", () => {
    const next = getNextTheme(getCurrentTheme());
    applyTheme(next);
    setThemeButtonIcon(btnTheme, next);
  });

  // Search submit (simple redirect to inventory advanced with search param)
  const searchForm = qs(SELECTORS.SEARCH_FORM, container);
  const offSearch = on(searchForm, "submit", (e) => {
    e.preventDefault();
    const input = qs(SELECTORS.SEARCH_INPUT, container);
    const q = (input?.value || "").trim();
    if (!q) return;
    // Navigate to Inventory advanced search with ?search=
    if (typeof ctx.navigate === "function") {
      ctx.navigate(ROUTES.INVENTORY + `?search=${encodeURIComponent(q)}`);
    } else {
      location.hash = ROUTES.INVENTORY + `?search=${encodeURIComponent(q)}`;
    }
  });

  // User dropdown open/close
  const dropdown = container.querySelector(".dropdown.user-menu");
  const toggle = qs(SELECTORS.DROPDOWN_TOGGLE, dropdown);
  const menu = qs(SELECTORS.DROPDOWN_MENU, dropdown);

  const offDropdownToggle = on(toggle, "click", (e) => {
    e.preventDefault();
    dropdown.classList.toggle("open");
    const expanded = dropdown.classList.contains("open");
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
  });

  // Close dropdown on outside click
  const offDocClick = on(document, "click", (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Dropdown actions
  const offDropdownActions = delegate(
    menu,
    "click",
    ".dropdown-item",
    async (e, item) => {
      const action = item.getAttribute("data-action");
      switch (action) {
        case "profile":
          if (typeof ctx.navigate === "function") ctx.navigate(ROUTES.SETTINGS);
          else location.hash = ROUTES.SETTINGS;
          break;
        case "settings":
          if (typeof ctx.navigate === "function") ctx.navigate(ROUTES.SETTINGS);
          else location.hash = ROUTES.SETTINGS;
          break;
        case "logout":
          if (ctx.auth?.signOut) await ctx.auth.signOut();
          break;
        default:
          break;
      }
    }
  );

  // Listen to auth changes to update avatar/name
  const offLogin = onEvent(EVENTS.AUTH_LOGIN, (user) => {
    const nameEl = qs(SELECTORS.USER_NAME, container);
    const avatarEl = qs(SELECTORS.USER_AVATAR, container);
    if (nameEl) nameEl.textContent = userName(user);
    if (avatarEl) avatarEl.src = userAvatar(user);
    updateHeaderUserText(user);
  });
  const offLogout = onEvent(EVENTS.AUTH_LOGOUT, () => {
    const nameEl = qs(SELECTORS.USER_NAME, container);
    const avatarEl = qs(SELECTORS.USER_AVATAR, container);
    if (nameEl) nameEl.textContent = userName(null);
    if (avatarEl) avatarEl.src = userAvatar(null);
    updateHeaderUserText(null);
  });

  // Keyboard shortcuts (optional): Ctrl/Cmd+K focus search
  const offKeydown = on(document, "keydown", (e) => {
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (mod && e.key.toLowerCase() === "k") {
      e.preventDefault();
      qs(SELECTORS.SEARCH_INPUT, container)?.focus();
    }
  });

  // Return unmount
  return function unmount() {
    try {
      offSidebarToggle && offSidebarToggle();
      offTheme && offTheme();
      offSearch && offSearch();
      offDropdownToggle && offDropdownToggle();
      offDocClick && offDocClick();
      offDropdownActions && offDropdownActions();
      offLogin && offLogin();
      offLogout && offLogout();
      offKeydown && offKeydown();
    } catch {}
  };
}

// Named export for flexibility
export const Navbar = { mount: mountNavbar };
