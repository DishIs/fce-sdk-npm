// ─────────────────────────────────────────────────────────────────────────────
//  Types — freecustom-email SDK
// ─────────────────────────────────────────────────────────────────────────────

// ── Plans ─────────────────────────────────────────────────────────────────────

export type ApiPlan =
  | 'free'
  | 'developer'
  | 'startup'
  | 'growth'
  | 'enterprise';

// ── SDK Config ────────────────────────────────────────────────────────────────

export interface FreecustomEmailConfig {
  /** Your API key — starts with fce_ */
  apiKey: string;
  /**
   * Base URL override. Defaults to https://api2.freecustom.email/v1
   * Useful for testing against a local server.
   */
  baseUrl?: string;
  /**
   * Request timeout in milliseconds. Defaults to 10000 (10s).
   */
  timeout?: number;
  /**
   * Retry config for failed requests. Defaults to 2 retries with exponential backoff.
   */
  retry?: {
    attempts: number;
    initialDelayMs: number;
  };
}

// ── API Wrapper ───────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  upgrade_url?: string;
  hint?: string;
}

// ── Inbox ─────────────────────────────────────────────────────────────────────

export interface InboxObject {
  inbox: string;
  local: string;
  domain: string;
}

export interface RegisterInboxResult {
  success: boolean;
  message: string;
  inbox: string;
}

export interface UnregisterInboxResult {
  success: boolean;
  message: string;
}

// ── Message ───────────────────────────────────────────────────────────────────

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  content?: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  text?: string;
  html?: string;
  otp: string | null;
  verificationLink: string | null;
  hasAttachment: boolean;
  wasAttachmentStripped?: boolean;
  attachments?: Attachment[];
  /** Present when OTP was detected but plan doesn't include extraction */
  _upgrade_hint?: string;
}

export interface DeleteMessageResult {
  success: boolean;
  message: string;
}

// ── OTP ───────────────────────────────────────────────────────────────────────

export interface OtpResult {
  success: true;
  otp: string | null;
  email_id?: string;
  from?: string;
  subject?: string;
  timestamp?: number;
  verification_link?: string | null;
  message?: string;
}

// ── Domains ───────────────────────────────────────────────────────────────────

export interface DomainInfo {
  domain: string;
  tier: 'free' | 'pro';
  tags: string[];
  expiring_soon?: boolean;
  expires_at?: string;
  expires_in_days?: number;
  expired?: boolean;
}

export interface CustomDomain {
  domain: string;
  verified: boolean;
  mx_record: string;
  txt_record: string;
  added_at: string | null;
}

export interface AddCustomDomainResult {
  domain: string;
  verified: boolean;
  mx_record: string;
  txt_record: string;
  added_at: string;
  dns_records: Array<{
    type: string;
    hostname: string;
    value: string;
    priority?: string;
    ttl?: string;
  }>;
  next_step: string;
}

export interface VerifyCustomDomainResult {
  success: boolean;
  verified: boolean;
  message: string;
  data?: CustomDomain;
}

export interface RemoveCustomDomainResult {
  success: boolean;
  message: string;
  inboxes_removed: string[];
}

// ── Account ───────────────────────────────────────────────────────────────────

export interface RateLimits {
  requestsPerSecond: number;
  requestsPerMonth: number;
}

export interface PlanFeatures {
  otpExtraction: boolean;
  attachments: boolean;
  maxAttachmentSizeMb: number;
  customDomains: boolean;
  websocket: boolean;
  maxWsConnections: number;
}

export interface AccountInfo {
  plan: ApiPlan;
  plan_label: string;
  price: string;
  credits: number;
  rate_limits: RateLimits;
  features: PlanFeatures;
  app_inboxes: string[];
  app_inbox_count: number;
  api_inboxes: string[];
  api_inbox_count: number;
  custom_domains: Array<{
    domain: string;
    verified: boolean;
    mx_record?: string;
    txt_record?: string;
  }>;
  custom_domain_count: number;
}

export interface UsageStats {
  plan: ApiPlan;
  requests_used: number;
  requests_limit: number;
  requests_remaining: number;
  percent_used: string;
  credits_remaining: number;
  resets: string;
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export interface Webhook {
  _id: string;
  inbox: string;
  url: string;
  createdAt: string;
  failureCount?: number;
}

export interface RegisterWebhookResult {
  success: boolean;
  id: string;
  inbox: string;
  url: string;
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

export interface WsConnectedEvent {
  type: 'connected';
  plan: ApiPlan;
  subscribed_inboxes: string[];
  connection_count: number;
  max_connections: number;
  features: {
    otp_extraction: boolean;
    attachments: boolean;
  };
}

export interface WsNewEmailEvent {
  type: 'new_email' | string;
  id: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  text?: string;
  html?: string;
  otp: string | null;
  verificationLink: string | null;
  hasAttachment: boolean;
  _upgrade_hint?: string;
}

export interface WsPongEvent {
  type: 'pong';
  ts: number;
}

export interface WsErrorEvent {
  type: 'error';
  code: string;
  message: string;
  upgrade_url?: string;
}

export type WsEvent =
  | WsConnectedEvent
  | WsNewEmailEvent
  | WsPongEvent
  | WsErrorEvent;

export interface WsClientOptions {
  /** Specific inbox to subscribe to. Leave undefined to subscribe to all registered inboxes. */
  mailbox?: string;
  /** Auto-reconnect on disconnect. Defaults to true. */
  autoReconnect?: boolean;
  /** Delay between reconnect attempts in ms. Defaults to 3000. */
  reconnectDelayMs?: number;
  /** Max reconnect attempts before giving up. Defaults to 10. */
  maxReconnectAttempts?: number;
  /** Ping interval in ms to keep connection alive. Defaults to 30000. */
  pingIntervalMs?: number;
}

// ── Errors ────────────────────────────────────────────────────────────────────

export interface FreecustomEmailErrorOptions {
  status?: number | null | undefined;
  error?: string | null | undefined;
  hint?: string | null | undefined;
  upgradeUrl?: string | null | undefined;
}
