/**
 * Machine-readable error codes shared by the API and the web client.
 * The UI maps each code to user-friendly copy; the wire `message` is a fallback.
 */
export type ErrorCode =
  | 'DIV_BY_ZERO'
  | 'FACTORIAL_DOMAIN'
  | 'OVERFLOW'
  | 'UNDERFLOW'
  | 'LEFTOVER_OPERANDS'
  | 'UNKNOWN_TOKEN'
  | 'EMPTY'
  | 'VALIDATION'
  | 'INTERNAL';

export const ERROR_CODES: readonly ErrorCode[] = [
  'DIV_BY_ZERO',
  'FACTORIAL_DOMAIN',
  'OVERFLOW',
  'UNDERFLOW',
  'LEFTOVER_OPERANDS',
  'UNKNOWN_TOKEN',
  'EMPTY',
  'VALIDATION',
  'INTERNAL',
];
