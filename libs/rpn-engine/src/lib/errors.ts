/**
 * Error codes raised by the engine. These string literals intentionally mirror
 * the `ErrorCode` union in `@rpn/shared-types`; the API maps engine errors onto
 * the wire envelope. The engine stays dependency-free (no workspace imports).
 */
export type RpnErrorCode =
  | 'DIV_BY_ZERO'
  | 'FACTORIAL_DOMAIN'
  | 'OVERFLOW'
  | 'UNDERFLOW'
  | 'LEFTOVER_OPERANDS'
  | 'UNKNOWN_TOKEN'
  | 'EMPTY';

export abstract class RpnError extends Error {
  abstract readonly code: RpnErrorCode;

  protected constructor(message: string) {
    super(message);
    this.name = new.target.name;
    // Preserve `instanceof` across the es2015 downlevel target.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** The expression could not be parsed/reduced. `code` discriminates the reason. */
export class MalformedExpressionError extends RpnError {
  readonly code: Extract<
    RpnErrorCode,
    'UNDERFLOW' | 'LEFTOVER_OPERANDS' | 'UNKNOWN_TOKEN' | 'EMPTY'
  >;

  constructor(code: MalformedExpressionError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

/** The final (or an intermediate) result is not a finite number. */
export class OverflowError extends RpnError {
  readonly code = 'OVERFLOW';

  constructor(message = 'Result is not a finite number.') {
    super(message);
  }
}
