/**
 * colors.js — Single source of truth for the DosaTrack mobile color palette.
 *
 * To change the brand color: edit COLORS.brand here.
 * Everything in HomeScreen, SaleScreen, ReceiptScreen reads from this file.
 */
const COLORS = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  bg: '#0d0f1a',          // deepest background
  card: '#141828',        // card surface
  inputBg: '#1a1d2e',     // input field background
  border: '#1e2438',      // card/input border

  // ── Brand ─────────────────────────────────────────────────────────────────
  brand: '#6c63ff',       // primary action color — change this one line to retheme
  brandLight: '#8a84ff',  // lighter tint for links/secondary elements
  brandDark: '#4f46e5',   // deeper violet for gradient stops

  // ── Semantic ──────────────────────────────────────────────────────────────
  success: '#10b981',     // green — healthy stock, confirmed sale
  warning: '#f59e0b',     // amber — low stock warning
  danger: '#ef4444',      // red — critically low / error states

  // ── Text ──────────────────────────────────────────────────────────────────
  text: '#ffffff',        // primary text
  subtext: '#94a3b8',     // secondary text
  muted: '#6b7280',       // placeholder / disabled text
};

export default COLORS;

