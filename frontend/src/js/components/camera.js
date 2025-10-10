// ======================================================================
// Zarmind Camera Component (AI Scale Reader)
// - Vanilla JS component to access camera, capture image, and call OCR
// - Supports: back/front camera, file upload, paste image, torch (if supported)
// - Renders a scanner overlay + shows extracted weight and confidence
// - Integrates with backend /api/ai/scale-read (JSON base64 or multipart)
// ======================================================================

import { API, WEIGHT_UNITS, LABELS_FA } from "../utils/constants.js";
import {
  apiFetch,
  toPersianDigits,
  toEnglishDigits,
  formatWeight,
  toast,
  formatError,
  createEl,
  qs,
  on,
} from "../utils/helpers.js";

// ----------------------------------------------------------------------
// Defaults
// ----------------------------------------------------------------------

const DEFAULTS = {
  expectedUnit: WEIGHT_UNITS.GRAM,
  convertTo: WEIGHT_UNITS.GRAM,
  requireDecimal: false,
  preprocessingOptions: {
    resize: true,
    grayscale: true,
    denoise: true,
    contrast: true,
    sharpen: true,
    threshold: true,
  },
  // If provided, the component fills this input with the extracted weight (raw number)
  fillInput: null, // CSS selector | HTMLElement
  fillDigits: "en", // 'en' | 'fa'
  onResult: null, // (result) => {}
  autoStart: true,
  preferBackCamera: true,
};

// ----------------------------------------------------------------------
// Component factory
// ----------------------------------------------------------------------

export default function mountCamera(root, options = {}) {
  const cfg = { ...DEFAULTS, ...options };

  // Root container
  const container = root || document.createElement("div");
  container.classList.add("camera");
  container.innerHTML = "";

  // UI
  const ui = buildUI();
  container.appendChild(ui.wrapper);

  let stream = null;
  let videoTrack = null;
  let devices = [];
  let currentDeviceId = null;
  let torchOn = false;
  let videoReady = false;

  // Bindings
  const $ = (sel) => container.querySelector(sel);

  // Controls
  const el = {
    video: $(".camera-video"),
    canvas: $(".camera-canvas"),
    overlay: $(".camera-overlay"),
    scanBox: $(".scan-box"),
    btnCapture: $(".btn-capture"),
    btnSwitch: $(".btn-switch"),
    btnTorch: $(".btn-torch"),
    btnUpload: $(".btn-upload"),
    fileInput: $(".file-input"),
    pasteHint: $(".paste-hint"),
    resultBox: $(".camera-result"),
    resultWeight: $(".result-weight"),
    resultMeta: $(".result-meta"),
    resultImg: $(".result-img"),
    resultCopy: $(".btn-copy"),
    status: $(".camera-status"),
    unitSelect: $(".unit-select"),
  };

  // Init unit selector (optional)
  Object.entries(LABELS_FA.UNIT).forEach(([key, label]) => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = label;
    if (key === cfg.convertTo) opt.selected = true;
    el.unitSelect.appendChild(opt);
  });

  // Events
  const offCapture = on(el.btnCapture, "click", captureAndRead);
  const offSwitch = on(el.btnSwitch, "click", async () => switchCamera());
  const offTorch = on(el.btnTorch, "click", async () => toggleTorch());
  const offUpload = on(el.btnUpload, "click", () => el.fileInput.click());
  const offFileChange = on(el.fileInput, "change", async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    await readFromFile(e.target.files[0]);
    e.target.value = "";
  });
  const offPaste = on(document, "paste", async (e) => {
    if (!container.isConnected) return;
    const items = (e.clipboardData && e.clipboardData.items) || [];
    for (const item of items) {
      if (item.type && item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) await readFromFile(file);
        break;
      }
    }
  });
  const offCopy = on(el.resultCopy, "click", async () =>
    copyResultToClipboard()
  );

  // Auto start
  if (cfg.autoStart) {
    start().catch((err) => {
      setStatus(
        'خطا در دسترسی به دوربین. لطفاً مجوز را بررسی کنید یا از "بارگذاری تصویر" استفاده کنید.',
        "error"
      );
      console.error("[Camera] start error:", err);
    });
  }

  // Return API
  return {
    el: container,
    start,
    stop,
    switchCamera,
    captureAndRead,
    destroy: () => {
      try {
        offCapture && offCapture();
        offSwitch && offSwitch();
        offTorch && offTorch();
        offUpload && offUpload();
        offFileChange && offFileChange();
        offPaste && offPaste();
        offCopy && offCopy();
      } catch {}
      stop();
      try {
        container.innerHTML = "";
      } catch {}
    },
  };

  // ------------------------------------------------------------------
  // UI builder
  // ------------------------------------------------------------------

  function buildUI() {
    const wrapper = createEl("div", { className: "" });
    wrapper.innerHTML = `
      <div class="camera-view">
        <video class="camera-video" autoplay playsinline muted></video>
        <div class="camera-overlay">
          <div class="scan-box" aria-hidden="true"></div>
        </div>
        <canvas class="camera-canvas" style="display:none;"></canvas>
      </div>

      <div class="camera-controls">
        <button class="icon-btn btn-switch" title="تغییر دوربین" aria-label="تغییر دوربین">🔄</button>
        <button class="capture-btn btn-capture" title="عکس‌برداری" aria-label="عکس‌برداری"></button>
        <button class="icon-btn btn-upload" title="بارگذاری تصویر" aria-label="بارگذاری تصویر">📁</button>
        <button class="icon-btn btn-torch" title="چراغ قوه" aria-label="چراغ قوه">🔦</button>
        <input class="file-input" type="file" accept="image/*" hidden />
      </div>

      <div class="p-4 text-sm muted paste-hint" style="text-align:center;">
        می‌توانید تصویر را جای‌گذاری (Paste) کنید یا فایل بارگذاری کنید.
      </div>

      <div class="camera-result" style="display:none;">
        <div>
          <div class="text-sm muted">وزن تشخیص داده‌شده</div>
          <div class="result-weight" style="font-weight:900;font-size:24px;"></div>
          <div class="result-meta text-sm" style="color:var(--text-muted);"></div>
          <div class="mt-3">
            <label class="label">واحد خروجی</label>
            <select class="field unit-select" style="min-width:160px;"></select>
          </div>
        </div>
        <div style="display:grid;gap:6px;justify-items:end">
          <img class="result-img" alt="processed" style="max-width:160px;border:1px solid var(--border);border-radius:8px;display:none;" />
          <button class="btn ghost btn-copy">کپی</button>
        </div>
      </div>

      <div class="mt-3 camera-status text-sm" style="color:var(--text-muted);"></div>
    `;
    return { wrapper };
  }

  // ------------------------------------------------------------------
  // Camera logic
  // ------------------------------------------------------------------

  async function listCameras() {
    const list = await navigator.mediaDevices.enumerateDevices();
    return list.filter((d) => d.kind === "videoinput");
  }

  async function pickDefaultCamera() {
    devices = await listCameras();
    if (devices.length === 0) return null;

    if (cfg.preferBackCamera) {
      // Try to find back-facing
      const back = devices.find((d) => /back|rear|environment/i.test(d.label));
      if (back) return back.deviceId;
    }
    return devices[0].deviceId;
  }

  async function start(deviceId) {
    stop();
    setStatus("در حال راه‌اندازی دوربین…");

    try {
      // Try constraints with facingMode (for mobile)
      const constraints = deviceId
        ? { video: { deviceId: { exact: deviceId } }, audio: false }
        : {
            video: {
              facingMode: cfg.preferBackCamera
                ? { ideal: "environment" }
                : "user",
            },
            audio: false,
          };

      const s = await navigator.mediaDevices.getUserMedia(constraints);
      stream = s;
      el.video.srcObject = stream;

      videoTrack = stream.getVideoTracks()[0] || null;
      currentDeviceId = videoTrack?.getSettings()?.deviceId || deviceId || null;
      videoReady = false;

      await new Promise((res) => {
        el.video.onloadedmetadata = () => {
          el.video
            .play()
            .then(() => {
              videoReady = true;
              setStatus(
                "دوربین آماده است. روی دکمه برای عکس‌برداری کلیک کنید."
              );
            })
            .catch(() => res());
          res();
        };
      });

      // Torch availability
      updateTorchButton();
      // update switch availability
      el.btnSwitch.disabled = devices.length < 2;

      // Pre-enumerate if not yet
      if (!devices.length) devices = await listCameras();
    } catch (err) {
      console.error("[Camera] getUserMedia error", err);
      setStatus(
        "عدم دسترسی به دوربین. از بارگذاری تصویر استفاده کنید.",
        "error"
      );
      throw err;
    }
  }

  function stop() {
    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {}
    stream = null;
    videoTrack = null;
    torchOn = false;
  }

  async function switchCamera() {
    try {
      if (!devices.length) devices = await listCameras();
      if (!devices.length) {
        toast("هیچ دوربینی یافت نشد", { type: "warn" });
        return;
      }
      // Find next device
      const idx = devices.findIndex((d) => d.deviceId === currentDeviceId);
      const next = devices[(idx + 1) % devices.length];
      await start(next.deviceId);
      toast("دوربین تغییر کرد");
    } catch (err) {
      toast("امکان تغییر دوربین نیست", { type: "warn" });
    }
  }

  function updateTorchButton() {
    try {
      const caps = videoTrack?.getCapabilities?.();
      const canTorch = !!caps?.torch;
      el.btnTorch.disabled = !canTorch;
      el.btnTorch.classList.toggle("opacity-50", !canTorch);
    } catch {
      el.btnTorch.disabled = true;
      el.btnTorch.classList.add("opacity-50");
    }
  }

  async function toggleTorch() {
    if (!videoTrack) return;
    try {
      const caps = videoTrack.getCapabilities?.();
      if (!caps?.torch) return;
      torchOn = !torchOn;
      await videoTrack.applyConstraints({ advanced: [{ torch: torchOn }] });
      el.btnTorch.textContent = torchOn ? "💡" : "🔦";
    } catch (err) {
      console.warn("[Camera] torch error", err);
      toast("امکان استفاده از چراغ قوه نیست", { type: "warn" });
    }
  }

  // ------------------------------------------------------------------
  // Capture & OCR
  // ------------------------------------------------------------------

  async function captureAndRead() {
    if (!videoReady && !stream) {
      toast("دوربین آماده نیست", { type: "warn" });
      return;
    }

    try {
      setStatus("در حال پردازش تصویر…");
      const dataUrl = await captureFrameAsDataURL(el.video);
      const result = await callOCR({ image: dataUrl, type: "base64" });
      showResult(result);
      setStatus(
        result.success
          ? "استخراج وزن انجام شد"
          : "نتوانستیم وزن را استخراج کنیم",
        result.success ? "ok" : "warn"
      );
    } catch (err) {
      console.error("[Camera] capture error", err);
      toast(formatError(err, "خطا در پردازش تصویر"), { type: "error" });
      setStatus("خطا در پردازش تصویر", "error");
    }
  }

  async function readFromFile(file) {
    try {
      setStatus("در حال پردازش تصویر…");
      const result = await uploadFileOCR(file);
      showResult(result);
      setStatus(
        result.success
          ? "استخراج وزن انجام شد"
          : "نتوانستیم وزن را استخراج کنیم",
        result.success ? "ok" : "warn"
      );
    } catch (err) {
      toast(formatError(err, "خطا در پردازش فایل"), { type: "error" });
      setStatus("خطا در پردازش فایل", "error");
    }
  }

  function showResult(result) {
    el.resultBox.style.display = "grid";

    if (result?.weight) {
      const unit = result.unit || cfg.convertTo || WEIGHT_UNITS.GRAM;
      el.resultWeight.textContent = toPersianDigits(
        formatWeight(result.weight, unit)
      );
    } else {
      el.resultWeight.textContent = "—";
    }

    const conf =
      typeof result?.confidence === "number"
        ? Math.round(result.confidence * 100)
        : null;
    const rawText = (result?.rawText || "").trim();
    el.resultMeta.innerHTML = `${conf !== null ? `اعتماد: ${toPersianDigits(conf)}٪` : ""}${rawText ? ` · متن: <span class="ltr">${rawText}</span>` : ""}`;

    if (result?.processedImageUrl) {
      el.resultImg.src = result.processedImageUrl;
      el.resultImg.style.display = "";
    } else {
      el.resultImg.style.display = "none";
    }

    // Fill external input if provided
    tryFillInput(result?.weight);

    // Callback
    if (typeof cfg.onResult === "function") {
      try {
        cfg.onResult(result);
      } catch {}
    }
  }

  async function copyResultToClipboard() {
    const text = (el.resultWeight.textContent || "").trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(toEnglishDigits(text));
      toast("وزن کپی شد", { type: "success" });
    } catch {
      toast("عدم دسترسی برای کپی", { type: "warn" });
    }
  }

  function tryFillInput(weight) {
    if (!weight && weight !== 0) return;
    let input = null;
    if (typeof cfg.fillInput === "string")
      input = document.querySelector(cfg.fillInput);
    else if (cfg.fillInput instanceof HTMLElement) input = cfg.fillInput;

    if (input) {
      const value =
        cfg.fillDigits === "fa" ? toPersianDigits(weight) : String(weight);
      input.value = value;
      try {
        input.dispatchEvent(new Event("input", { bubbles: true }));
      } catch {}
      try {
        input.focus();
      } catch {}
    }
  }

  // ------------------------------------------------------------------
  // Backend calls
  // ------------------------------------------------------------------

  async function callOCR({ image, type = "base64" }) {
    const body = {
      image,
      imageType: type,
      preprocessingOptions: cfg.preprocessingOptions,
      expectedUnit: cfg.expectedUnit,
      convertTo: el.unitSelect?.value || cfg.convertTo,
      requireDecimal: !!cfg.requireDecimal,
    };
    const res = await apiFetch(API.AI.SCALE_READ, { method: "POST", body });
    return res?.data || res;
  }

  async function uploadFileOCR(file) {
    const fd = new FormData();
    fd.append("image", file);
    // Attach options
    fd.append("expectedUnit", cfg.expectedUnit);
    fd.append("convertTo", el.unitSelect?.value || cfg.convertTo);
    fd.append("requireDecimal", String(!!cfg.requireDecimal));
    // preprocessingOptions can be sent as JSON string
    fd.append(
      "preprocessingOptions",
      JSON.stringify(cfg.preprocessingOptions || {})
    );

    const res = await apiFetch(API.AI.SCALE_READ, {
      method: "POST",
      json: false,
      body: fd,
    });
    return res?.data || res;
  }

  // ------------------------------------------------------------------
  // Utilities
  // ------------------------------------------------------------------

  async function captureFrameAsDataURL(video) {
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    el.canvas.width = w;
    el.canvas.height = h;
    const ctx = el.canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);
    // Prefer jpeg for size
    return el.canvas.toDataURL("image/jpeg", 0.9);
  }

  function setStatus(text, kind) {
    el.status.textContent = text || "";
    el.status.style.color =
      kind === "error"
        ? "var(--danger)"
        : kind === "warn"
          ? "var(--warning)"
          : kind === "ok"
            ? "var(--success)"
            : "var(--text-muted)";
  }
}
