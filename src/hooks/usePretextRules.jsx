import { useMemo } from "react";
import { alpha } from "@mui/material/styles";
import { Link } from "react-router-dom";

// ─── Rule Engine ─────────────────────────────────────────────────────────────

/**
 * Build the map of rule-name → render function.
 * Memoised to prevent layout thrashing in render loops.
 *
 * Available rule types
 * ──────────────────────────────────────────────────────────────────────────────
 * bold          – strong weight; optional colour arg: "bold" or {type:"bold", args:["primary.main"]}
 * italic        – em style
 * underline     – underline decoration; optional colour arg
 * strike        – line-through decoration
 * highlight     – glowing accent colour; optional colour arg
 * color         – arbitrary palette colour arg (required): {type:"color", args:["primary.main"]}
 * muted         – reduced opacity; optional opacity arg (0–1, default 0.5)
 * code          – inline monospace code span
 * keyterm       – dotted underline key-phrase; optional colour arg
 * gradient      – linear gradient text; optional start/end colour args
 * link          – external <a> tag; url is passed as the "args" value (usually via regex $0)
 * nowrap        – whiteSpace:nowrap wrapper
 * internalLink  – react-router <Link>; args: ["/path", "optional.colour"]
 *
 * @param {(path:string)=>string} resolveColor
 * @param {import("@mui/material/styles").Theme} theme
 * @returns {Record<string, (word:string, key:string, ...args:string[])=>React.ReactNode>}
 */
export const usePretextRules = (resolveColor, theme) =>
  useMemo(
    () => ({
      // ── Basic formatting ──────────────────────────────────────────────────

      bold: (w, k, colorPath) => (
        <strong
          key={k}
          style={{
            fontWeight: 700,
            color: colorPath ? resolveColor(colorPath) : "inherit",
          }}
        >
          {w}
        </strong>
      ),

      italic: (w, k) => (
        <em key={k} style={{ fontStyle: "italic" }}>
          {w}
        </em>
      ),

      underline: (w, k, colorPath) => (
        <span
          key={k}
          style={{
            textDecoration: "underline",
            textUnderlineOffset: "3px",
            color: colorPath ? resolveColor(colorPath) : "inherit",
          }}
        >
          {w}
        </span>
      ),

      strike: (w, k) => (
        <s key={k} style={{ textDecoration: "line-through", opacity: 0.7 }}>
          {w}
        </s>
      ),

      // ── Semantic emphasis ─────────────────────────────────────────────────

      highlight: (w, k, colorPath) => {
        const c = colorPath
          ? resolveColor(colorPath)
          : theme.palette.text.secondary;
        return (
          <span
            key={k}
            style={{
              color: c,
              textShadow: `0 0 10px ${alpha(c, 0.45)}`,
              fontWeight: 700,
            }}
          >
            {w}
          </span>
        );
      },

      color: (w, k, colorPath) => (
        <span key={k} style={{ color: resolveColor(colorPath) }}>
          {w}
        </span>
      ),

      muted: (w, k, opacityStr) => (
        <span
          key={k}
          style={{ opacity: opacityStr != null ? parseFloat(opacityStr) : 0.5 }}
        >
          {w}
        </span>
      ),

      // ── Rich display ──────────────────────────────────────────────────────

      /**
       * Inline monospace code span — styled to blend with the active theme.
       */
      code: (w, k) => {
        const codeTypo = theme.typography.code || {};
        return (
          <code
            key={k}
            style={{
              fontFamily: codeTypo.fontFamily || '"Fira Code", monospace',
              fontSize: codeTypo.fontSize || "0.875em",
              padding: "0.1em 0.4em",
            borderRadius: "5px",
            background: alpha(theme.palette.text.primary, 0.08),
            color: theme.palette.text.primary,
            border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          }}
        >
          {w}
        </code>
        );
      },

      /**
       * Key-term — coloured with a dotted underline for definitions/vocabulary.
       * Optional colour arg; defaults to primary.main.
       */
      keyterm: (w, k, colorPath) => {
        const c = colorPath ? resolveColor(colorPath) : theme.palette.primary.main;
        return (
          <span
            key={k}
            style={{
              color: c,
              fontWeight: 600,
              borderBottom: `1px dotted ${alpha(c, 0.6)}`,
            }}
          >
            {w}
          </span>
        );
      },

      /**
       * Gradient text — eye-catching heading treatment.
       * args[0] = start colour path (default primary.main)
       * args[1] = end   colour path (default secondary.main)
       */
      gradient: (w, k, startColorPath, endColorPath) => {
        const c1 = startColorPath
          ? resolveColor(startColorPath)
          : theme.palette.primary.main;
        const c2 = endColorPath
          ? resolveColor(endColorPath)
          : theme.palette.secondary.main;
        return (
          <span
            key={k}
            style={{
              backgroundImage: `linear-gradient(90deg, ${c1}, ${c2})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 700,
              display: "inline-block", // required for the clip to work in all browsers
            }}
          >
            {w}
          </span>
        );
      },

      // ── Links & navigation ────────────────────────────────────────────────

      /**
       * External anchor. `url` arg is optional — if omitted the matched text
       * itself is used as the href (handy for regex URL patterns).
       */
      link: (w, k, url) => {
        const target = url ?? w;
        const href   = /^https?:\/\//i.test(target) ? target : `https://${target}`;
        return (
          <a
            key={k}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: theme.palette.primary.main,
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            {w}
          </a>
        );
      },

      nowrap: (w, k) => (
        <span key={k} style={{ whiteSpace: "nowrap" }}>
          {w}
        </span>
      ),

      /**
       * Internal react-router Link.
       * args[0] = route path  (required)
       * args[1] = colour path (optional, defaults to "inherit")
       */
      internalLink: (w, k, to, colorPath) => (
        <Link
          key={k}
          to={to}
          style={{
            textDecoration: "none",
            fontWeight: "bold",
            color: colorPath ? resolveColor(colorPath) : "inherit",
          }}
        >
          {w}
        </Link>
      ),
    }),
    [resolveColor, theme],
  );
