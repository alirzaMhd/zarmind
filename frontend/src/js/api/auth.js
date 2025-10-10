// ======================================================================
// Zarmind Auth API (frontend)
// - Handles authentication requests and token storage
// - Exposes login/register/logout/me/refresh/updateProfile/updateAvatar
// - Auto-refreshes access token on 401 (once per request)
// ======================================================================

import { API, EVENTS, STORAGE_KEYS } from "../utils/constants.js";

import {
  api,
  apiFetch,
  storage,
  emit,
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  clearTokens,
  formatError,
} from "../utils/helpers.js";

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

function extractAuthData(res) {
  // Accept both wrapped { success, data: { user, accessToken, refreshToken } }
  // and plain { user, accessToken, refreshToken }
  const payload = res?.data || res || {};
  return {
    user: payload.user || null,
    accessToken: payload.accessToken || null,
    refreshToken: payload.refreshToken || null,
  };
}

function persistTokens({ accessToken, refreshToken }) {
  if (accessToken) setAccessToken(accessToken);
  if (refreshToken) setRefreshToken(refreshToken);
}

function persistUser(user) {
  if (user) storage.setJSON(STORAGE_KEYS.USER, user);
}

async function fetchWithRefresh(path, opts = {}) {
  try {
    return await apiFetch(path, opts);
  } catch (err) {
    // Retry once on 401 with refresh token
    if (err && err.status === 401) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // retry with same options
        return await apiFetch(path, opts);
      }
    }
    throw err;
  }
}

async function tryRefreshToken() {
  const refreshToken = storage.get(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) return false;

  try {
    const res = await api.post(API.AUTH.REFRESH, { refreshToken });
    const { accessToken: at, refreshToken: rt } = extractAuthData(res);
    if (at) setAccessToken(at);
    if (rt) setRefreshToken(rt);
    return !!at;
  } catch {
    // clear and signal logout state
    clearTokens();
    storage.remove(STORAGE_KEYS.USER);
    emit(EVENTS.AUTH_LOGOUT);
    return false;
  }
}

// ----------------------------------------------------------------------
// API methods
// ----------------------------------------------------------------------

/**
 * Login with username/password
 */
export async function login({ username, password, rememberMe = true }) {
  const res = await api.post(API.AUTH.LOGIN, {
    username,
    password,
    rememberMe,
  });
  const { user, accessToken, refreshToken } = extractAuthData(res);
  persistTokens({ accessToken, refreshToken });
  persistUser(user);
  emit(EVENTS.AUTH_LOGIN, user);
  return user;
}

/**
 * Login with email/password
 */
export async function loginWithEmail({ email, password, rememberMe = true }) {
  const res = await api.post(API.AUTH.LOGIN_EMAIL, {
    email,
    password,
    rememberMe,
  });
  const { user, accessToken, refreshToken } = extractAuthData(res);
  persistTokens({ accessToken, refreshToken });
  persistUser(user);
  emit(EVENTS.AUTH_LOGIN, user);
  return user;
}

/**
 * Register new user, auto-login on success
 */
export async function register(form) {
  const res = await api.post(API.AUTH.REGISTER, form);
  const { user, accessToken, refreshToken } = extractAuthData(res);
  persistTokens({ accessToken, refreshToken });
  persistUser(user);
  emit(EVENTS.AUTH_LOGIN, user);
  return user;
}

/**
 * Logout (server + local)
 */
export async function logout() {
  try {
    await api.post(API.AUTH.LOGOUT, {});
  } catch {
    // ignore
  } finally {
    clearTokens();
    storage.remove(STORAGE_KEYS.USER);
    emit(EVENTS.AUTH_LOGOUT);
  }
}

/**
 * Get current user profile
 */
export async function me() {
  const res = await fetchWithRefresh(API.AUTH.ME, { method: "GET" });
  const user = res?.data || res || null;
  if (user) {
    persistUser(user);
  }
  return user;
}

/**
 * Refresh access token using refresh token
 */
export async function refresh() {
  const refreshToken = storage.get(STORAGE_KEYS.REFRESH_TOKEN);
  if (!refreshToken) throw new Error("توکن بازیابی موجود نیست");
  const res = await api.post(API.AUTH.REFRESH, { refreshToken });
  const { accessToken: at, refreshToken: rt } = extractAuthData(res);
  persistTokens({ accessToken: at, refreshToken: rt });
  return { accessToken: at, refreshToken: rt };
}

/**
 * Change password (requires current password)
 */
export async function changePassword({
  currentPassword,
  newPassword,
  confirmPassword,
}) {
  const body = { currentPassword, newPassword, confirmPassword };
  const res = await fetchWithRefresh(API.AUTH.CHANGE_PASSWORD, {
    method: "PUT",
    body,
  });
  return res?.data || true;
}

/**
 * Update current user profile
 */
export async function updateProfile(data = {}) {
  const res = await fetchWithRefresh(API.AUTH.ME, {
    method: "PUT",
    body: data,
  });
  const profile = res?.data || res || null;
  if (profile) {
    persistUser(profile);
    emit(EVENTS.AUTH_LOGIN, profile); // update consumers with new profile
  }
  return profile;
}

/**
 * Update avatar (file: Blob/File OR provide URL string)
 */
export async function updateAvatar({ file, avatarUrl }) {
  if (file) {
    const fd = new FormData();
    fd.append("avatar", file);
    const res = await fetchWithRefresh(API.AUTH.ME.replace("/me", "/avatar"), {
      method: "PUT",
      json: false,
      body: fd,
    });
    const profile = res?.data || res || null;
    if (profile) {
      persistUser(profile);
      emit(EVENTS.AUTH_LOGIN, profile);
    }
    return profile;
  }

  if (avatarUrl) {
    const res = await fetchWithRefresh(API.AUTH.ME.replace("/me", "/avatar"), {
      method: "PUT",
      body: { avatar: avatarUrl },
    });
    const profile = res?.data || res || null;
    if (profile) {
      persistUser(profile);
      emit(EVENTS.AUTH_LOGIN, profile);
    }
    return profile;
  }

  throw new Error("فایل یا آدرس تصویر الزامی است");
}

/**
 * Validate token
 */
export async function validateToken(token) {
  const res = await api.post(API.AUTH.VALIDATE, { token });
  return res?.data || res || { valid: false };
}

/**
 * Availability checks
 */
export async function checkUsername(username) {
  const res = await api.get(API.AUTH.CHECK_USERNAME(username));
  return res?.data || res;
}

export async function checkEmail(email) {
  const res = await api.get(API.AUTH.CHECK_EMAIL(email));
  return res?.data || res;
}

export async function checkAvailability({ username, email }) {
  const res = await api.post(API.AUTH.ROOT + "/check-availability", {
    username,
    email,
  });
  return res?.data || res;
}

/**
 * Sessions (active) - list/remove all (logout all devices)
 */
export async function getSessions() {
  const res = await fetchWithRefresh(API.AUTH.ROOT + "/sessions", {
    method: "GET",
  });
  return res?.data || res || [];
}

export async function revokeSessions() {
  const res = await fetchWithRefresh(API.AUTH.ROOT + "/sessions", {
    method: "DELETE",
  });
  // After revoke, also clear local tokens
  clearTokens();
  storage.remove(STORAGE_KEYS.USER);
  emit(EVENTS.AUTH_LOGOUT);
  return res?.data || true;
}

/**
 * Status/Verify
 */
export async function status() {
  const res = await api.get(API.AUTH.ROOT.replace("/auth", "/auth/status"));
  return res?.data || res || {};
}

export async function verify() {
  const res = await fetchWithRefresh(
    API.AUTH.ROOT.replace("/auth", "/auth/verify"),
    { method: "GET" }
  );
  return res?.data || res || { authenticated: false };
}

/**
 * Convenience helpers
 */
export const isAuthenticated = () => !!getAccessToken();
export const getStoredUser = () => storage.getJSON(STORAGE_KEYS.USER, null);

// Default export
export default {
  login,
  loginWithEmail,
  register,
  logout,
  me,
  refresh,
  changePassword,
  updateProfile,
  updateAvatar,
  validateToken,
  checkUsername,
  checkEmail,
  checkAvailability,
  getSessions,
  revokeSessions,
  status,
  verify,
  isAuthenticated,
  getStoredUser,
};
