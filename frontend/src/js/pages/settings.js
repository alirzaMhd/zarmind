// ======================================================================
// Zarmind - Settings Page
// - Handles Profile, Account, Store, UI, Users, and System settings
// - Renders settings view and manages tabs
// - Admin-only tabs are hidden for non-admin users
// ======================================================================

import { ROUTES, EVENTS, THEMES } from "../utils/constants.js";
import {
  qs,
  qsa,
  on,
  delegate,
  toast,
  formatError,
  setApiBaseUrl,
  storage,
  applyTheme,
} from "../utils/helpers.js";
import AuthAPI from "../api/auth.js";
import createTable from "../components/table.js";
import Modal from "../components/modal.js";

// ----------------------------------------------------------------------
// Template loader
// ----------------------------------------------------------------------

async function loadTemplate() {
  const candidates = [
    "/views/settings.html",
    "./views/settings.html",
    "../views/settings.html",
    "../../src/views/settings.html",
  ];
  for (const href of candidates) {
    try {
      const res = await fetch(href, { cache: "no-cache" });
      if (res.ok) return await res.text();
    } catch {}
  }
  return `<div class="container p-6"><div class="card card-body">خطا در بارگذاری قالب تنظیمات</div></div>`;
}

// ----------------------------------------------------------------------
// Page mount
// ----------------------------------------------------------------------

export default async function mountSettings(root, ctx = {}) {
  const html = await loadTemplate();
  root.innerHTML = html;

  // State
  let offs = [];
  let userTable = null;
  const isAdmin = ctx.user?.role === "admin";
  const { user } = ctx;

  // Elements
  const el = {
    // Tabs
    tabs: qs("#settings-tabs", root),
    tabContents: qsa(".tab-content", root),

    // Profile
    formProfile: qs("#form-profile", root),
    profileName: qs("#profile-full-name", root),
    profileUser: qs("#profile-username", root),
    profileEmail: qs("#profile-email", root),
    profilePhone: qs("#profile-phone", root),
    btnProfileSave: qs("#btn-profile-save", root),

    // Account
    formPass: qs("#form-password", root),
    passCurrent: qs("#pass-current", root),
    passNew: qs("#pass-new", root),
    passConfirm: qs("#pass-confirm", root),
    btnPassSave: qs("#btn-password-save", root),

    // UI
    themeButtons: qsa("[data-theme-btn]", root),
    densityButtons: qsa("[data-density-btn]", root),

    // Users (admin)
    tableUsers: qs("#table-users", root),
    btnUserNew: qs("#btn-user-new", root),
  };

  // Hide admin-only tabs
  qsa("[data-admin-only]", root).forEach((node) => {
    if (!isAdmin) node.classList.add("hidden");
  });

  // Wire events
  wireEvents();

  // Initial data
  loadProfileData();
  if (isAdmin) {
    loadUserTable();
  }

  // Set initial UI state
  updateThemeButtons(storage.get("zarmind:theme", "dark"));

  // Return unmount
  return function unmount() {
    try {
      offs.forEach((off) => off && off());
    } catch {}
    try {
      userTable && userTable.destroy();
    } catch {}
  };

  // ------------------------------------------------------------------
  // Events
  // ------------------------------------------------------------------

  function wireEvents() {
    // Tab switching
    if (el.tabs) {
      offs.push(
        on(el.tabs, "click", (e) => {
          const btn = e.target.closest("button.tab");
          if (!btn) return;
          const tabId = btn.getAttribute("data-tab");
          if (!tabId) return;

          qsa(".tab", el.tabs).forEach((t) => t.classList.remove("active"));
          btn.classList.add("active");

          el.tabContents.forEach((c) => {
            c.classList.toggle("hidden", c.id !== `tab-${tabId}`);
          });
        })
      );
    }

    // Profile
    if (el.btnProfileSave) {
      offs.push(
        on(el.btnProfileSave, "click", async () => {
          try {
            const data = {
              full_name: el.profileName.value.trim(),
              email: el.profileEmail.value.trim(),
              phone: el.profilePhone.value.trim(),
            };
            const updated = await AuthAPI.updateProfile(data);
            ctx.setUser(updated); // Update global app state
            toast("پروفایل بروزرسانی شد", { type: "success" });
          } catch (err) {
            toast(formatError(err, "خطا در ذخیره پروفایل"), { type: "error" });
          }
        })
      );
    }

    // Password
    if (el.btnPassSave) {
      offs.push(
        on(el.btnPassSave, "click", async () => {
          const currentPassword = el.passCurrent.value;
          const newPassword = el.passNew.value;
          const confirmPassword = el.passConfirm.value;

          if (!currentPassword || !newPassword || !confirmPassword) {
            return toast("تمام فیلدهای رمز عبور الزامی است", { type: "warn" });
          }
          if (newPassword !== confirmPassword) {
            return toast("تکرار رمز عبور جدید مطابقت ندارد", { type: "warn" });
          }

          try {
            await AuthAPI.changePassword({
              currentPassword,
              newPassword,
              confirmPassword,
            });
            el.formPass.reset();
            toast("رمز عبور با موفقیت تغییر کرد", { type: "success" });
          } catch (err) {
            toast(formatError(err, "خطا در تغییر رمز عبور"), { type: "error" });
          }
        })
      );
    }

    // UI
    el.themeButtons.forEach((btn) => {
      offs.push(
        on(btn, "click", () => {
          const theme = btn.getAttribute("data-theme-btn");
          applyTheme(theme);
          updateThemeButtons(theme);
        })
      );
    });

    // Density (placeholder)
    el.densityButtons.forEach((btn) => {
      offs.push(
        on(btn, "click", () => {
          const density = btn.getAttribute("data-density-btn");
          document.documentElement.setAttribute("data-density", density);
          qsa("[data-density-btn]").forEach((b) =>
            b.classList.toggle(
              "ghost",
              b.getAttribute("data-density-btn") !== density
            )
          );
        })
      );
    });
  }

  // ------------------------------------------------------------------
  // Data loading & rendering
  // ------------------------------------------------------------------

  function loadProfileData() {
    if (!user) return;
    el.profileName.value = user.full_name || "";
    el.profileUser.value = user.username || "";
    el.profileEmail.value = user.email || "";
    el.profilePhone.value = user.phone || "";
  }

  function loadUserTable() {
    if (!isAdmin || !el.tableUsers) return;

    // Placeholder for User API (assuming it exists in a separate file)
    const UserAPI = {
      async list() {
        // Mock or implement API call
        return {
          data: [
            {
              id: "1",
              full_name: "مدیر",
              username: "admin",
              email: "admin@z.com",
              role: "admin",
              is_active: true,
            },
          ],
        };
      },
    };

    const columns = [
      { key: "full_name", header: "نام", sortable: true },
      { key: "username", header: "نام کاربری", sortable: true },
      { key: "email", header: "ایمیل", sortable: true },
      { key: "role", header: "نقش", sortable: true },
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
        label: "ویرایش",
        className: "sm",
        onClick: (row) => Modal.alert(`ویرایش کاربر: ${row.full_name}`),
      },
      {
        label: "حذف",
        className: "sm danger ghost",
        onClick: (row) => Modal.alert(`حذف کاربر: ${row.full_name}`),
      },
    ];

    userTable = createTable(el.tableUsers.closest(".table-wrapper"), {
      columns,
      actions,
      data: async () => {
        try {
          const res = await UserAPI.list();
          return { rows: res.data, total: res.data.length };
        } catch {
          return { rows: [], total: 0 };
        }
      },
    });
  }

  function updateThemeButtons(currentTheme) {
    el.themeButtons.forEach((btn) => {
      btn.classList.toggle(
        "ghost",
        btn.getAttribute("data-theme-btn") !== currentTheme
      );
    });
  }
}
