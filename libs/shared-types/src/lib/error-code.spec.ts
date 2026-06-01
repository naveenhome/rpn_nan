import { ERROR_CODES, ErrorCode } from './error-code';

describe('shared-types', () => {
  it('exposes every error code exactly once', () => {
    expect(new Set(ERROR_CODES).size).toBe(ERROR_CODES.length);
  });

  it('keeps ERROR_CODES and the ErrorCode union in sync', () => {
    // Compile-time guard: every literal below must be a member of ErrorCode.
    const sample: ErrorCode[] = [...ERROR_CODES];
    expect(sample).toContain('DIV_BY_ZERO');
  });
});
