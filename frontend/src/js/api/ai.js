// ======================================================================
// Zarmind AI API (frontend)
// - Handles scale reading (OCR) and product detection
// - Supports JSON base64/url or multipart file upload for images
// ======================================================================

import { API } from "../utils/constants.js";
import { apiFetch } from "../utils/helpers.js";

import AuthAPI from "./auth.js"; // for refresh on 401

// ----------------------------------------------------------------------
// Internal: fetch with 1-time refresh retry
// ----------------------------------------------------------------------

async function fetchWithRefresh(path, opts = {}) {
  try {
    return await apiFetch(path, opts);
  } catch (err) {
    if (err && err.status === 401) {
      const ok = await tryRefreshToken();
      if (ok) return await apiFetch(path, opts);
    }
    throw err;
  }
}

async function tryRefreshToken() {
  try {
    await AuthAPI.refresh();
    return true;
  } catch {
    return false;
  }
}

const unwrap = (res) => res?.data ?? res;

// ----------------------------------------------------------------------
// Scale Reading
// ----------------------------------------------------------------------

/**
 * Read weight from scale image using base64/url.
 * @param {Object} payload
 *  - image: base64 string or URL
 *  - imageType: 'base64' | 'url'
 *  - expectedUnit, convertTo, requireDecimal, preprocessingOptions
 */
export async function readScale(payload) {
  const res = await fetchWithRefresh(API.AI.SCALE_READ, {
    method: "POST",
    body: payload,
  });
  return unwrap(res);
}

/**
 * Read weight from scale image using a File object (multipart upload).
 * @param {Object} payload
 *  - file: File object
 *  - expectedUnit, convertTo, requireDecimal, preprocessingOptions
 */
export async function readScaleFromFile(payload) {
  const {
    file,
    expectedUnit,
    convertTo,
    requireDecimal,
    preprocessingOptions,
  } = payload;

  if (!file) throw new Error("فایل تصویر الزامی است");

  const fd = new FormData();
  fd.append("image", file);
  if (expectedUnit) fd.append("expectedUnit", expectedUnit);
  if (convertTo) fd.append("convertTo", convertTo);
  if (requireDecimal) fd.append("requireDecimal", String(requireDecimal));
  if (preprocessingOptions) {
    fd.append("preprocessingOptions", JSON.stringify(preprocessingOptions));
  }

  const res = await fetchWithRefresh(API.AI.SCALE_READ_UPLOAD, {
    method: "POST",
    json: false, // multipart, not JSON
    body: fd,
  });

  return unwrap(res);
}

// ----------------------------------------------------------------------
// Product Detection (experimental)
// ----------------------------------------------------------------------

/**
 * Detect product from image using base64/url.
 * @param {Object} payload { image, imageType }
 */
export async function detectProduct(payload) {
  const res = await fetchWithRefresh(API.AI.PRODUCT_DETECT, {
    method: "POST",
    body: payload,
  });
  return unwrap(res);
}

/**
 * Detect product from image using a File object (multipart).
 * @param {Object} payload { file }
 */
export async function detectProductFromFile(payload) {
  const { file } = payload;
  if (!file) throw new Error("فایل تصویر الزامی است");

  const fd = new FormData();
  fd.append("image", file);

  const res = await fetchWithRefresh(API.AI.PRODUCT_DETECT, {
    method: "POST",
    json: false,
    body: fd,
  });

  return unwrap(res);
}

// ----------------------------------------------------------------------
// Health
// ----------------------------------------------------------------------

export async function health() {
  const res = await fetchWithRefresh(API.AI.HEALTH, { method: "GET" });
  return unwrap(res);
}

// ----------------------------------------------------------------------
// Default export
// ----------------------------------------------------------------------

export default {
  readScale,
  readScaleFromFile,
  detectProduct,
  detectProductFromFile,
  health,
};
