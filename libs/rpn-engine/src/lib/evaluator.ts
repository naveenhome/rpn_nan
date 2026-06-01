import {
  DivisionByZeroError,
  MalformedExpressionError,
  OverflowError,
} from './errors';
import { NUMBER_RE, tokenize } from './tokenizer';

type BinaryOp = (a: number, b: number) => number;

// Binary operators keyed by token; new operators extend this map.
const BINARY_OPS: Record<string, BinaryOp> = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => {
    if (b === 0) {
      throw new DivisionByZeroError();
    }
    return a / b;
  },
};

/** Evaluate a whitespace-separated RPN expression to a finite float64. */
export function evaluate(expression: string): number {
  const tokens = tokenize(expression);
  if (tokens.length === 0) {
    throw new MalformedExpressionError('EMPTY', 'Expression is empty.');
  }

  const stack: number[] = [];
  for (const token of tokens) {
    if (NUMBER_RE.test(token)) {
      stack.push(Number(token));
      continue;
    }

    const binary = BINARY_OPS[token];
    if (binary) {
      if (stack.length < 2) {
        throw new MalformedExpressionError(
          'UNDERFLOW',
          `Operator "${token}" needs two operands.`,
        );
      }
      const b = stack.pop() as number;
      const a = stack.pop() as number;
      stack.push(binary(a, b));
      continue;
    }

    throw new MalformedExpressionError(
      'UNKNOWN_TOKEN',
      `Unknown token "${token}".`,
    );
  }

  if (stack.length !== 1) {
    throw new MalformedExpressionError(
      'LEFTOVER_OPERANDS',
      'Expression did not reduce to a single value.',
    );
  }

  const result = stack[0];
  if (!Number.isFinite(result)) {
    throw new OverflowError();
  }
  return result;
}
