// ─────────────────────────────────────────────────────────────────────────────
//  Inboxes resource — freecustom-email SDK
// ─────────────────────────────────────────────────────────────────────────────
import type { HttpClient } from '../http.js';
import type {
  ApiResponse,
  InboxObject,
  RegisterInboxResult,
  UnregisterInboxResult,
  StartTestResult,
} from '../types.js';

export class InboxesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * Register a new disposable inbox under your API account.
   * @example
   * const result = await client.inboxes.register('mytest@ditube.info');
   */
  async register(inbox: string, isTesting?: boolean): Promise<RegisterInboxResult> {
    const body: Record<string, any> = { inbox };
    if (isTesting !== undefined) body.isTesting = isTesting;
    return this.http.request<RegisterInboxResult>('/inboxes', {
      method: 'POST',
      body,
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
  /**
   * Start a new test boundary for this inbox.
   */
  async startTest(inbox: string, testId?: string): Promise<StartTestResult> {
    const body: Record<string, any> = {};
    if (testId) body.test_id = testId;
    return this.http.request<StartTestResult>(`/inboxes/${encodeURIComponent(inbox)}/tests`, {
      method: 'POST',
      body,
    });
  }

  /**
   * Get the event timeline for a specific inbox.
   * @param inbox The inbox email address.
   * @param testId Optional test run ID to filter events.
   */
  async getTimeline(inbox: string, testId?: string): Promise<any[]> {
    const query = testId ? `?test_id=${encodeURIComponent(testId)}` : '';
    const res = await this.http.request<{ data: any[] }>(`/inboxes/${encodeURIComponent(inbox)}/timeline${query}`, { method: 'GET' });
    return res.data;
  }

  /**
   * Get delivery insights and failure flags for a specific inbox.
   * @param inbox The inbox email address.
   */
  async getInsights(inbox: string): Promise<any[]> {
    const res = await this.http.request<{ data: any[] }>(`/inboxes/${encodeURIComponent(inbox)}/insights`, { method: 'GET' });
    return res.data;
  }

  async unregister(inbox: string): Promise<UnregisterInboxResult> {
    return this.http.request<UnregisterInboxResult>(
      `/inboxes/${encodeURIComponent(inbox)}`,
      { method: 'DELETE' },
    );
  }
}
