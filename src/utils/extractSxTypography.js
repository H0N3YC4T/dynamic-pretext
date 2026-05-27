/**
 * Pick the typography-relevant keys from an sx object so they can be fed into
 * the pretext font/layout calculation.
 *
 * @typedef {Object} SxExtract
 * @property {number|string|undefined} lineHeight
 * @property {number|string|undefined} fontWeight
 * @property {number|string|undefined} fontSize
 * @property {number|string|undefined} letterSpacing
 * @property {string|undefined}        whiteSpace
 * @property {string|undefined}        wordBreak
 *
 * @param {Record<string,unknown>|undefined} sx
 * @returns {SxExtract}
 */
export const extractSxTypography = (sx) => ({
  lineHeight:    sx?.lineHeight,
  fontWeight:    sx?.fontWeight,
  fontSize:      sx?.fontSize,
  letterSpacing: sx?.letterSpacing,
  whiteSpace:    sx?.whiteSpace,
  wordBreak:     sx?.wordBreak,
  textTransform: sx?.textTransform,
});
