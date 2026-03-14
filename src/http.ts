// ─────────────────────────────────────────────────────────────────────────────
//  HTTP client — @freecustom/email SDK
//  Handles: auth headers, timeout, retry with backoff, error mapping
// ─────────────────────────────────────────────────────────────────────────────
import {
  FreecustomEmailError,
  AuthError,
  PlanError,
  RateLimitError,
  NotFoundError,
  TimeoutError,
} from './errors.js';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

interface RetryConfig {
  attempts: number;
  initialDelayMs: number;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly retry: RetryConfig;

  constructor(
    baseUrl: string,
    apiKey: string,
    timeout: number,
    retry: RetryConfig,
  ) {
    this.baseUrl   = baseUrl.replace(/\/$/, '');
    this.apiKey    = apiKey;
    this.timeout   = timeout;
    this.retry     = retry;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', body } = options;
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.retry.attempts; attempt++) {
      // Exponential backoff on retries
      if (attempt > 0) {
        const delay = this.retry.initialDelayMs * Math.pow(2, attempt - 1);
        await sleep(delay);
      }

      const controller = new AbortController();
      const timerId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: {
            Authorization:  `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent':   '@freecustom/email-sdk/1.0.0',
          },
          body:   body !== undefined ? JSON.stringify(body) : null,
          signal: options.signal ?? controller.signal,
        } as RequestInit);

        clearTimeout(timerId);
        return await this.handleResponse<T>(response);

      } catch (err: unknown) {
        clearTimeout(timerId);

        if (isAbortError(err)) {
          // Only retry on timeout if we haven't been externally aborted
          if (options.signal?.aborted) throw err;
          lastError = new TimeoutError(this.timeout);
          // Timeout — worth retrying
          continue;
        }

        // Network error — worth retrying
        if (err instanceof TypeError) {
          lastError = new FreecustomEmailError(`Network error: ${(err as Error).message}`);
          continue;
        }

        // API error — don't retry (4xx etc)
        throw err;
      }
    }

    throw lastError ?? new FreecustomEmailError('Request failed after retries');
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    let body: Record<string, unknown>;
    try {
      body = await response.json() as Record<string, unknown>;
    } catch {
      throw new FreecustomEmailError(
        `Failed to parse response (status ${response.status})`,
        { status: response.status },
      );
    }

    if (response.ok) {
      return body as T;
    }

    const message    = (body['message'] as string)    ?? response.statusText;
    const error      = (body['error'] as string)      ?? 'error';
    const hint       = (body['hint'] as string)       ?? undefined;
    const upgradeUrl = (body['upgrade_url'] as string) ?? undefined;

    switch (response.status) {
      case 401: throw new AuthError(message);
      case 403: throw new PlanError(message, upgradeUrl);
      case 404: throw new NotFoundError(message);
      case 429: {
        const retryAfter = parseInt(response.headers.get('Retry-After') ?? '1', 10);
        throw new RateLimitError(message, retryAfter);
      }
      default:
        throw new FreecustomEmailError(message, { status: response.status, error, hint, upgradeUrl });
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isAbortError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === 'AbortError' || (err as NodeJS.ErrnoException).code === 'ABORT_ERR')
  );
}
