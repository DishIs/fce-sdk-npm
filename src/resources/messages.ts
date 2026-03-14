// ─────────────────────────────────────────────────────────────────────────────
//  Messages resource — @freecustom/email SDK
// ─────────────────────────────────────────────────────────────────────────────
import type { HttpClient } from '../http.js';
import type {
  ApiResponse,
  Message,
  DeleteMessageResult,
} from '../types.js';

export class MessagesResource {
  constructor(private readonly http: HttpClient) {}

  /**
   * List all messages in a registered inbox.
   * @example
   * const messages = await client.messages.list('mytest@ditube.info');
   */
  async list(inbox: string): Promise<Message[]> {
    const res = await this.http.request<ApiResponse<Message[]>>(
      `/inboxes/${encodeURIComponent(inbox)}/messages`,
    );
    return res.data;
  }

  /**
   * Get a single message by ID.
   * @example
   * const msg = await client.messages.get('mytest@ditube.info', 'D3vt8NnEQ');
   */
  async get(inbox: string, messageId: string): Promise<Message> {
    const res = await this.http.request<ApiResponse<Message>>(
      `/inboxes/${encodeURIComponent(inbox)}/messages/${encodeURIComponent(messageId)}`,
    );
    return res.data;
  }

  /**
   * Delete a message by ID.
   */
  async delete(inbox: string, messageId: string): Promise<DeleteMessageResult> {
    return this.http.request<DeleteMessageResult>(
      `/inboxes/${encodeURIComponent(inbox)}/messages/${encodeURIComponent(messageId)}`,
      { method: 'DELETE' },
    );
  }

  /**
   * Wait for the first message that matches an optional predicate.
   * Polls on an interval until a match is found or the timeout elapses.
   *
   * @example
   * // Wait up to 30s for any email
   * const msg = await client.messages.waitFor('mytest@ditube.info');
   *
   * // Wait up to 60s for an email from a specific sender
   * const msg = await client.messages.waitFor('mytest@ditube.info', {
   *   timeoutMs: 60_000,
   *   match: msg => msg.from.includes('github.com'),
   * });
   */
  async waitFor(
    inbox: string,
    options: {
      timeoutMs?: number;
      pollIntervalMs?: number;
      match?: (message: Message) => boolean;
    } = {},
  ): Promise<Message> {
    const {
      timeoutMs      = 30_000,
      pollIntervalMs = 2_000,
      match,
    } = options;

    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
      const messages = await this.list(inbox);
      const found = match
        ? messages.find(match)
        : messages[0];

      if (found) return found;

      const remaining = deadline - Date.now();
      if (remaining <= 0) break;
      await sleep(Math.min(pollIntervalMs, remaining));
    }

    throw new Error(
      `Timed out waiting for message in ${inbox} after ${timeoutMs}ms`,
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
