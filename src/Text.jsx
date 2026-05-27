import { forwardRef } from "react";
import { Box } from "@mui/material";
import { TextImpl } from "./components/TextImpl";

/**
 * @typedef {Object} RuleDef
 * @property {string}    type        – rule name (bold, italic, highlight, gradient, keyterm, code, muted, strike, color, underline, nowrap, link, internalLink)
 * @property {string[]}  [args]      – extra arguments forwarded to the rule renderer
 * @property {boolean}   [exactCase] – match case-sensitively (default: false)
 * @property {boolean}   [isRegex]   – treat the key as a regex pattern (default: false)
 *
 * @typedef {Record<string, string|RuleDef>} TextConfig
 *
 * Shorthand (rule name only):
 *   config={{ "hello": "bold" }}
 * Full form:
 *   config={{ "hello": { type: "bold", args: ["primary.main"] } }}
 */

/**
 * High-performance text component backed by `@chenglou/pretext`.
 *
 * Two rendering strategies are used depending on whether `config` is provided:
 *
 * ┌─────────────────────┬──────────────────────────────────────────────────────┐
 * │ No config           │ PretextText — pixel-accurate line-breaking without   │
 * │ (plain text)        │ DOM reflows. Ideal for measurements, virtualization. │
 * ├─────────────────────┼──────────────────────────────────────────────────────┤
 * │ With config         │ Browser-reflowed inline rendering. The full text is  │
 * │ (rich text)         │ parsed once and rendered as a single block; the      │
 * │                     │ browser handles wrapping so styled spans (bold,      │
 * │                     │ gradient, …) never overflow their computed position. │
 * └─────────────────────┴──────────────────────────────────────────────────────┘
 *
 * Props
 * ─────────────────────────────────────────────────────────────────────────────
 * text           {string}      Text content.
 * variant        {string}      MUI typography variant key, e.g. "h1", "body1".
 * palette        {string}      Dot-notation MUI palette path, e.g. "text.secondary",
 *                              "primary.main", or shorthand "primary".
 * width          {number}      Fixed container width in px. Omit for 100 % auto.
 * config         {TextConfig}  Rich-text rule map.
 * sx             {object}      Full MUI sx prop (shorthands mb/mt/p etc. work).
 *                              Typography keys (lineHeight, fontWeight, fontSize,
 *                              letterSpacing, whiteSpace, wordBreak) are extracted
 *                              and kept in sync with pretext measurement.
 * align          {string}      Shortcut for textAlign.
 * lineClamp      {number}      Max lines before truncation. Uses native CSS ellipsis on the final line!
 * prepareOptions {object}      Extra @chenglou/pretext PrepareOptions (merged with
 *                              auto-detected ones from sx).
 * className      {string}      CSS class on the root element.
 * shrinkWrap     {boolean}     If true, the container will shrink to exactly fit the widest line of text.
 * manualNewLine  {boolean}     If true, text will never wrap automatically, forcing the container to expand unless a \n is encountered. (Alias: noWrap)
 * component      {string}      Underlying HTML element to render (default "div").
 */
export const Text = forwardRef((props, ref) => {
  const { text = "", sx, className, shrinkWrap, manualNewLine, noWrap, ignoreLineBreaks, wrapBuffer, lazyWrapping, align, component = "div", ...rest } = props;
  const preventWrap = manualNewLine || noWrap;
  const appliedWrapBuffer = lazyWrapping ? 0 : wrapBuffer;
  const currentAlign = align || sx?.textAlign;
  
  if (typeof text === "string") {
    const normalizedText = text.replace(/<br\s*\/?>/gi, "\n");
    if (normalizedText.includes("\n")) {
      const lines = normalizedText.split("\n");
      return (
        <Box 
          ref={ref}
          component={component}
          sx={{ 
            display: component === "span" ? "inline-flex" : "flex", 
            flexDirection: "column", 
            ...(currentAlign === "center" ? { alignItems: "center", ...(shrinkWrap || preventWrap ? { mx: "auto" } : {}) } : currentAlign === "right" ? { alignItems: "flex-end", ...(shrinkWrap || preventWrap ? { ml: "auto" } : {}) } : {}),
            ...(shrinkWrap && { width: "max-content", maxWidth: "100%" }), 
            ...(preventWrap && { whiteSpace: "nowrap", width: "max-content", maxWidth: "none" }),
            ...sx 
          }} 
          className={className}
        >
          {lines.map((line, i) => (
            <TextImpl key={i} {...rest} align={align} wrapBuffer={appliedWrapBuffer} component={component} text={line || (ignoreLineBreaks ? " " : "\u00A0")} shrinkWrap={shrinkWrap} manualNewLine={preventWrap} sx={{}} className="" />
          ))}
        </Box>
      );
    }
  }
  return <TextImpl align={align} wrapBuffer={appliedWrapBuffer} {...props} />;
};

