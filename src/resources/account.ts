// ─────────────────────────────────────────────────────────────────────────────
//  Account resource — freecustom-email SDK
// ─────────────────────────────────────────────────────────────────────────────
import type { HttpClient } from '../http.js';
import type { ApiResponse, AccountInfo, UsageStats } from '../types.js';

export class AccountResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get current account info — plan, credits, rate limits, inboxes.
   */
  async info(): Promise<AccountInfo> {
    const res = await this.http.request<ApiResponse<AccountInfo>>('/me');
    return res.data;
  }

  /**
   * Get monthly request usage and quota for the current billing period.
   */
  async usage(): Promise<UsageStats> {
    const res = await this.http.request<ApiResponse<UsageStats>>('/usage');
    return res.data;
  }
}
