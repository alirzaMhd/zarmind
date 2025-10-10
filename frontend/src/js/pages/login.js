// ======================================================================
// Zarmind - Login Page
// - Renders the login view (loads src/views/login.html if available)
// - Handles username/email login flows
// - Remembers API base URL override (optional)
// - Uses ctx.auth.signIn if provided by app, otherwise falls back to API
// ======================================================================

import { ROUTES, STORAGE_KEYS } from "../utils/constants.js";
import {
  qs,
  qsa,
  on,
  toast,
  formatError,
  setApiBaseUrl,
  storage,
} from "../utils/helpers.js";

import {
  validateLoginForm,
  validateLoginEmailForm,
  firstError,
} from "../utils/validators.js";

import AuthAPI from "../api/auth.js";

// ----------------------------------------------------------------------
// Template loader (tries multiple paths, falls back to inline)
// ----------------------------------------------------------------------

async function loadTemplate() {
  const candidates = [
    // when copied by build: public/views/login.html
    "/views/login.html",
    "./views/login.html",
    // when running from src modules
    "../views/login.html",
    "../../src/views/login.html",
  ];
  for (const href of candidates) {
    try {
      const res = await fetch(href, { cache: "no-cache" });
      if (res.ok) return await res.text();
    } catch {
      // ignore and try next
    }
  }
  // Fallback minimal markup
  return `
    <div class="auth-container">
      <div class="auth-card" role="form" aria-labelledby="login-title">
        <h1 id="login-title" class="auth-title">ورود</h1>
        <div class="btn-group" style="margin-inline:auto;">
          <button class="btn sm" data-login-method="username" aria-pressed="true">نام کاربری</button>
          <button class="btn sm ghost" data-login-method="email" aria-pressed="false">ایمیل</button>
        </div>
        <div id="login-message" class="text-sm muted" aria-live="polite"></div>
        <div class="form-group" data-field="username">
          <label class="label" for="login-username">نام کاربری</label>
          <div class="field"><input id="login-username" type="text" placeholder="نام کاربری" autocomplete="username" /></div>
        </div>
        <div class="form-group hidden" data-field="email">
          <label class="label" for="login-email">ایمیل</label>
          <div class="field"><input id="login-email" class="ltr" type="email" placeholder="example@mail.com" autocomplete="email" /></div>
        </div>
        <div class="form-group">
          <label class="label" for="login-password">رمز عبور</label>
          <div class="field"><input id="login-password" type="password" placeholder="رمز عبور" autocomplete="current-password" /></div>
        </div>
        <div class="flex items-center justify-between mt-2">
          <label class="checkbox"><input id="login-remember" type="checkbox" checked /><span class="box"></span><span>مرا به خاطر بسپار</span></label>
          <a href="#" class="link" id="login-forgot">فراموشی رمز عبور</a>
        </div>
        <button class="btn success mt-4" id="login-submit" type="button" style="inline-size:100%;">ورود</button>
        <details class="accordion mt-2">
          <summary>تنظیم آدرس API (اختیاری)</summary>
          <div class="content">
            <div class="field"><input id="api-base-url" class="ltr" type="text" placeholder="http://localhost:3000/api" /></div>
            <div class="mt-2 flex justify-between"><button class="btn sm" id="api-save">ذخیره</button><button class="btn sm ghost" id="api-reset">بازگردانی</button></div>
          </div>
        </details>
      </div>
    </div>
  `;
}

// ----------------------------------------------------------------------
// Page mount
// ----------------------------------------------------------------------

export default async function mountLogin(root, ctx = {}) {
  // Render template
  const html = await loadTemplate();
  root.innerHTML = html;

  // Elements
  const el = {
    methodButtons: qsa("[data-login-method]", root),
    message: qs("#login-message", root),
    userField: qs('[data-field="username"]', root),
    emailField: qs('[data-field="email"]', root),
    username: qs("#login-username", root),
    email: qs("#login-email", root),
    password: qs("#login-password", root),
    remember: qs("#login-remember", root),
    submit: qs("#login-submit", root),
    forgot: qs("#login-forgot", root),
    apiInput: qs("#api-base-url", root),
    apiSave: qs("#api-save", root),
    apiReset: qs("#api-reset", root),
  };

  // State
  let method = "username"; // 'username' | 'email'
  const offs = [];

  // Prefill API base if stored
  try {
    const savedApi = storage.get(STORAGE_KEYS.API_BASE_URL);
    if (savedApi && el.apiInput) el.apiInput.value = savedApi;
  } catch {}

  // Helpers
  const showMsg = (text = "", kind = "muted") => {
    if (!el.message) return;
    el.message.textContent = text;
    el.message.style.color =
      kind === "error"
        ? "var(--danger)"
        : kind === "ok"
          ? "var(--success)"
          : "var(--text-muted)";
  };

  const toggleMethodUI = () => {
    const isEmail = method === "email";
    el.userField?.classList.toggle("hidden", isEmail);
    el.emailField?.classList.toggle("hidden", !isEmail);
    el.methodButtons.forEach((b) => {
      const active = b.getAttribute("data-login-method") === method;
      b.classList.toggle("ghost", !active);
      b.setAttribute("aria-pressed", active ? "true" : "false");
    });
    setTimeout(() => (isEmail ? el.email?.focus() : el.username?.focus()), 0);
  };

  // Switch login method
  el.methodButtons.forEach((btn) => {
    offs.push(
      on(btn, "click", (e) => {
        e.preventDefault();
        method =
          btn.getAttribute("data-login-method") === "email"
            ? "email"
            : "username";
        toggleMethodUI();
        showMsg("");
      })
    );
  });

  // Submit
  offs.push(on(el.submit, "click", doLogin));
  // Enter key on inputs
  [el.username, el.email, el.password].forEach((inp) => {
    if (!inp) return;
    offs.push(
      on(inp, "keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          doLogin();
        }
      })
    );
  });

  // Forgot
  if (el.forgot) {
    offs.push(
      on(el.forgot, "click", (e) => {
        e.preventDefault();
        toast("لطفاً از مدیر سیستم بخواهید رمز شما را بازیابی کند", {
          type: "info",
        });
      })
    );
  }

  // API Base URL actions
  if (el.apiSave) {
    offs.push(
      on(el.apiSave, "click", (e) => {
        e.preventDefault();
        const url = (el.apiInput?.value || "").trim();
        if (!url) {
          toast("آدرس API را وارد کنید", { type: "warn" });
          return;
        }
        setApiBaseUrl(url);
        storage.set(STORAGE_KEYS.API_BASE_URL, url);
        toast("آدرس API ذخیره شد", { type: "success" });
      })
    );
  }
  if (el.apiReset) {
    offs.push(
      on(el.apiReset, "click", (e) => {
        e.preventDefault();
        try {
          storage.remove(STORAGE_KEYS.API_BASE_URL);
        } catch {}
        // Do not set if empty (helpers keep default)
        toast("تنظیمات API به حالت پیش‌فرض بازگردانده شد", { type: "success" });
        if (el.apiInput) el.apiInput.value = "";
      })
    );
  }

  // Initial UI
  toggleMethodUI();
  showMsg("لطفاً وارد شوید");

  // -------------- Actions ---------------

  async function doLogin() {
    try {
      el.submit.disabled = true;
      showMsg("در حال ورود…");

      const body = {
        username: (el.username?.value || "").trim(),
        email: (el.email?.value || "").trim(),
        password: (el.password?.value || "").trim(),
        rememberMe: !!el.remember?.checked,
      };

      // Validate
      const v =
        method === "email"
          ? validateLoginEmailForm({
              email: body.email,
              password: body.password,
            })
          : validateLoginForm({
              username: body.username,
              password: body.password,
            });

      if (!v.valid) {
        showMsg(
          firstError(v.errors) || "اطلاعات وارد شده نامعتبر است",
          "error"
        );
        el.submit.disabled = false;
        return;
      }

      // Prefer app's auth pipeline (ctx.auth.signIn) to keep state in sync
      if (ctx?.auth?.signIn) {
        await ctx.auth.signIn({
          username: method === "username" ? body.username : undefined,
          email: method === "email" ? body.email : undefined,
          password: body.password,
          rememberMe: body.rememberMe,
        });
      } else {
        // Fallback to direct API
        if (method === "username") {
          await AuthAPI.login({
            username: body.username,
            password: body.password,
            rememberMe: body.rememberMe,
          });
        } else {
          await AuthAPI.loginWithEmail({
            email: body.email,
            password: body.password,
            rememberMe: body.rememberMe,
          });
        }
      }

      showMsg("ورود موفقیت‌آمیز بود", "ok");
      toast("خوش آمدید", { type: "success" });
      // Navigate to dashboard
      if (typeof ctx.navigate === "function") ctx.navigate(ROUTES.DASHBOARD);
      else location.hash = ROUTES.DASHBOARD;
    } catch (err) {
      showMsg(formatError(err, "خطا در ورود"), "error");
      toast(formatError(err), { type: "error" });
    } finally {
      el.submit.disabled = false;
    }
  }

  // Return unmount
  return function unmount() {
    try {
      offs.forEach((off) => off && off());
    } catch {}
  };
}
