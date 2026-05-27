# MUI Pretext React Wrapper

A high-performance, rich-text rendering module built around [`@chenglou/pretext`](https://github.com/chenglou/pretext). It provides a `<Text />` component that side-steps browser DOM reflows by mathematically pre-measuring line breaks, while deeply integrating with your MUI `theme.typography` system.

## Motivation

Text layout on the web is notoriously slow, relying on DOM reflows (`getBoundingClientRect`, `offsetHeight`) to determine where lines break. When you have rich-text with custom rules (like keywords, highlights, glowing terms, code blocks), calculating tight, shrink-wrapped containers often results in layout jank, subpixel rendering bugs, and stutter.

This wrapper utilizes `@chenglou/pretext` to measure text using the browser's raw Canvas `font` API. It computes exact `grapheme` line breaks in pure JavaScript arithmetic, creating perfectly laid out spans of text without triggering expensive browser layouts.

## Features

- ⚡️ **Zero-reflow Line Breaking:** Calculates line layouts entirely in JavaScript before rendering.
- 🎨 **Deep MUI Integration:** Extracts `fontSize`, `fontWeight`, `lineHeight`, `fontFamily` directly from your MUI `sx` objects and `typography` variants (e.g. `variant="h2"`), converting them into the exact canvas `font` shorthand needed.
- 💅 **Rich Inline Styling Engine:** Easily define dynamic keywords, code blocks, gradients, and custom markup using a simple dictionary config.
- 📏 **True `shrinkWrap` Support:** Implements dynamic buffers and exact line measurements so `width: max-content` containers hug text lines perfectly, even when manually breaking.
- ⏸️ **Explicit Line Control:** Handles `<br>` tags and raw `\n` characters naturally.
- ✂️ **Native Line Clamping:** Automatically cuts and appends CSS `text-overflow: ellipsis` on the last line when `lineClamp` is reached.

## Directory Structure

```text
Pretext/
├── index.js                     # Main entry point exporting <Text />
├── README.md                    # This file
├── Text.jsx                     # High-level React wrapper interface
├── components/
│   ├── TextImpl.jsx             # Orchestration logic bridging React and pretext math
│   ├── PretextSimpleText.jsx    # Optimized renderer for plain, unstyled text 
│   └── PretextRichText.jsx      # Heavy-lifting renderer for rich text rules 
├── hooks/
│   ├── usePretextContainerWidth.js  # ResizeObserver hook for tracking parent width
│   ├── usePretextTheme.js       # Syncs MUI typography with Canvas math
│   └── usePretextRules.jsx      # Memoized React nodes for rich styling
└── utils/
    ├── extractSxTypography.js   # Pulls typography rules out of MUI sx prop
    └── parseRichInlineText.js   # Tokenizes strings based on your config dictionary
```

## Usage

### Simple Plain Text

If you just need pixel-perfect, wrap-aware text, omit the `config` prop. It will use the highly optimized `PretextSimpleText` path.

```jsx
import { Text } from "./components/Pretext";

<Text 
  variant="body1" 
  palette="text.secondary" 
  text="Hello world, I am very fast." 
/>
```

### Rich Text Formatting

When you provide a `config` object, the wrapper switches to the `PretextRichText` path. This mode parses your text, identifies special strings, and renders them with custom React nodes—all while retaining the mathematical line-break measurements.

```jsx
import { Text } from "./components/Pretext";

const text = "MentalRentals is a platform for your precious moments.";

<Text 
  variant="body1"
  text={text}
  shrinkWrap={true}
  config={{
    // Simple semantic styles
    "MentalRentals": "highlight",
    "precious moments": "italic",
    
    // Advanced rules with arguments
    "platform": { type: "bold", args: ["primary.main"] }
  }}
/>
```

### Supported Rules out of the Box

The `usePretextRules` hook comes with several predefined types:
- `bold`, `italic`, `underline`, `strike`
- `highlight` (Glowing accent)
- `color` (Arbitrary palette color)
- `muted` (Opacity adjustment)
- `code` (Monospace block matching theme)
- `keyterm` (Dotted underline for vocab)
- `gradient` (Linear gradient text)
- `link` (External `<a>` tags)
- `internalLink` (React Router `<Link>`)
- `nowrap` (Forces `white-space: nowrap`)

## Edge Cases

- **`shrinkWrap` and the CSS Catch-22:** Because `shrinkWrap` relies on the text pushing the container to `max-content`, the module applies a `maxWidth: 100%` lock to ensure it compresses down properly when the browser shrinks. However, because the text lines lock in at this smaller pixel width, they won't automatically expand when the browser grows. 
- **Subpixel Buffering:** A `1.5%` container width `wrapBuffer` is dynamically applied during measurements to account for fractional pixel differences between the Canvas measurement and the DOM's subpixel anti-aliasing. You can disable this by passing `lazyWrapping={true}`.
