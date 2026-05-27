import { Fragment } from "react";

// ─── Dynamic text parser ──────────────────────────────────────────────────────

/**
 * Apply a TextConfig to a plain-text string and return an array of strings
 * and React elements ready for rendering inside a single line container.
 *
 * Plain (unmatched) tokens are returned as raw strings — no wrapper `<span>`,
 * so the parent container's `white-space` and line-height apply naturally.
 *
 * Keys include `lineIndex` so there are no collisions when many lines share
 * the same matched substring.
 *
 * @param {string} text
 * @param {Record<string, string|import("../hooks/usePretextRules").RuleDef>} config
 * @param {ReturnType<typeof import("../hooks/usePretextRules").usePretextRules>} rulesEngine
 * @param {number} [lineIndex=0]
 * @returns {Array<string|React.ReactNode>}
 */
export const parseDynamicText = (text, config, rulesEngine, lineIndex = 0) => {
  if (!config || Object.keys(config).length === 0) return [text];

  let tokens = [{ text, isProcessed: false }];

  for (const [targetString, def] of Object.entries(config)) {
    const type       = typeof def === "string" ? def : def.type;
    const args       = (typeof def === "object" ? def.args : undefined) ?? [];
    const exactCase  = typeof def === "object" ? def.exactCase === true : false;
    const isRegex    = typeof def === "object" ? def.isRegex  === true : false;
    const renderFn   = rulesEngine[type];

    if (!renderFn) continue;

    const finalPattern = isRegex
      ? targetString
      : targetString.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

    const rx = new RegExp(finalPattern, exactCase ? "g" : "gi");

    tokens = tokens.flatMap((token) => {
      if (token.isProcessed) return [token];

      const subTokens = [];
      let lastIndex = 0;
      let match;

      rx.lastIndex = 0;

      while ((match = rx.exec(token.text)) !== null) {
        if (match.index > lastIndex) {
          subTokens.push({
            text: token.text.slice(lastIndex, match.index),
            isProcessed: false,
          });
        }

        subTokens.push({
          // Unique key: line · match position · rule name
          node: renderFn(match[0], `${lineIndex}-${match.index}-${targetString}`, ...args),
          isProcessed: true,
        });

        lastIndex = rx.lastIndex;
        if (match[0].length === 0) rx.lastIndex++; // guard against zero-length matches
      }

      if (lastIndex < token.text.length) {
        subTokens.push({
          text: token.text.slice(lastIndex),
          isProcessed: false,
        });
      }

      return subTokens;
    });
  }

  // Return plain strings directly (no wrapper spans) so the container's
  // CSS properties (white-space, line-height) apply unchanged.
  // React renders mixed string/element arrays just fine.
  return tokens.map((t, i) =>
    t.isProcessed ? (
      <Fragment key={`${lineIndex}-n-${i}`}>{t.node}</Fragment>
    ) : (
      t.text
    ),
  );
};

/**
 * Tokenize a string against the config, but return structured data for pretext rich-inline layout.
 * @param {string} text 
 * @param {Record<string, string|import("../hooks/usePretextRules").RuleDef>} config 
 * @param {Object} themeData 
 * @returns {{ items: import("@chenglou/pretext/dist/rich-inline").RichInlineItem[], tokens: any[] }}
 */
export const parseRichInlineText = (text, config, themeData) => {
  if (!config || Object.keys(config).length === 0) {
    return {
      items: [{ text, font: themeData.font, letterSpacing: themeData.prepareOptions?.letterSpacing }],
      tokens: [{ text, isProcessed: false }]
    };
  }

  let tokens = [{ text, isProcessed: false }];

  for (const [targetString, def] of Object.entries(config)) {
    const type       = typeof def === "string" ? def : def.type;
    const args       = (typeof def === "object" ? def.args : undefined) ?? [];
    const exactCase  = typeof def === "object" ? def.exactCase === true : false;
    const isRegex    = typeof def === "object" ? def.isRegex  === true : false;

    const finalPattern = isRegex
      ? targetString
      : targetString.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

    const rx = new RegExp(finalPattern, exactCase ? "g" : "gi");

    tokens = tokens.flatMap((token) => {
      if (token.isProcessed) return [token];

      const subTokens = [];
      let lastIndex = 0;
      let match;

      rx.lastIndex = 0;

      while ((match = rx.exec(token.text)) !== null) {
        if (match.index > lastIndex) {
          subTokens.push({
            text: token.text.slice(lastIndex, match.index),
            isProcessed: false,
          });
        }

        subTokens.push({
          text: match[0],
          isProcessed: true,
          type,
          args,
          targetString
        });

        lastIndex = rx.lastIndex;
        if (match[0].length === 0) rx.lastIndex++; // guard against zero-length matches
      }

      if (lastIndex < token.text.length) {
        subTokens.push({
          text: token.text.slice(lastIndex),
          isProcessed: false,
        });
      }

      return subTokens;
    });
  }

  const items = tokens.map(token => {
    if (!token.isProcessed) {
      return { text: token.text, font: themeData.font, letterSpacing: themeData.prepareOptions?.letterSpacing };
    }

    let fontStr = themeData.font; // e.g. "400 16px Roboto"
    let extraWidth = 0;
    let breakType = 'normal';

    // We know what rules change geometry
    const boldTypes = ['bold', 'highlight', 'gradient', 'internalLink'];

    if (boldTypes.includes(token.type)) {
      const boldWeight = themeData.theme?.typography?.fontWeightBold || 700;
      fontStr = fontStr.replace(/^\d+/, boldWeight);
    } else if (token.type === 'keyterm') {
      fontStr = fontStr.replace(/^\d+/, "600");
    } else if (token.type === 'italic') {
      fontStr = `italic ${fontStr}`;
    } else if (token.type === 'code') {
      const codeTypo = themeData.theme?.typography?.code || {};
      const codeFamily = codeTypo.fontFamily || '"Fira Code", monospace';
      fontStr = fontStr.replace(themeData.fontFamily, codeFamily);
      
      // Handle code font size which might be em, rem, or px
      let codeScale = 0.875;
      if (codeTypo.fontSize) {
        if (codeTypo.fontSize.endsWith("em") || codeTypo.fontSize.endsWith("rem")) {
          codeScale = parseFloat(codeTypo.fontSize);
        } else if (codeTypo.fontSize.endsWith("px")) {
          codeScale = parseFloat(codeTypo.fontSize) / themeData.fontSize;
        }
      }
      fontStr = fontStr.replace(`${themeData.fontSize}px`, `${themeData.fontSize * codeScale}px`);
      extraWidth = themeData.fontSize * 0.8; // ~padding 0.4em left/right
    } else if (token.type === 'nowrap') {
      breakType = 'never';
    }

    return {
      text: token.text,
      font: fontStr,
      letterSpacing: themeData.prepareOptions?.letterSpacing,
      break: breakType,
      ...(extraWidth > 0 && { extraWidth })
    };
  });

  return { items, tokens };
};
