// ─────────────────────────────────────────────────────────────────────────────
//  Webhooks resource — freecustom-email SDK
// ─────────────────────────────────────────────────────────────────────────────
import type { HttpClient } from '../http.js';
import type {
  ApiResponse,
  Webhook,
  RegisterWebhookResult,
} from '../types.js';

export class WebhooksResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Register a webhook URL for an inbox.
   * Your URL will receive a POST request on every new email.
   * Requires Startup plan or above.
   *
   * @example
   * const hook = await client.webhooks.register(
   *   'mytest@ditube.info',
   *   'https://your-server.com/hooks/email'
   * );
   * console.log('Webhook ID:', hook.id);
   */
  async register(inbox: string, url: string): Promise<RegisterWebhookResult> {
    return this.http.request<RegisterWebhookResult>('/webhooks', {
      method: 'POST',
      body:   { inbox, url },
    });
  }

  /** List all active webhooks for your account. */
  async list(): Promise<Webhook[]> {
    const res = await this.http.request<ApiResponse<Webhook[]>>('/webhooks');
    return res.data;
  }

  /**
   * Unregister a webhook by ID.
   * @param id The webhook ID returned by register().
   */
  async unregister(id: string): Promise<{ success: boolean; message: string }> {
    return this.http.request<{ success: boolean; message: string }>(
      `/webhooks/${encodeURIComponent(id)}`,
      { method: 'DELETE' },
    );
  }
}
