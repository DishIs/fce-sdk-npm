// ─────────────────────────────────────────────────────────────────────────────
//  OTP resource — @freecustom/email SDK
// ─────────────────────────────────────────────────────────────────────────────
import type { HttpClient } from '../http.js';
import type { OtpResult } from '../types.js';

export class OtpResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get the latest OTP from an inbox.
   * Returns null in the otp field if no OTP-containing email was found.
   * Requires Growth plan or above.
   *
   * @example
   * const result = await client.otp.get('mytest@ditube.info');
   * if (result.otp) {
   *   console.log('OTP:', result.otp);
   *   console.log('Link:', result.verification_link);
   * }
   */
  async get(inbox: string): Promise<OtpResult> {
    return this.http.request<OtpResult>(
      `/inboxes/${encodeURIComponent(inbox)}/otp`,
    );
  }

  /**
   * Poll for an OTP until one arrives or the timeout elapses.
   * Most useful in test automation where you trigger a sign-up
   * and then wait for the OTP email.
   *
   * @example
   * // Trigger your sign-up flow
   * await myApp.signUp({ email: 'mytest@ditube.info' });
   *
   * // Wait up to 30s for the OTP
   * const otp = await client.otp.waitFor('mytest@ditube.info');
   * console.log('Got OTP:', otp); // '482910'
   */
  async waitFor(
    inbox: string,
    options: {
      timeoutMs?: number;
      pollIntervalMs?: number;
    } = {},
  ): Promise<string> {
    const {
      timeoutMs      = 30_000,
      pollIntervalMs = 2_000,
    } = options;

    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const result = await this.get(inbox);
      if (result.otp) return result.otp;

      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      await sleep(Math.min(pollIntervalMs, remaining));
    }

    throw new Error(
      `Timed out waiting for OTP in ${inbox} after ${timeoutMs}ms`,
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
