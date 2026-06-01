/** UI chips insert typographic glyphs; normalize them to ASCII operators. */
const GLYPHS: Record<string, string> = {
  '−': '-', // − minus sign
  '×': '*', // × multiplication sign
  '÷': '/', // ÷ division sign
};

/**
 * A numeric literal: optional sign, integer/decimal, optional exponent.
 * A bare sign (e.g. `-`) is NOT a number — it is an operator token.
 */
export const NUMBER_RE = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

export function normalize(expression: string): string {
  let out = '';
  for (const ch of expression) {
    out += GLYPHS[ch] ?? ch;
  }
  return out;
}

/** Normalize glyphs, then split on any whitespace, dropping empties. */
export function tokenize(expression: string): string[] {
  return normalize(expression)
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}
