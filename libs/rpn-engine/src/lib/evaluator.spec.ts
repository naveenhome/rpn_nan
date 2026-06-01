import * as fc from 'fast-check';
import { evaluate } from './evaluator';
import {
  DivisionByZeroError,
  MalformedExpressionError,
  OverflowError,
} from './errors';

describe('evaluate — addition (slice 1)', () => {
  it('adds two integers', () => {
    expect(evaluate('3 4 +')).toBe(7);
  });

  it('adds floating-point operands', () => {
    expect(evaluate('3.5 1.5 +')).toBe(5);
  });

  it('treats a leading minus as a negative literal', () => {
    expect(evaluate('-3 4 +')).toBe(1);
  });

  it('supports exponent notation', () => {
    expect(evaluate('1e3 1 +')).toBe(1001);
  });

  it('evaluates a chain of additions', () => {
    expect(evaluate('3 4 + 5 +')).toBe(12);
  });

  it('collapses arbitrary surrounding whitespace', () => {
    expect(evaluate('   3   4    +  ')).toBe(7);
  });
});

describe('evaluate — arithmetic (slice 2)', () => {
  it.each([
    ['10 4 -', 6],
    ['6 7 *', 42],
    ['20 4 /', 5],
    ['3 4 + 2 *', 14],
    ['2 3 4 * +', 14],
    ['100 2 / 3 -', 47],
  ])('evaluates %j → %d', (expr, expected) => {
    expect(evaluate(expr)).toBe(expected);
  });

  it.each([
    ['9 4 −', 5], // U+2212 minus
    ['6 7 ×', 42], // multiplication sign
    ['8 2 ÷', 4], // division sign
  ])('normalizes glyph operator %j → %d', (expr, expected) => {
    expect(evaluate(expr)).toBe(expected);
  });

  it.each(['5 0 /', '0 0 /', '7 0.0 /'])(
    'throws DivisionByZeroError for %j',
    (expr) => {
      expect(() => evaluate(expr)).toThrow(DivisionByZeroError);
      try {
        evaluate(expr);
      } catch (e) {
        expect((e as DivisionByZeroError).code).toBe('DIV_BY_ZERO');
      }
    },
  );

  it('multiplication is commutative for finite operands', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: -1e3, max: 1e3 }),
        fc.float({ noNaN: true, min: -1e3, max: 1e3 }),
        (a, b) => {
          expect(evaluate(`${a} ${b} *`)).toBe(evaluate(`${b} ${a} *`));
        },
      ),
    );
  });
});

describe('evaluate — malformed input', () => {
  it.each([
    ['', 'EMPTY'],
    ['   ', 'EMPTY'],
    ['3 +', 'UNDERFLOW'],
    ['3 4', 'LEFTOVER_OPERANDS'],
    ['3 4 &', 'UNKNOWN_TOKEN'],
    ['foo', 'UNKNOWN_TOKEN'],
    ['3 4 NaN +', 'UNKNOWN_TOKEN'],
  ])('throws MalformedExpressionError(%j) → %s', (expr, code) => {
    expect(() => evaluate(expr)).toThrow(MalformedExpressionError);
    try {
      evaluate(expr);
    } catch (e) {
      expect((e as MalformedExpressionError).code).toBe(code);
    }
  });
});

describe('evaluate — non-finite guard (decision #56)', () => {
  it('rejects a non-finite result as OverflowError', () => {
    expect(() => evaluate('1e308 1e308 +')).toThrow(OverflowError);
  });
});

describe('evaluate — properties', () => {
  it('addition is commutative for finite operands', () => {
    fc.assert(
      fc.property(
        fc.float({ noNaN: true, min: -1e6, max: 1e6 }),
        fc.float({ noNaN: true, min: -1e6, max: 1e6 }),
        (a, b) => {
          expect(evaluate(`${a} ${b} +`)).toBe(evaluate(`${b} ${a} +`));
        },
      ),
    );
  });
});
