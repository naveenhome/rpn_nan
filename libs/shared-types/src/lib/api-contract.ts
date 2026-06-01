import { ErrorCode } from './error-code';

/** Request body for `POST /api/v1/calculate`. */
export interface CalculateRequest {
  /** A whitespace-separated RPN expression, e.g. `"3 4 +"`. */
  expression: string;
}

/** A single persisted (or computed) calculation. */
export interface HistoryEntry {
  id: number;
  expression: string;
  result: number;
  /** ISO-8601 UTC timestamp. */
  createdAt: string;
}

/**
 * Response body for `POST /api/v1/calculate`.
 * `saved` is `false` when the calculation was computed correctly but the
 * history write failed (see decision #51) — the result is still returned.
 */
export interface CalculateResponse extends HistoryEntry {
  saved: boolean;
}

/** Liveness/readiness payload for `GET /api/v1/health`. */
export interface HealthResponse {
  status: 'ok' | 'degraded';
  db: 'up' | 'down';
}

/** Consistent error envelope returned for every 4xx/5xx (decision #26/#57). */
export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  code: ErrorCode;
}
