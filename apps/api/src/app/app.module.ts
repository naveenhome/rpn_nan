import { Module } from '@nestjs/common';
import { CalculatorModule } from './calculator/calculator.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [CalculatorModule],
  controllers: [HealthController],
})
export class AppModule {}
