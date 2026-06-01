import { MalformedExpressionError } from '@rpn/rpn-engine';
import { CalculatorService } from './calculator.service';

describe('CalculatorService', () => {
  let service: CalculatorService;

  beforeEach(() => {
    service = new CalculatorService();
  });

  it('evaluates an expression and returns a structured response', () => {
    const res = service.calculate('3 4 +');
    expect(res.result).toBe(7);
    expect(res.expression).toBe('3 4 +');
    // No persistence until slice 3.
    expect(res.saved).toBe(false);
    expect(typeof res.createdAt).toBe('string');
    expect(Number.isNaN(Date.parse(res.createdAt))).toBe(false);
  });

  it('propagates engine errors to the caller', () => {
    expect(() => service.calculate('3 +')).toThrow(MalformedExpressionError);
  });
});
