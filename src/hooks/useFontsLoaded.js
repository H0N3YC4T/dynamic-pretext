import { useState, useEffect } from 'react';

/**
 * Hook that returns true when all document fonts have finished loading.
 * Useful for canvas-based text measurement which relies on the actual web fonts.
 */
export function useFontsLoaded() {
  const [fontsLoaded, setFontsLoaded] = useState(() => {
    if (typeof document === 'undefined' || !document.fonts) return true;
    return document.fonts.status === 'loaded';
  });

  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts) return;

    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true);
      return;
    }

    let isMounted = true;
    document.fonts.ready.then(() => {
      if (isMounted) setFontsLoaded(true);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return fontsLoaded;
}
