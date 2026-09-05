/**
 * colors.js — Single source of truth for the DosaTrack web design tokens.
 *
 * To retheme: change BRAND here. All components import from this file.
 * These mirror the Tailwind config values for use in JS (e.g. chart colors).
 */
export const COLORS = {
  // ── Backgrounds ────────────────────────────────────────────────────────
  bg: '#0d0f1a',
  card: '#141828',
  border: '#1e2438',
  hover: '#1a2030',

  // ── Brand — change this one value to retheme the entire dashboard ──────
  brand: '#6c63ff',
  brandLight: '#8a84ff',
  brandDark: '#4f46e5',

  // ── Semantic ────────────────────────────────────────────────────────────
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',

  // ── Text ────────────────────────────────────────────────────────────────
  text: '#ffffff',
  subtext: '#94a3b8',
  muted: '#6b7280',
};

/** CSS animation duration constants (ms) so they're easy to change together */
export const ANIM = {
  countUp: 600,
  slideIn: 350,
  fadeIn: 400,
  highlightClear: 3000,
};
