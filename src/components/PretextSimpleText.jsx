import { useMemo } from "react";
import { prepareWithSegments, measureLineStats, layoutWithLines } from "@chenglou/pretext";
import { usePretextContainerWidth } from "../hooks/usePretextContainerWidth";

export const PretextSimpleText = ({
  text,
  font,
  lineHeight,
  prepareOptions,
  containerRef,
  lineClamp,
  align,
  shrinkWrap,
  manualNewLine,
  wrapBuffer,
  style,
}) => {
  const width = usePretextContainerWidth(containerRef);

  const prepared = useMemo(
    () => prepareWithSegments(text, font, prepareOptions),
    [text, font, prepareOptions]
  );

  const linesResult = useMemo(() => {
    if (!manualNewLine && (width == null || width <= 0)) return null;
    const dynamicBuffer = wrapBuffer !== undefined ? wrapBuffer : Math.ceil((width || 0) * 0.015);
    let layoutWidth = manualNewLine ? 999999 : (width - dynamicBuffer);
    if (shrinkWrap && !manualNewLine) {
      layoutWidth = measureLineStats(prepared, layoutWidth).maxLineWidth;
    }
    return layoutWithLines(prepared, layoutWidth, lineHeight);
  }, [prepared, width, lineHeight, shrinkWrap, manualNewLine, wrapBuffer]);

  if (linesResult === null || (!manualNewLine && width === null)) {
    return (
      <span aria-hidden="true" style={{ visibility: "hidden" }}>
        {text}
      </span>
    );
  }

  const allLines = linesResult.lines;
  const isTruncated = lineClamp != null && allLines.length > lineClamp;
  const displayLines = isTruncated ? allLines.slice(0, lineClamp) : allLines;

  const dynamicBuffer = wrapBuffer !== undefined ? wrapBuffer : Math.ceil((width || 0) * 0.015);

  return (
    <div style={{ ...style, ...(shrinkWrap && linesResult ? { width: Math.ceil(linesResult.lines.reduce((max, l) => Math.max(max, l.width), 0)) + dynamicBuffer } : {}) }}>
      {displayLines.map((line, i) => {
        const isLastClamped = isTruncated && i === lineClamp - 1;
        
        // For the clamped line, we render ALL remaining text and let CSS text-overflow handle the ellipsis
        const lineText = isLastClamped 
          ? text.slice(line.start.graphemeIndex) // Wait, start grapheme index might be wrong if it spans segments. 
            // Better to join remaining line texts!
          : line.text;

        const clampedText = isLastClamped
          ? allLines.slice(i).map(l => l.text).join("")
          : lineText;

        return (
          <span
            key={i}
            style={{
              display: "flex",
              height: lineHeight,
              whiteSpace: "nowrap",
              lineHeight: 1,
              alignItems: "center",
              justifyContent: {
                center: "center",
                right: "flex-end",
                left: "flex-start"
              }[align] || "flex-start",
              ...(isLastClamped && {
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
                display: "block", // textOverflow ellipsis doesn't work well with flex
              })
            }}
          >
            {clampedText}
          </span>
        );
      })}
    </div>
  );
};
