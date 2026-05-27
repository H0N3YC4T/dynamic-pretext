import { useState, useEffect } from "react";

export function usePretextContainerWidth(ref) {
  const [width, setWidth] = useState(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = entry.contentBoxSize && entry.contentBoxSize[0] !== void 0 
        ? entry.contentBoxSize[0].inlineSize 
        : entry.contentRect.width;
      setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}
