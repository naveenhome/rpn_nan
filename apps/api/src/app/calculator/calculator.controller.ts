import { Body, Controller, Post } from '@nestjs/common';
import { CalculateResponse } from '@rpn/shared-types';
import { CalculatorService } from './calculator.service';
import { CalculateRequestDto } from './dto/calculate-request.dto';

// Global prefix `api` + default URI version `v1` → POST /api/v1/calculate
@Controller('calculate')
export class CalculatorController {
  constructor(private readonly calculator: CalculatorService) {}

  @Post()
  calculate(@Body() body: CalculateRequestDto): CalculateResponse {
    return this.calculator.calculate(body.expression);
  }
}
