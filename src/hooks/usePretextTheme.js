import { useTheme } from "@mui/material/styles";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Read the root <html> font size (px). Re-reads on every call so it tracks
 * viewport-driven rem changes. Cheap enough that caching is not worth the
 * stale-value risk.
 * @returns {number}
 */
const getBaseFontSize = () => {
  if (typeof window === "undefined") return 16;
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
};

/**
 * Clean a MUI fontFamily string for use as a canvas `font` shorthand.
 * MUI stores e.g. '"Roboto","Helvetica","Arial",sans-serif'
 * Canvas needs e.g.  'Roboto, Helvetica, Arial, sans-serif'
 * @param {string} family
 * @returns {string}
 */
const cleanFontFamily = (family) =>
  family
    .split(",")
    .map((f) => f.trim().replace(/^["']|["']$/g, ""))
    .join(", ");

// ─── Color Resolution ─────────────────────────────────────────────────────────

/**
 * Resolve a dot-notation or shorthand palette path from the MUI theme.
 *
 * Supports:
 *  - "primary.main"   → theme.palette.primary.main
 *  - "primary"        → theme.palette.primary.main  (auto-grabs .main)
 *  - "text.secondary" → theme.palette.text.secondary
 *  - "text.accent"    → theme.palette.text.accent   (custom keys)
 *  - "#ff0000"        → "#ff0000"                   (raw CSS pass-through)
 *
 * @param {import("@mui/material/styles").Theme} theme
 * @param {string} path
 * @returns {string}
 */
export const resolveThemeColor = (theme, path) => {
  if (!path) return path;
  // Pass through raw CSS colour literals (hex, rgb, hsl, oklch …)
  if (/^#|^rgb|^hsl|^oklch/.test(path)) return path;

  const parts = path.split(".");
  let resolved = parts.reduce(
    (obj, key) => (obj && typeof obj === "object" ? obj[key] : undefined),
    theme.palette,
  );

  // If we landed on a palette colour-object (has .main), grab .main
  if (resolved && typeof resolved === "object") {
    resolved = resolved.main ?? resolved.DEFAULT ?? undefined;
  }

  return typeof resolved === "string" ? resolved : path;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Derive everything pretext needs from the MUI theme + variant + palette,
 * with optional sx overrides applied consistently to both CSS rendering and
 * pretext measurement.
 *
 * @param {string}      [variant="body1"]       MUI typography variant key
 * @param {string}      [palette="text.primary"] Dot-notation palette path
 * @param {import("../utils/extractSxTypography").SxExtract}   [sxOverride]            Extracted typography sx values
 *
 * @returns {{
 *   font:           string,
 *   fontSize:       number,
 *   lineHeight:     number,
 *   color:          string,
 *   resolveColor:   (path:string) => string,
 *   prepareOptions: import("@chenglou/pretext").PrepareOptions,
 * }}
 */
export const usePretextTheme = (variant = "body1", palette = "text.primary", sxOverride) => {
  const theme = useTheme();
  const resolveColor = (path) => resolveThemeColor(theme, path);
  const color = resolveColor(palette);

  // ── Typography variant data (fallback to body1) ──────────────────────────
  const fontData = theme.typography[variant] ?? theme.typography.body1 ?? {};
  const baseFontSize = getBaseFontSize();

  // ── Font size ─────────────────────────────────────────────────────────────
  const baseRem    = parseFloat(String(fontData.fontSize ?? 1));
  const baseFontPx = baseFontSize * baseRem;

  let fontPx = baseFontPx;
  if (sxOverride?.fontSize != null) {
    const raw = String(sxOverride.fontSize);
    if      (raw.endsWith("rem")) fontPx = baseFontSize * parseFloat(raw);
    else if (raw.endsWith("em"))  fontPx = baseFontPx   * parseFloat(raw);
    else if (raw.endsWith("px"))  fontPx = parseFloat(raw);
    else if (!isNaN(Number(raw))) fontPx = baseFontSize * Number(raw); // unitless ≈ rem
  }

  // ── Font weight ───────────────────────────────────────────────────────────
  const baseWeight = fontData.fontWeight != null ? Number(fontData.fontWeight) : 400;
  const fontWeight = sxOverride?.fontWeight != null ? Number(sxOverride.fontWeight) : baseWeight;

  // ── Font family ───────────────────────────────────────────────────────────
  const rawFamily  = String(fontData.fontFamily ?? theme.typography.fontFamily ?? "sans-serif");
  const fontFamily = cleanFontFamily(rawFamily);

  // Final canvas / pretext font shorthand
  const font = `${fontWeight} ${fontPx}px ${fontFamily}`;

  // ── Line height ───────────────────────────────────────────────────────────
  const baseLHMult  = parseFloat(String(fontData.lineHeight ?? 1.5));
  const baseLinePx  = fontPx * baseLHMult;

  let lineHeight = baseLinePx;
  if (sxOverride?.lineHeight != null) {
    const raw = sxOverride.lineHeight;
    if (typeof raw === "number") {
      // Unitless ⇒ multiplier (matches CSS default behaviour)
      lineHeight = raw * fontPx;
    } else {
      const s = String(raw);
      if      (s.endsWith("px"))   lineHeight = parseFloat(s);
      else if (!isNaN(Number(s)))  lineHeight = Number(s) * fontPx;
    }
  }

  // ── Letter spacing ────────────────────────────────────────────────────────
  let letterSpacing;
  if (sxOverride?.letterSpacing != null) {
    const raw = String(sxOverride.letterSpacing);
    if      (raw.endsWith("em"))  letterSpacing = parseFloat(raw) * fontPx;
    else if (raw.endsWith("px"))  letterSpacing = parseFloat(raw);
    else if (!isNaN(Number(raw))) letterSpacing = Number(raw);
  }

  // ── prepareOptions forwarded to @chenglou/pretext ─────────────────────────
  /** @type {import("@chenglou/pretext").PrepareOptions} */
  const textTransform = sxOverride?.textTransform || fontData.textTransform;

  const prepareOptions = {};
  if (sxOverride?.whiteSpace === "pre-wrap") prepareOptions.whiteSpace  = "pre-wrap";
  if (sxOverride?.wordBreak  === "break-all") prepareOptions.wordBreak   = "break-all";
  if (sxOverride?.wordBreak  === "keep-all") prepareOptions.wordBreak   = "keep-all";
  if (letterSpacing != null)                 prepareOptions.letterSpacing = letterSpacing;

  return { font, fontSize: fontPx, fontFamily, lineHeight, color, resolveColor, prepareOptions, theme, textTransform };
};
