# dynamic-pretext

A high-performance, rich-text React component that mathematically pre-measures line breaks to avoid DOM reflows, deeply integrated with Material UI (MUI).

This library provides a drop-in `<Text />` wrapper built on top of [`@chenglou/pretext`](https://github.com/chenglou/pretext). While `@chenglou/pretext` handles the low-level, DOM-free canvas measurements, `dynamic-pretext` bridges the gap by providing automatic MUI theme synchronization, a robust rich-inline styling engine, and standard typography property support.

## Features

- **Zero-reflow Line Breaking**: Computes exact grapheme line layouts in pure JavaScript before rendering to the DOM.
- **MUI Theme Synchronization**: Automatically parses MUI variants (e.g., `variant="h2"`) and standard typography props (`fontSize`, `lineHeight`, `color`) into the necessary Canvas shorthand formats.
- **Rich Inline Styling Engine**: Apply complex styles—such as gradients, keywords, muted text, or code blocks—via a simple configuration dictionary.
- **Shrink-Wrap Containers**: Dynamically adjusts container width to exactly fit the computed text width, eliminating layout drift.
- **Line Control**: Native support for CSS line clamping, explicit `<br>` elements, and manual newline (`\n`) parsing.
- **Standard Component Surface**: Includes standard React features such as `forwardRef` and polymorphic HTML rendering (the `component` prop).

## Installation

```bash
npm install H0N3YC4T/dynamic-pretext
```

*Peer Dependencies: `react`, `react-dom`, `@mui/material`, and `@chenglou/pretext`.*

## Usage

### Basic Rendering

At its core, `dynamic-pretext` acts as a highly optimized replacement for the standard MUI `<Typography>` component. It accepts all standard top-level typography properties.

```jsx
import { Text } from "@/components/Pretext/src";

export const WelcomeBanner = () => {
  return (
    <Text
      variant="body1"
      color="text.secondary"
      fontSize="1.125rem"
      fontWeight={500}
      lineHeight={1.6}
      component="p"
      text="Welcome to the platform. This text is mathematically measured."
    />
  );
};
```

### Rich Text Styling

By supplying a `config` object, the wrapper switches to a rich-inline measurement path. This mode parses the text block, identifies special substrings, and renders them with custom React nodes—all while retaining strict pixel-perfect line breaking without relying on the browser to flow the elements.

```jsx
import { Text } from "@/components/Pretext/src";

export const HighlightedMission = () => {
  const missionText = "DynamicPretext provides a fast, zero-reflow layout engine.";

  return (
    <Text
      variant="body1"
      text={missionText}
      config={{
        // Simple string mapping to a built-in rule
        "DynamicPretext": "highlight",

        // Complex rule targeting with arguments
        "zero-reflow layout engine": {
          type: "bold",
          args: ["primary.main"],
          exactCase: false
        }
      }}
    />
  );
};
```

### Explicit Line Breaks and Wrapping

For situations where text should never wrap automatically (e.g., code blocks or structured data), use the `manualNewLine` prop. The container will force a horizontal expansion unless an explicit `\n` or `<br>` is encountered.

```jsx
<Text
  variant="code"
  manualNewLine={true}
  text={"Line 1\nLine 2<br />Line 3"}
/>
```

## API Reference

### `<Text />` Props

The `<Text />` component forwards refs and accepts standard HTML attributes alongside the following specialized properties:

| Prop | Type | Default | Description |
|---|---|---|---|
| `text` | `string` | `""` | The raw text payload to be rendered and measured. |
| `variant` | `string` | `"body1"` | The MUI typography variant to source default `fontFamily`, `fontSize`, and `fontWeight` from. |
| `palette` | `string` | `undefined` | A dot-notation string resolving to a MUI theme color (e.g., `"primary.main"`, `"text.secondary"`). Alias for `color`. |
| `color` | `string` | `undefined` | A standard CSS color string or MUI theme path. Takes precedence over `palette`. |
| `component` | `string` | `"div"` | The underlying HTML element to render. Passing `"span"` automatically applies `display: inline-flex`. |
| `config` | `TextConfig` | `{}` | A dictionary mapping substrings or regex patterns to styling rules. |
| `shrinkWrap` | `boolean` | `false` | If `true`, the internal container compresses its width to exactly match the widest measured line. |
| `manualNewLine` | `boolean` | `false` | Disables automatic line wrapping. Text will only break on `\n` or `<br>`. Aliased as `noWrap`. |
| `lineClamp` | `number` | `undefined` | Implements CSS `text-overflow: ellipsis` on the specified terminal line limit. |
| `align` | `string` | `"left"` | Horizontal text alignment (`"left"`, `"center"`, `"right"`). Automatically adjusts `margin` alignment when combined with `shrinkWrap`. |
| `wrapBuffer` | `number` | `1.5% of width` | Subpixel buffer (in px) applied to measurements to prevent fractional pixel rendering overflow. |
| `lazyWrapping` | `boolean` | `false` | Disables the internal `wrapBuffer`. |

### Standard Typography Overrides

The wrapper accepts direct top-level props which will strictly override any inherited `variant` defaults:
- `fontSize` (e.g., `14`, `"14px"`, `"1.2rem"`)
- `fontWeight` (e.g., `700`, `"bold"`)
- `lineHeight` (e.g., `1.8`, `"24px"`)
- `letterSpacing` (e.g., `"0.5px"`)
- `textTransform` (e.g., `"uppercase"`)

### `TextConfig` Dictionary

The `config` object takes the following shape:
```ts
type TextConfig = Record<string, string | RuleDef>;

interface RuleDef {
  type: string;
  args?: string[];
  exactCase?: boolean; // Defaults to false
  isRegex?: boolean;   // Defaults to false
}
```

**Built-in Rule Types:**
- `bold`: Standard strong weight (`args: [colorPath]`)
- `italic`: Emphasized text
- `underline`: Text with a 3px underline offset (`args: [colorPath]`)
- `strike`: Line-through decoration
- `highlight`: A glowing accent treatment with `textShadow` (`args: [colorPath]`)
- `color`: Standard color application (`args: [colorPath]`)
- `muted`: Reduced opacity text (`args: [opacityFloat]`)
- `code`: Monospace span with a themed background and border
- `keyterm`: Dotted underline for vocab definitions (`args: [colorPath]`)
- `gradient`: Linear gradient text (`args: [startColorPath, endColorPath]`)
- `link`: External `<a>` anchor rendering
- `internalLink`: React Router `<Link>` rendering (`args: [routePath, colorPath]`)
- `nowrap`: Applies `whiteSpace: "nowrap"` to the specific substring

## Architecture & Edge Cases

- **ResizeObservation**: The component strictly binds a `ResizeObserver` to its parent container. Initial render paths will mount with `visibility: hidden` if the available width is completely unknown (e.g., zero), waiting for the DOM to settle before painting the measured layout.
- **The `shrinkWrap` Lock**: `shrinkWrap` operates by assigning a precise pixel value to the `width` property based on the longest text segment. To prevent cascading overflow in shrinking viewports, `maxWidth: 100%` is applied simultaneously. Note that if the parent container dynamically grows, a `shrinkWrap` element will remain locked at its previously measured pixel width until re-measured.
- **Subpixel Buffering (`wrapBuffer`)**: Canvas API measurements often differ from DOM text painting by microscopic fractions of a pixel due to browser anti-aliasing engines. By default, `dynamic-pretext` applies a minor 1.5% buffer to width calculations to prevent unexpected single-word overflows.
