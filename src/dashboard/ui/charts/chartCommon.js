
export function getTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

export function applyChartDefaultsForTheme(Chart, theme = getTheme()) {
  if (theme === "dark") {
    // Chart.js defaults
    // eslint-disable-next-line no-undef
    Chart.defaults.borderColor = "rgba(255,255,255,0.3)";
    // eslint-disable-next-line no-undef
    Chart.defaults.color = "rgba(255,255,255,0.6)";
  } else {
    // eslint-disable-next-line no-undef
    Chart.defaults.borderColor = "rgba(0,0,0,0.2)";
    // eslint-disable-next-line no-undef
    Chart.defaults.color = "rgba(0,0,0,0.7)";
  }
}

export function getGridColor(Chart, theme = getTheme()) {
  // eslint-disable-next-line no-undef
  return theme === "dark" ? "rgba(255,255,255,0.2)" : Chart.defaults.borderColor;
}

// Return a NUMBER rounded to d decimals (not a string)
export function fix(n, d = 3) {
  const v = Number(n);
  if (!Number.isFinite(v)) return n;
  return Number.parseFloat(v.toFixed(d));
}

export function roundTo(v, decimals = 1) {
  const n = Number(v);
  if (!Number.isFinite(n)) return n;
  const p = 10 ** decimals;
  return Math.round(n * p) / p;
}

export function buildDate(ts) {
  const d = new Date(Number(ts));
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return ss === "00" ? `${hh}h${mm}` : `${hh}h${mm}:${ss}`;
}
