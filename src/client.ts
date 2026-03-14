// ─────────────────────────────────────────────────────────────────────────────
//  FreecustomEmailClient — @freecustom/email SDK main entry point
// ─────────────────────────────────────────────────────────────────────────────
import { HttpClient }       from './http.js';
import { WsClient }         from './ws-client.js';
import { InboxesResource }  from './resources/inboxes.js';
import { MessagesResource } from './resources/messages.js';
import { OtpResource }      from './resources/otp.js';
import { DomainsResource }  from './resources/domains.js';
import { WebhooksResource } from './resources/webhooks.js';
import { AccountResource }  from './resources/account.js';
import type {
  FreecustomEmailConfig,
  WsClientOptions,
} from './types.js';

const DEFAULT_BASE_URL = 'https://api2.freecustom.email/v1';
const DEFAULT_TIMEOUT  = 10_000;
const DEFAULT_RETRY    = { attempts: 2, initialDelayMs: 500 };

export class FreecustomEmailClient {
  private readonly http: HttpClient;
  private readonly config: Required<FreecustomEmailConfig>;

  // ── Resources (fluent API: client.inboxes.list(), client.otp.get(), etc.) ──
  readonly inboxes:  InboxesResource;
  readonly messages: MessagesResource;
  readonly otp:      OtpResource;
  readonly domains:  DomainsResource;
  readonly webhooks: WebhooksResource;
  readonly account:  AccountResource;

  constructor(config: FreecustomEmailConfig) {
    if (!config.apiKey) {
      throw new Error('FreeCustom.Email SDK: apiKey is required');
    }

    this.config = {
      apiKey:  config.apiKey,
      baseUrl: config.baseUrl  ?? DEFAULT_BASE_URL,
      timeout: config.timeout  ?? DEFAULT_TIMEOUT,
      retry:   config.retry    ?? DEFAULT_RETRY,
    };

    this.http = new HttpClient(
      this.config.baseUrl,
      this.config.apiKey,
      this.config.timeout,
      this.config.retry,
    );

    this.inboxes  = new InboxesResource(this.http);
    this.messages = new MessagesResource(this.http);
    this.otp      = new OtpResource(this.http);
    this.domains  = new DomainsResource(this.http);
    this.webhooks = new WebhooksResource(this.http);
    this.account  = new AccountResource(this.http);
  }

  /**
   * Open a real-time WebSocket connection to receive emails instantly.
   * Requires Startup plan or above.
   *
   * @example
   * const ws = client.realtime({ mailbox: 'mytest@ditube.info' });
   *
   * ws.on('connected', info => {
   *   console.log('Connected — plan:', info.plan);
   * });
   *
   * ws.on('email', email => {
   *   console.log('New email from:', email.from);
   *   console.log('OTP:', email.otp);
   * });
   *
   * ws.on('disconnected', ({ code, reason }) => {
   *   console.log('Disconnected:', code, reason);
   * });
   *
   * await ws.connect();
   *
   * // Later: ws.disconnect();
   */
  realtime(options: WsClientOptions = {}): WsClient {
    // Convert HTTP base URL to WebSocket URL
    const wsBaseUrl = this.config.baseUrl
      .replace(/^https?/, 'wss')
      .replace(/\/v1$/, '/v1');

    return new WsClient(this.config.apiKey, wsBaseUrl, options);
  }

  /**
   * Convenience: register an inbox, wait for an OTP, then unregister.
   * Handles the full lifecycle in one call.
   *
   * @example
   * const otp = await client.getOtpForInbox('mytest@ditube.info', async () => {
   *   await myApp.sendVerificationEmail('mytest@ditube.info');
   * });
   * console.log('OTP:', otp);
   */
  async getOtpForInbox(
    inbox: string,
    triggerFn: () => Promise<void>,
    options: { timeoutMs?: number; autoUnregister?: boolean } = {},
  ): Promise<string> {
    const { timeoutMs = 30_000, autoUnregister = true } = options;

    await this.inboxes.register(inbox);

    try {
      await triggerFn();
      return await this.otp.waitFor(inbox, { timeoutMs });
    } finally {
      if (autoUnregister) {
        await this.inboxes.unregister(inbox).catch(() => {});
      }
    }
  }
}
