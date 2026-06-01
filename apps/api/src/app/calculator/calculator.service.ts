import { Injectable } from '@nestjs/common';
import { evaluate } from '@rpn/rpn-engine';
import { CalculateResponse } from '@rpn/shared-types';

@Injectable()
export class CalculatorService {
  /**
   * Evaluate an RPN expression. History persistence arrives in slice 3; until
   * then `id` is a placeholder and `saved` is false.
   */
  calculate(expression: string): CalculateResponse {
    const result = evaluate(expression);
    return {
      id: 0,
      expression,
      result,
      createdAt: new Date().toISOString(),
      saved: false,
    };
  }
}
