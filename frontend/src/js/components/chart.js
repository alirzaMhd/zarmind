// ======================================================================
// Zarmind Chart Component (Chart.js v4, Vanilla JS)
// - Simple wrapper around Chart.js with RTL/Persian-friendly defaults
// - Types: line, bar, doughnut (and other Chart.js types pass-through)
// - Helpers: createDataset(), updateData(), updateOptions(), setTheme(), destroy()
// - Theming: reacts to app theme changes (EVENTS.THEME_CHANGED)
// - Numbers shown with fa-IR locale (Persian digits)
// ======================================================================

import Chart from "chart.js/auto";

import { CHART_COLORS, EVENTS } from "../utils/constants.js";

import { toPersianDigits } from "../utils/helpers.js";

import { chartMoney, chartNumber, chartPercent } from "../utils/formatters.js";

// ----------------------------------------------------------------------
// Defaults
// ----------------------------------------------------------------------

const DEFAULT_HEIGHT = 320;
const SERIES = CHART_COLORS?.SERIES || [
  "#22c55e",
  "#0ea5e9",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
  "#f43f5e",
  "#84cc16",
  "#06b6d4",
  "#eab308",
];

// Derive theme-aware palette
function getThemeColors() {
  const root = document.documentElement;
  const getCss = (name, fallback) =>
    getComputedStyle(root).getPropertyValue(name).trim() || fallback;
  return {
    text: getCss("--text", "#e5e7eb"),
    muted: getCss("--text-muted", "#94a3b8"),
    grid: getCss("--divider", "#162235"),
    bg: getCss("--bg", "#0b1020"),
    card: getCss("--card", "#111828"),
    border: getCss("--border", "#1f2937"),
  };
}

// ----------------------------------------------------------------------
// Chart Factory
// ----------------------------------------------------------------------

/**
 * Create a chart inside the given root element.
 * @param {HTMLElement} root - container element (a canvas will be appended)
 * @param {Object} cfg
 *  - type: 'line' | 'bar' | 'doughnut' | ...
 *  - labels: string[] (x-axis)
 *  - datasets: Chart.js datasets[]
 *  - options: Chart.js options
 *  - height: number (px)
 *  - aspectRatio: number (Chart.js option override)
 *  - responsive: boolean (default true)
 *  - rtl: boolean (defaults to document.dir === 'rtl')
 *  - tooltip: { mode, intersect, format: 'number'|'money'|'percent'|fn(value) }
 *  - yFormat: 'number'|'money'|'percent'|fn(value)
 *  - xFormat: fn(label) -> string
 */
export default function createChart(root, cfg = {}) {
  if (!root) throw new Error("Chart root element is required");

  // Canvas
  const canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.height = cfg.height || DEFAULT_HEIGHT;
  root.innerHTML = "";
  root.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const theme = getThemeColors();
  const rtl = cfg.rtl ?? document.documentElement.dir === "rtl";

  // Default scales/options
  const baseOptions = makeBaseOptions({ theme, rtl, cfg });

  const chart = new Chart(ctx, {
    type: cfg.type || "line",
    data: {
      labels: Array.isArray(cfg.labels) ? cfg.labels : [],
      datasets: Array.isArray(cfg.datasets) ? cfg.datasets : [],
    },
    options: deepMerge(baseOptions, cfg.options || {}),
  });

  // Theme listener
  const onThemeChanged = (e) => {
    applyTheme(chart);
  };
  window.addEventListener(
    EVENTS?.THEME_CHANGED || "theme:changed",
    onThemeChanged
  );

  function applyTheme(ch) {
    const t = getThemeColors();
    const opts = ch.options || {};
    // Legend + tooltip colors
    if (opts.plugins?.legend?.labels) {
      opts.plugins.legend.labels.color = t.text;
    }
    if (opts.plugins?.tooltip) {
      opts.plugins.tooltip.titleColor = t.text;
      opts.plugins.tooltip.bodyColor = t.text;
      opts.plugins.tooltip.backgroundColor = hexWithAlpha(
        t.card || "#111828",
        0.96
      );
      opts.plugins.tooltip.borderColor = t.border;
      opts.plugins.tooltip.borderWidth = 1;
    }
    // Scales
    if (opts.scales?.x?.ticks) opts.scales.x.ticks.color = t.muted;
    if (opts.scales?.y?.ticks) opts.scales.y.ticks.color = t.muted;
    if (opts.scales?.x?.grid) {
      opts.scales.x.grid.color = hexWithAlpha(t.grid, 0.65);
      opts.scales.x.grid.borderColor = t.border;
    }
    if (opts.scales?.y?.grid) {
      opts.scales.y.grid.color = hexWithAlpha(t.grid, 0.65);
      opts.scales.y.grid.borderColor = t.border;
    }
    ch.update("none");
  }

  // Initial theme apply
  applyTheme(chart);

  // API
  const api = {
    el: canvas,
    chart,

    updateData({ labels, datasets }) {
      if (labels) chart.data.labels = labels;
      if (datasets) chart.data.datasets = datasets;
      chart.update();
    },

    updateOptions(options = {}) {
      chart.options = deepMerge(chart.options || {}, options);
      chart.update("none");
    },

    setTheme() {
      applyTheme(chart);
    },

    destroy() {
      try {
        window.removeEventListener(
          EVENTS?.THEME_CHANGED || "theme:changed",
          onThemeChanged
        );
      } catch {}
      try {
        chart.destroy();
      } catch {}
      try {
        root.innerHTML = "";
      } catch {}
    },
  };

  return api;
}

// ----------------------------------------------------------------------
// Dataset helpers
// ----------------------------------------------------------------------

/**
 * Create a line dataset with sensible defaults.
 * @param {string} label
 * @param {Array<number>} data
 * @param {string} color (hex)
 * @param {Object} opts { fill, tension, borderWidth, backgroundOpacity, pointRadius, stack, yAxisID }
 */
export function createLineDataset(label, data, color = SERIES[0], opts = {}) {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: makeFill(color, opts.backgroundOpacity ?? 0.18),
    pointRadius: opts.pointRadius ?? 2,
    pointHoverRadius: opts.pointHoverRadius ?? 4,
    tension: opts.tension ?? 0.3,
    borderWidth: opts.borderWidth ?? 2,
    fill: opts.fill ?? false,
    yAxisID: opts.yAxisID,
    stack: opts.stack,
  };
}

/**
 * Create a bar dataset with sensible defaults.
 * @param {string} label
 * @param {Array<number>} data
 * @param {string} color (hex)
 * @param {Object} opts { borderWidth, borderRadius, yAxisID, stack }
 */
export function createBarDataset(label, data, color = SERIES[0], opts = {}) {
  return {
    label,
    data,
    backgroundColor: makeFill(color, 0.85),
    borderColor: color,
    borderWidth: opts.borderWidth ?? 1,
    borderRadius: opts.borderRadius ?? 4,
    yAxisID: opts.yAxisID,
    stack: opts.stack,
  };
}

/**
 * Create a doughnut dataset.
 * @param {string} label
 * @param {Array<number>} data
 * @param {Array<string>} colors (hexes) optional
 */
export function createDoughnutDataset(label, data, colors) {
  const palette = colors && colors.length ? colors : SERIES;
  return {
    label,
    data,
    backgroundColor: data.map((_, i) => palette[i % palette.length]),
    borderColor: "#00000000",
  };
}

// ----------------------------------------------------------------------
// Options builder
// ----------------------------------------------------------------------

function makeBaseOptions({ theme, rtl, cfg }) {
  const yFormat = cfg.yFormat || "number";
  const xFormatFn =
    typeof cfg.xFormat === "function" ? cfg.xFormat : (v) => String(v);
  const tooltipFormat = cfg.tooltip?.format || yFormat;

  const fmtValue = makeFormatter(yFormat);
  const fmtTooltip = makeFormatter(tooltipFormat);

  const options = {
    responsive: cfg.responsive !== false,
    maintainAspectRatio: cfg.aspectRatio ? true : false,
    aspectRatio: cfg.aspectRatio || undefined,
    layout: { padding: 8 },
    parsing: false,
    normalized: true,
    interaction: {
      mode: cfg.tooltip?.mode || "index",
      intersect: cfg.tooltip?.intersect ?? false,
    },
    locale: "fa-IR",
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          usePointStyle: true,
          color: theme.text,
          padding: 12,
          rtl: rtl,
          textAlign: rtl ? "right" : "left",
          generateLabels: (chart) => {
            const { datasets } = chart.data;
            return datasets.map((ds, i) => ({
              text: ds.label ?? `سری ${i + 1}`,
              fillStyle: ds.backgroundColor,
              strokeStyle: ds.borderColor,
              lineWidth: 0,
              hidden: !chart.isDatasetVisible(i),
              datasetIndex: i,
            }));
          },
        },
        onClick: (e, legendItem, legend) => {
          const idx = legendItem.datasetIndex;
          legend.chart.toggleDataVisibility(idx);
          legend.chart.update();
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: hexWithAlpha(theme.card, 0.96),
        titleColor: theme.text,
        bodyColor: theme.text,
        borderColor: theme.border,
        borderWidth: 1,
        padding: 10,
        rtl: rtl,
        callbacks: {
          title: (ctx) => {
            const raw = ctx?.[0]?.label;
            return typeof xFormatFn === "function"
              ? xFormatFn(raw)
              : (raw ?? "");
          },
          label: (ctx) => {
            const value = ctx.raw;
            if (typeof fmtTooltip === "function") return fmtTooltip(value, ctx);
            return toPersianDigits(String(value ?? ""));
          },
        },
      },
    },
    scales:
      cfg.type === "doughnut" || cfg.type === "pie"
        ? {}
        : {
            x: {
              grid: {
                color: hexWithAlpha(theme.grid, 0.65),
                borderColor: theme.border,
                drawBorder: true,
              },
              ticks: {
                color: theme.muted,
                callback: function (label) {
                  const raw = this.getLabelForValue
                    ? this.getLabelForValue(label)
                    : label;
                  const text =
                    typeof xFormatFn === "function" ? xFormatFn(raw) : raw;
                  return toPersianDigits(String(text ?? ""));
                },
              },
              reverse: rtl === true, // visual aid for RTL axes
            },
            y: {
              beginAtZero: true,
              grid: {
                color: hexWithAlpha(theme.grid, 0.65),
                borderColor: theme.border,
                drawBorder: true,
              },
              ticks: {
                color: theme.muted,
                callback: function (value) {
                  if (typeof fmtValue === "function") return fmtValue(value);
                  return toPersianDigits(String(value ?? ""));
                },
              },
            },
          },
  };

  return options;
}

// ----------------------------------------------------------------------
// Formatters
// ----------------------------------------------------------------------

function makeFormatter(kind) {
  if (typeof kind === "function") return (v, ctx) => kind(v, ctx);
  switch (kind) {
    case "money":
      return (v) => chartMoney(v);
    case "percent":
      return (v) => chartPercent(v);
    case "number":
    default:
      return (v) => chartNumber(v);
  }
}

// ----------------------------------------------------------------------
// Utilities
// ----------------------------------------------------------------------

function hexWithAlpha(hex, alpha = 1) {
  const c = hex.replace("#", "");
  if (c.length === 3) {
    const r = parseInt(c[0] + c[0], 16);
    const g = parseInt(c[1] + c[1], 16);
    const b = parseInt(c[2] + c[2], 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (c.length >= 6) {
    const r = parseInt(c.substr(0, 2), 16);
    const g = parseInt(c.substr(2, 2), 16);
    const b = parseInt(c.substr(4, 2), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return hex; // fallback
}

function makeFill(color, opacity = 0.2) {
  return hexWithAlpha(color, opacity);
}

// Deep merge for options
function deepMerge(target, source) {
  if (!source) return target;
  if (!target) return source;
  const out = Array.isArray(target) ? target.slice() : { ...target };
  Object.keys(source).forEach((key) => {
    const sv = source[key];
    const tv = out[key];
    if (sv && typeof sv === "object" && !Array.isArray(sv)) {
      out[key] = deepMerge(tv && typeof tv === "object" ? tv : {}, sv);
    } else {
      out[key] = sv;
    }
  });
  return out;
}

// ----------------------------------------------------------------------
// Named Shortcuts
// ----------------------------------------------------------------------

export function lineChart(
  root,
  { labels = [], series = [], options = {} } = {}
) {
  const datasets = series.map((s, i) =>
    createLineDataset(
      s.label || `سری ${i + 1}`,
      s.data || [],
      s.color || SERIES[i % SERIES.length],
      s.opts || {}
    )
  );
  return createChart(root, { type: "line", labels, datasets, options });
}

export function barChart(
  root,
  { labels = [], series = [], options = {} } = {}
) {
  const datasets = series.map((s, i) =>
    createBarDataset(
      s.label || `سری ${i + 1}`,
      s.data || [],
      s.color || SERIES[i % SERIES.length],
      s.opts || {}
    )
  );
  return createChart(root, { type: "bar", labels, datasets, options });
}

export function doughnutChart(
  root,
  { labels = [], data = [], colors = SERIES, options = {} } = {}
) {
  const datasets = [createDoughnutDataset("داده‌ها", data, colors)];
  return createChart(root, { type: "doughnut", labels, datasets, options });
}
