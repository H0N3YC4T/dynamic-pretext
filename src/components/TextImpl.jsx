import { useMemo, useRef } from "react";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { usePretextContainerWidth } from "../hooks/usePretextContainerWidth";
import { usePretextTheme } from "../hooks/usePretextTheme";
import { usePretextRules } from "../hooks/usePretextRules";
import { extractSxTypography } from "../utils/extractSxTypography";
import { parseRichInlineText } from "../utils/parseRichInlineText";
import { useFontsLoaded } from "../../../hooks/useFontsLoaded";

import { PretextSimpleText } from "./PretextSimpleText";
import { PretextRichText } from "./PretextRichText";

export const TextImpl = ({
  text = "",
  variant,
  palette,
  width,
  config,
  sx,
  align,
  lineClamp,
  prepareOptions: extraPrepareOptions,
  className,
  shrinkWrap,
  manualNewLine,
  noWrap,
  wrapBuffer,
  ...htmlProps
}) => {
  const preventWrap = manualNewLine || noWrap;
  const theme = useTheme();
  const fontsLoaded = useFontsLoaded();

  // ── Theme data ─────────────────────────────────────────────────────────────
  // Extract typography-relevant sx keys so they are fed into pretext measurement,
  // keeping the engine's line-break calculation in sync with visual rendering.
  const sxExtract     = useMemo(() => ({ ...extractSxTypography(sx), ...(preventWrap && { whiteSpace: "nowrap" }) }), [sx, preventWrap]);
  const themeData     = usePretextTheme(variant, palette, sxExtract);
  const pretextRules  = usePretextRules(themeData.resolveColor, theme);

  const mergedPrepareOptions = useMemo(
    () => ({ ...themeData.prepareOptions, ...extraPrepareOptions }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [themeData.prepareOptions, extraPrepareOptions],
  );

  // ── Config detection ───────────────────────────────────────────────────────
  const safeConfig = config ?? {};
  const hasConfig  = Object.keys(safeConfig).length > 0;

  // ── Container width (needed by PretextText for simple path) ────────────────
  const containerRef  = useRef(null);
  const fixedWidth    = typeof width === "number" ? width : null;
  // usePretextContainerWidth must be called unconditionally (rules of hooks).
  // It is only consumed by PretextText via the Box ref on the simple path.
  usePretextContainerWidth(containerRef); // keep attached; PretextText reads it

  // ── Box sx ─────────────────────────────────────────────────────────────────
  // MUI Box receives the full sx prop (shorthands like mb, mt, p, … work here).
  const boxSx = useMemo(
    () => ({
      display: "block",
      width:   fixedWidth ? `${fixedWidth}px` : (shrinkWrap || preventWrap ? "fit-content" : "100%"),
      ...(shrinkWrap && !preventWrap && !fixedWidth ? { maxWidth: "100%" } : {}),
      ...(preventWrap && { whiteSpace: "nowrap", width: "max-content", maxWidth: "none" }),
      ...sx,
      ...(align === "center" ? { textAlign: align, ...(shrinkWrap || preventWrap ? { mx: "auto" } : {}) } : align === "right" ? { textAlign: align, ...(shrinkWrap || preventWrap ? { ml: "auto" } : {}) } : align ? { textAlign: align } : {}),
    }),
    [fixedWidth, sx, align, shrinkWrap, preventWrap],
  );

  // ── Apply textTransform before measurement ─────────────────────────────────
  const transformedText = useMemo(() => {
    if (!text || !themeData.textTransform) return text;
    switch (themeData.textTransform) {
      case "uppercase": return text.toUpperCase();
      case "lowercase": return text.toLowerCase();
      case "capitalize": return text.replace(/\b\w/g, c => c.toUpperCase());
      default: return text;
    }
  }, [text, themeData.textTransform]);

  // ── Rich-text content (config path) ───────────────────────────────────────
  const parsedData = useMemo(
    () =>
      hasConfig
        ? parseRichInlineText(transformedText, safeConfig, themeData)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasConfig, transformedText, config, themeData, fontsLoaded],
  );

  // ── Simple path — no config ────────────────────────────────────────────────
  // PretextText performs accurate canvas-measured line-breaking without reflow.
  if (!hasConfig) {
    return (
      <Box ref={containerRef} sx={boxSx} className={className} {...htmlProps}>
        <PretextSimpleText
          key={fontsLoaded ? "loaded" : "loading"}
          text={transformedText}
          font={themeData.font}
          lineHeight={themeData.lineHeight}
          prepareOptions={mergedPrepareOptions}
          containerRef={containerRef}
          lineClamp={lineClamp}
          align={align || sx?.textAlign}
          shrinkWrap={shrinkWrap}
          manualNewLine={preventWrap}
          wrapBuffer={wrapBuffer}
          style={{ color: themeData.color, font: themeData.font }}
        />
      </Box>
    );
  }

  // ── Rich path — has config ─────────────────────────────────────────────────
  // Uses pretext's rich-inline measurement to completely avoid browser layout reflows
  // while accurately placing differently-sized rich text segments (bold, code, etc.)
  return (
    <Box ref={containerRef} sx={boxSx} className={className} {...htmlProps}>
      <PretextRichText
        items={parsedData.items}
        tokens={parsedData.tokens}
        rulesEngine={pretextRules}
        lineHeight={themeData.lineHeight}
        containerRef={containerRef}
        lineClamp={lineClamp}
        align={align || sx?.textAlign}
        shrinkWrap={shrinkWrap}
        manualNewLine={preventWrap}
        wrapBuffer={wrapBuffer}
        style={{ color: themeData.color, font: themeData.font }}
      />
    </Box>
  );
};
