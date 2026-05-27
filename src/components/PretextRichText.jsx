import { Fragment, useMemo } from "react";
import { prepareRichInline, walkRichInlineLineRanges, materializeRichInlineLineRange, measureRichInlineStats } from "@chenglou/pretext/rich-inline";
import { usePretextContainerWidth } from "../hooks/usePretextContainerWidth";

export const PretextRichText = ({
  items,
  tokens,
  rulesEngine,
  lineHeight,
  containerRef,
  lineClamp,
  align,
  shrinkWrap,
  manualNewLine,
  wrapBuffer,
  style,
}) => {
  const width = usePretextContainerWidth(containerRef);
  const prepared = useMemo(() => prepareRichInline(items), [items]);
  const { lines, computedWidth, dynamicBuffer } = useMemo(() => {
    if (!manualNewLine && (width == null || width <= 0)) return { lines: null, computedWidth: null, dynamicBuffer: 0 };
    const dynBuf = wrapBuffer !== undefined ? wrapBuffer : Math.ceil((width || 0) * 0.015);
    let layoutWidth = manualNewLine ? 999999 : (width - dynBuf);
    if (shrinkWrap && !manualNewLine) {
      layoutWidth = measureRichInlineStats(prepared, layoutWidth).maxLineWidth;
    }
    const computedLines = [];
    walkRichInlineLineRanges(prepared, layoutWidth, (lineRange) => {
       computedLines.push(materializeRichInlineLineRange(prepared, lineRange));
    });
    return { lines: computedLines, computedWidth: layoutWidth, dynamicBuffer: dynBuf };
  }, [prepared, width, shrinkWrap, manualNewLine, wrapBuffer]);

  if (lines === null || (!manualNewLine && width === null)) {

    return (
      <span aria-hidden="true" style={{ visibility: "hidden" }}>
        {items.map(i => i.text).join("")}
      </span>
    );
  }

  const isTruncated = lineClamp != null && lines.length > lineClamp;
  const displayLines = isTruncated ? lines.slice(0, lineClamp) : lines;

  return (
    <div style={{ ...style, ...(shrinkWrap && computedWidth ? { width: Math.ceil(computedWidth) + dynamicBuffer } : {}) }}>
      {displayLines.map((line, i) => {
        const isLastClamped = isTruncated && i === lineClamp - 1;
        let displayFragments = line.fragments;
        if (isLastClamped) {
          displayFragments = lines.slice(i).flatMap(l => l.fragments);
        }

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
            {displayFragments.map((fragment, fIndex) => {
              const token = tokens[fragment.itemIndex];
              const textContent = fragment.text;

              let node = textContent;
              if (token.isProcessed) {
                node = rulesEngine[token.type](
                  textContent,
                  `frag-${i}-${fIndex}`,
                  ...token.args
                );
              }

              return (
                <Fragment key={fIndex}>
                  {fragment.gapBefore > 0 && (
                    <span style={{ display: "inline-block", width: fragment.gapBefore, flexShrink: 0 }} />
                  )}
                  {node}
                </Fragment>
              );
            })}
          </span>
        );
      })}
    </div>
  );
};
