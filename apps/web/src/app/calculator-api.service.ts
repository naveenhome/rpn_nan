import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiError, CalculateResponse } from '@rpn/shared-types';
import { ERROR_COPY, GENERIC_ERROR } from './error-messages';

@Injectable({ providedIn: 'root' })
export class CalculatorApiService {
  private readonly http = inject(HttpClient);

  calculate(expression: string): Observable<CalculateResponse> {
    return this.http
      .post<CalculateResponse>('/api/v1/calculate', { expression })
      .pipe(
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(this.toFriendlyMessage(err))),
        ),
      );
  }

  private toFriendlyMessage(err: HttpErrorResponse): string {
    const body = err.error as ApiError | null;
    if (body?.code && ERROR_COPY[body.code]) {
      return ERROR_COPY[body.code] as string;
    }
    return body?.message ?? GENERIC_ERROR;
  }
}
