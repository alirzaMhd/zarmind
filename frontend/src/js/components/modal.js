// ======================================================================
// Zarmind Modal Component (Vanilla JS)
// - Render accessible modal dialogs (alert/confirm/prompt/custom)
// - Promise-based API, supports stacking, focus trap, ESC/backdrop close
// - Uses CSS classes from components.css/main.css (.modal-overlay, .modal, ...)
// ======================================================================

import { createEl, qs, qsa, on, toPersianDigits } from "../utils/helpers.js";

let MODAL_STACK = [];
let COUNTER = 0;

const DEFAULTS = {
  size: "md", // sm | md | lg
  closeOnEsc: true,
  closeOnBackdrop: true,
  destroyOnClose: true,
  showClose: true,
  title: "",
  className: "",
};

const TEXTS = {
  ok: "باشه",
  yes: "تایید",
  no: "انصراف",
  cancel: "انصراف",
  placeholder: "متن را وارد کنید...",
};

// ----------------------------------------------------------------------
// Public API
// ----------------------------------------------------------------------

/**
 * Open a custom modal dialog.
 * @param {Object} opts
 *  - title, html, text, content(Node)
 *  - size: 'sm'|'md'|'lg'
 *  - buttons: [{label, className, action:'confirm'|'cancel'|'custom', value, autofocus, onClick}]
 *  - closeOnEsc, closeOnBackdrop, destroyOnClose, showClose, className
 *  - ariaLabel
 * @returns {Object} { id, el, overlay, close, remove, setContent, update, wait: Promise }
 */
export function openModal(opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  const id = `modal-${++COUNTER}`;
  const titleId = `modal-title-${COUNTER}`;
  const zIndex = 2000 + MODAL_STACK.length * 10;

  // Overlay
  const overlay = createEl("div", {
    className: "modal-overlay open",
    attrs: { "data-modal-id": id, style: `z-index:${zIndex};` },
  });

  // Modal container
  const modal = createEl("div", {
    className: ["modal", cfg.size, cfg.className].filter(Boolean).join(" "),
    attrs: {
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": titleId,
      tabindex: "-1",
      style: `z-index:${zIndex + 1};`,
    },
  });

  // Header
  const header = createEl("div", { className: "modal-header" });
  const titleEl = createEl("div", {
    className: "modal-title",
    attrs: { id: titleId },
    text: cfg.title || "",
  });
  header.appendChild(titleEl);
  let btnClose = null;
  if (cfg.showClose) {
    btnClose = createEl("button", {
      className: "icon-btn modal-close",
      attrs: { "aria-label": "بستن" },
      text: "✕",
    });
    header.appendChild(btnClose);
  }

  // Body
  const body = createEl("div", { className: "modal-body" });
  if (cfg.content instanceof Node) {
    body.appendChild(cfg.content);
  } else if (cfg.html) {
    body.innerHTML = cfg.html;
  } else if (cfg.text) {
    body.textContent = cfg.text;
  }

  // Footer
  const footer = createEl("div", { className: "modal-footer" });
  const buttons = Array.isArray(cfg.buttons) ? cfg.buttons : [];

  if (buttons.length) {
    buttons.forEach((b, idx) => {
      const btn = createEl("button", {
        className: ["btn", b.className].filter(Boolean).join(" "),
        text: b.label ?? TEXTS.ok,
      });
      if (b.autofocus) btn.autofocus = true;
      on(btn, "click", async (e) => {
        try {
          if (typeof b.onClick === "function") {
            const res = await Promise.resolve(
              b.onClick({ event: e, action: b.action, value: b.value, close })
            );
            if (res === false) return; // prevent close
          }
          if (b.action === "cancel") {
            resolveWait({ action: "cancel" });
            close();
          } else if (b.action === "confirm") {
            resolveWait({ action: "confirm", value: b.value });
            close();
          } else {
            resolveWait({ action: b.action || "custom", value: b.value });
            // allow staying open unless onClick closed explicitly
          }
        } catch {
          // ignore
        }
      });
      footer.appendChild(btn);
      if (idx === 0 && !b.autofocus) btn.autofocus = true;
    });
  } else {
    // Default single OK
    const btn = createEl("button", { className: "btn", text: TEXTS.ok });
    btn.autofocus = true;
    on(btn, "click", () => {
      resolveWait({ action: "confirm" });
      close();
    });
    footer.appendChild(btn);
  }

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Track stack
  const stackRecord = {
    id,
    overlay,
    modal,
    resolve: null,
    reject: null,
    cfg,
    prevActive: document.activeElement,
  };
  MODAL_STACK.push(stackRecord);

  // Focus handling
  focusTrapEnable(modal);
  setTimeout(() => {
    tryFocusFirst(modal);
  }, 0);

  // Listeners
  const offBackdrop = on(overlay, "click", (e) => {
    if (!cfg.closeOnBackdrop) return;
    // Close only if clicked outside the modal (overlay)
    if (e.target === overlay) {
      resolveWait({ action: "cancel" });
      close();
    }
  });

  const offEsc = on(document, "keydown", (e) => {
    if (!cfg.closeOnEsc) return;
    if (e.key === "Escape" && isTopModal(id)) {
      e.preventDefault();
      resolveWait({ action: "cancel" });
      close();
    }
  });

  let offCloseBtn = null;
  if (btnClose) {
    offCloseBtn = on(btnClose, "click", () => {
      resolveWait({ action: "cancel" });
      close();
    });
  }

  function cleanup() {
    try {
      offBackdrop && offBackdrop();
      offEsc && offEsc();
      offCloseBtn && offCloseBtn();
      focusTrapDisable(modal);
    } catch {}
  }

  function remove() {
    cleanup();
    try {
      overlay.classList.remove("open");
      overlay.remove();
    } catch {}
  }

  function close(forceRemove = cfg.destroyOnClose) {
    cleanup();
    const idx = MODAL_STACK.findIndex((m) => m.id === id);
    if (idx >= 0) MODAL_STACK.splice(idx, 1);
    // restore focus to previous element (if still in DOM)
    if (
      stackRecord.prevActive &&
      typeof stackRecord.prevActive.focus === "function"
    ) {
      try {
        stackRecord.prevActive.focus();
      } catch {}
    }
    if (forceRemove) remove();
    else overlay.classList.remove("open");
  }

  function setContent({ title, html, text, content } = {}) {
    if (typeof title === "string") titleEl.textContent = title;
    if (content instanceof Node) {
      body.innerHTML = "";
      body.appendChild(content);
    } else if (html) {
      body.innerHTML = html;
    } else if (text) {
      body.textContent = text;
    }
  }

  function update(newCfg = {}) {
    Object.assign(cfg, newCfg);
    if (newCfg.size) {
      modal.classList.remove("sm", "md", "lg");
      modal.classList.add(newCfg.size);
    }
    if (typeof newCfg.title === "string") titleEl.textContent = newCfg.title;
  }

  // Promise
  let _resolve, _reject;
  const wait = new Promise((res, rej) => {
    _resolve = res;
    _reject = rej;
  });
  const resolveWait = (payload) => {
    if (_resolve) {
      const tmp = _resolve;
      _resolve = null;
      _reject = null;
      tmp(payload);
    }
  };

  return {
    id,
    el: modal,
    overlay,
    close,
    remove,
    setContent,
    update,
    wait,
  };
}

/**
 * Alert dialog
 */
export function alertModal(
  message,
  { title = "", size = "sm", okText = TEXTS.ok, className } = {}
) {
  const m = openModal({
    title,
    size,
    className,
    text: message,
    buttons: [
      {
        label: okText,
        className: "success",
        action: "confirm",
        autofocus: true,
      },
    ],
  });
  return m.wait.then(() => true);
}

/**
 * Confirm dialog -> Promise<boolean>
 */
export function confirmModal(
  message,
  {
    title = "تایید",
    size = "sm",
    yesText = TEXTS.yes,
    noText = TEXTS.no,
    className,
  } = {}
) {
  const m = openModal({
    title,
    size,
    className,
    text: message,
    buttons: [
      { label: noText, className: "", action: "cancel" },
      {
        label: yesText,
        className: "btn success",
        action: "confirm",
        autofocus: true,
      },
    ],
  });
  return m.wait.then((res) => res?.action === "confirm");
}

/**
 * Prompt dialog -> Promise<string|null>
 */
export function promptModal(
  label = "ورودی",
  {
    title = "ورود اطلاعات",
    size = "sm",
    placeholder = TEXTS.placeholder,
    defaultValue = "",
    okText = TEXTS.yes,
    cancelText = TEXTS.cancel,
    inputType = "text",
    className,
  } = {}
) {
  const input = createEl("input", {
    attrs: { type: inputType, placeholder, value: defaultValue },
    className: "field",
  });
  input.style.width = "100%";
  const wrapper = createEl("div");
  wrapper.appendChild(createEl("label", { className: "label", text: label }));
  const fieldWrap = createEl("div", { className: "field" });
  fieldWrap.appendChild(input);
  wrapper.appendChild(fieldWrap);

  const m = openModal({
    title,
    size,
    className,
    content: wrapper,
    buttons: [
      { label: cancelText, action: "cancel" },
      {
        label: okText,
        className: "btn success",
        action: "confirm",
        autofocus: true,
        onClick: () => {},
      },
    ],
  });

  // Return value on confirm
  const originalResolve = m.wait.then((res) => {
    if (res?.action === "confirm") {
      return input.value;
    }
    return null;
  });

  // Submit on enter
  on(input, "keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      // Simulate confirm button click
      m.overlay.querySelector(".modal-footer .btn.success")?.click();
    }
  });

  setTimeout(() => input.focus(), 50);
  return originalResolve;
}

/**
 * Close all opened modals
 */
export function closeAllModals() {
  [...MODAL_STACK].forEach((m) => {
    try {
      m.overlay.classList.remove("open");
      m.overlay.remove();
    } catch {}
  });
  MODAL_STACK = [];
}

// ----------------------------------------------------------------------
// Focus Trap
// ----------------------------------------------------------------------

function getFocusable(container) {
  const selectors = [
    "button",
    "[href]",
    "input",
    "select",
    "textarea",
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(container.querySelectorAll(selectors.join(","))).filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1 && isVisible(el)
  );
}

function isVisible(el) {
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function tryFocusFirst(container) {
  const focusable = getFocusable(container);
  if (focusable.length) {
    focusable[0].focus();
  } else {
    container.focus();
  }
}

function focusTrapEnable(container) {
  const focusHandler = (e) => {
    if (e.key !== "Tab") return;
    const focusable = getFocusable(container);
    if (!focusable.length) {
      e.preventDefault();
      container.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first || active === container) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  container.__trapHandler = focusHandler;
  container.addEventListener("keydown", focusHandler);
}

function focusTrapDisable(container) {
  if (container?.__trapHandler) {
    container.removeEventListener("keydown", container.__trapHandler);
    delete container.__trapHandler;
  }
}

// ----------------------------------------------------------------------
// Default export
// ----------------------------------------------------------------------

export default {
  open: openModal,
  alert: alertModal,
  confirm: confirmModal,
  prompt: promptModal,
  closeAll: closeAllModals,
};
