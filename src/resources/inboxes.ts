// ─────────────────────────────────────────────────────────────────────────────
//  Inboxes resource — @freecustom/email SDK
// ─────────────────────────────────────────────────────────────────────────────
import type { HttpClient } from '../http.js';
import type {
  ApiResponse,
  InboxObject,
  RegisterInboxResult,
  UnregisterInboxResult,
} from '../types.js';

export class InboxesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Register a new disposable inbox under your API account.
   * @example
   * const result = await client.inboxes.register('mytest@ditube.info');
   */
  async register(inbox: string): Promise<RegisterInboxResult> {
    return this.http.request<RegisterInboxResult>('/inboxes', {
      method: 'POST',
      body:   { inbox },
    });
  }

  /**
   * List all inboxes registered under your API account.
   * @example
   * const inboxes = await client.inboxes.list();
   * // [{ inbox: 'mytest@ditube.info', local: 'mytest', domain: 'ditube.info' }]
   */
  async list(): Promise<InboxObject[]> {
    const res = await this.http.request<ApiResponse<InboxObject[]>>('/inboxes');
    return res.data;
  }

  /**
   * Unregister an inbox from your API account.
   */
  async unregister(inbox: string): Promise<UnregisterInboxResult> {
    return this.http.request<UnregisterInboxResult>(
      `/inboxes/${encodeURIComponent(inbox)}`,
      { method: 'DELETE' },
    );
  }
}
