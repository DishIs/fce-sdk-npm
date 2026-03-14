// ─────────────────────────────────────────────────────────────────────────────
//  Errors — freecustom-email SDK
// ─────────────────────────────────────────────────────────────────────────────
import type { FreecustomEmailErrorOptions } from './types.js';

export class FreecustomEmailError extends Error {
  /** HTTP status code (if applicable) */
  readonly status?: number | null | undefined;
  /** API error code e.g. "invalid_api_key", "inbox_not_owned" */
  readonly code?: string | null | undefined;
  /** Hint from the API about how to resolve the issue */
  readonly hint?: string | null | undefined;
  /** Link to upgrade page if this is a plan restriction */
  readonly upgradeUrl?: string | null | undefined;

  constructor(message: string, options: FreecustomEmailErrorOptions = {}) {
    super(message);
    this.name = 'FreecustomEmailError';
    this.status = options.status;
    this.code = options.error;
    this.hint = options.hint;
    this.upgradeUrl = options.upgradeUrl;
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FreecustomEmailError);
    }
  }
}

export class AuthError extends FreecustomEmailError {
  constructor(message = 'Invalid or missing API key') {
    super(message, { status: 401, error: 'unauthorized' });
    this.name = 'AuthError';
  }
}

export class PlanError extends FreecustomEmailError {
  constructor(message: string, upgradeUrl?: string) {
    super(message, { status: 403, error: 'plan_required', upgradeUrl });
    this.name = 'PlanError';
  }
}

export class RateLimitError extends FreecustomEmailError {
  readonly retryAfter?: number | undefined;
  constructor(message: string, retryAfter?: number) {
    super(message, { status: 429, error: 'rate_limit_exceeded' });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class NotFoundError extends FreecustomEmailError {
  constructor(message: string) {
    super(message, { status: 404, error: 'not_found' });
    this.name = 'NotFoundError';
  }
}

export class TimeoutError extends FreecustomEmailError {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}
