import { ErrorCode } from '@rpn/shared-types';

/** Friendly, actionable copy per error code. Falls back to the server message. */
export const ERROR_COPY: Partial<Record<ErrorCode, string>> = {
  EMPTY: 'Enter an expression to evaluate.',
  UNKNOWN_TOKEN: 'That expression contains something I don’t recognize.',
  UNDERFLOW: 'There aren’t enough numbers for that operation.',
  DIV_BY_ZERO: 'Cannot divide by zero.',
  LEFTOVER_OPERANDS:
    'That looks incomplete — check the operators and operands.',
  OVERFLOW: 'The result is too large to represent.',
  VALIDATION: 'Please enter a valid expression.',
};

export const GENERIC_ERROR = 'Something went wrong. Please try again.';
