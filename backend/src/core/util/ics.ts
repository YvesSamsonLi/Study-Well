/**
 * RFC5545 line folding: lines must not exceed 75 octets.
 * This simple variant folds at ~70 chars with a continuation space.
 */

export const fold = (s: string) => s.replace(/(.{1,70})(?=.)/g, "$1\r\n ");

/** Escape special characters per RFC5545 (commas, semicolons, newlines). */
export const esc = (s: string) => s.replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
