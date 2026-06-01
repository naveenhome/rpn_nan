import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApiError } from '@rpn/shared-types';
import { CalculatorApiService } from './calculator-api.service';

describe('CalculatorApiService', () => {
  let service: CalculatorApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CalculatorApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('POSTs the expression and returns the response', () => {
    let result: number | undefined;
    service.calculate('3 4 +').subscribe((res) => (result = res.result));

    const req = http.expectOne('/api/v1/calculate');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ expression: '3 4 +' });
    req.flush({
      id: 0,
      expression: '3 4 +',
      result: 7,
      createdAt: new Date().toISOString(),
      saved: false,
    });

    expect(result).toBe(7);
  });

  it('maps an error code to friendly copy', () => {
    let message: string | undefined;
    service.calculate('3 +').subscribe({
      error: (e: Error) => (message = e.message),
    });

    const body: ApiError = {
      statusCode: 422,
      error: 'Unprocessable Entity',
      message: 'Operator "+" needs two operands.',
      code: 'UNDERFLOW',
    };
    http
      .expectOne('/api/v1/calculate')
      .flush(body, { status: 422, statusText: 'Unprocessable Entity' });

    expect(message).toBe('There aren’t enough numbers for that operation.');
  });
});
