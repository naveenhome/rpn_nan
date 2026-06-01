import * as fc from 'fast-check';
import { evaluate } from './evaluator';
import { MalformedExpressionError, OverflowError } from './errors';

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
