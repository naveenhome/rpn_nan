import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { RpnError } from '@rpn/rpn-engine';
import { ApiError, ErrorCode } from '@rpn/shared-types';

interface NestErrorBody {
  error?: string;
  message?: string | string[];
}

/** Maps every thrown error onto the consistent `ApiError` wire envelope. */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    res.status(this.statusOf(exception)).json(this.bodyOf(exception));
  }

  private statusOf(exception: unknown): number {
    if (exception instanceof RpnError) return 422;
    if (exception instanceof HttpException) return exception.getStatus();
    return 500;
  }

  private bodyOf(exception: unknown): ApiError {
    if (exception instanceof RpnError) {
      return {
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: exception.message,
        code: exception.code as ErrorCode,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const body: NestErrorBody =
        typeof raw === 'string' ? { message: raw } : (raw as NestErrorBody);
      const message = Array.isArray(body.message)
        ? body.message.join('; ')
        : (body.message ?? exception.message);
      return {
        statusCode: status,
        error: body.error ?? exception.name,
        message,
        code: status === 400 ? 'VALIDATION' : 'INTERNAL',
      };
    }

    this.logger.error('Unhandled exception', exception as Error);
    return {
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.',
      code: 'INTERNAL',
    };
  }
}
