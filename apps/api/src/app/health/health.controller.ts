import { Controller, Get } from '@nestjs/common';
import { HealthResponse } from '@rpn/shared-types';

// GET /api/v1/health — DB reports 'down' until persistence lands in slice 3.
@Controller('health')
export class HealthController {
  @Get()
  health(): HealthResponse {
    return { status: 'ok', db: 'down' };
  }
}
