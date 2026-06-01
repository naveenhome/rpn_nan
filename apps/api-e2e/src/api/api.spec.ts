import axios from 'axios';
import type { ApiError, CalculateResponse } from '@rpn/shared-types';

describe('POST /api/v1/calculate', () => {
  it('evaluates an RPN expression', async () => {
    const res = await axios.post<CalculateResponse>('/api/v1/calculate', {
      expression: '3 4 +',
    });
    expect(res.status).toBe(201);
    expect(res.data.result).toBe(7);
    expect(res.data.saved).toBe(false);
  });

  it('evaluates a multi-operator expression', async () => {
    const res = await axios.post<CalculateResponse>('/api/v1/calculate', {
      expression: '3 4 + 2 *',
    });
    expect(res.status).toBe(201);
    expect(res.data.result).toBe(14);
  });

  it('returns a 422 DIV_BY_ZERO envelope for division by zero', async () => {
    const res = await axios.post('/api/v1/calculate', { expression: '5 0 /' });
    expect(res.status).toBe(422);
    expect((res.data as ApiError).code).toBe('DIV_BY_ZERO');
  });

  it('returns a 422 envelope with a code for malformed input', async () => {
    const res = await axios.post('/api/v1/calculate', { expression: '3 +' });
    expect(res.status).toBe(422);
    const body = res.data as ApiError;
    expect(body.code).toBe('UNDERFLOW');
    expect(body.statusCode).toBe(422);
  });

  it('returns a 400 VALIDATION envelope for a missing expression', async () => {
    const res = await axios.post('/api/v1/calculate', {});
    expect(res.status).toBe(400);
    expect((res.data as ApiError).code).toBe('VALIDATION');
  });
});

describe('GET /api/v1/health', () => {
  it('reports liveness', async () => {
    const res = await axios.get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.data.status).toBe('ok');
  });
});
