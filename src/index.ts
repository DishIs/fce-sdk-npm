// ─────────────────────────────────────────────────────────────────────────────
//  Public API — freecustom-email SDK
// ─────────────────────────────────────────────────────────────────────────────

export { FreecustomEmailClient } from './client.js';
export { WsClient }              from './ws-client.js';

// Errors — all named so users can instanceof check
export {
  FreecustomEmailError,
  AuthError,
  PlanError,
  RateLimitError,
  NotFoundError,
  TimeoutError,
} from './errors.js';

// All types — users can import type { Message, OtpResult, ... }
export type {
  FreecustomEmailConfig,
  ApiPlan,
  ApiResponse,
  ApiError,
  InboxObject,
  RegisterInboxResult,
  UnregisterInboxResult,
  Message,
  Attachment,
  DeleteMessageResult,
  OtpResult,
  DomainInfo,
  CustomDomain,
  AddCustomDomainResult,
  VerifyCustomDomainResult,
  RemoveCustomDomainResult,
  AccountInfo,
  UsageStats,
  RateLimits,
  PlanFeatures,
  Webhook,
  RegisterWebhookResult,
  WsClientOptions,
  WsEvent,
  WsConnectedEvent,
  WsNewEmailEvent,
  WsErrorEvent,
} from './types.js';
