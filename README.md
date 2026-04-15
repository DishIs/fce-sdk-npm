# freecustom-email — JavaScript/TypeScript SDK
# Official SDK · Disposable inboxes · OTP extraction · Real-time WebSocket
# ─────────────────────────────────────────────────────────────────────────────

## Installation

```bash
npm install freecustom-email
# or
pnpm add freecustom-email
# or
yarn add freecustom-email
```

---

## Quick Start

```typescript
import { FreecustomEmailClient } from 'freecustom-email';

const client = new FreecustomEmailClient({
  apiKey: 'fce_your_api_key_here',
});

// Register an inbox
await client.inboxes.register('mytest@ditube.info');

// Get latest OTP
const result = await client.otp.get('mytest@ditube.info');
console.log(result.otp); // '482910'

// Clean up
await client.inboxes.unregister('mytest@ditube.info');
```

---

## API Reference

### Client

```typescript
const client = new FreecustomEmailClient({
  apiKey:  'fce_...',          // required
  baseUrl: 'https://...',      // optional, defaults to https://api2.freecustom.email/v1
  timeout: 10_000,             // optional, ms, defaults to 10s
  retry: {                     // optional
    attempts:       2,
    initialDelayMs: 500,
  },
});
```

---

### Inboxes

```typescript
// Register
await client.inboxes.register('mytest@ditube.info');

// List all registered inboxes
const inboxes = await client.inboxes.list();
// [{ inbox: 'mytest@ditube.info', local: 'mytest', domain: 'ditube.info' }]

// Unregister
await client.inboxes.unregister('mytest@ditube.info');
```

---

### Messages

```typescript
// List all messages
const messages = await client.messages.list('mytest@ditube.info');

// Get a specific message
const msg = await client.messages.get('mytest@ditube.info', 'D3vt8NnEQ');
console.log(msg.subject, msg.otp, msg.verificationLink);

// Delete a message
await client.messages.delete('mytest@ditube.info', 'D3vt8NnEQ');

// Wait for a message (polling helper)
const msg = await client.messages.waitFor('mytest@ditube.info', {
  timeoutMs:      30_000,
  pollIntervalMs: 2_000,
  match: m => m.from.includes('github.com'),
});
```

---

### OTP

```typescript
// Get latest OTP (Growth plan+)
const result = await client.otp.get('mytest@ditube.info');
if (result.otp) {
  console.log('OTP:', result.otp);
  console.log('Link:', result.verification_link);
}

// Wait for OTP — polls until it arrives (Growth plan+)
const otp = await client.otp.waitFor('mytest@ditube.info', {
  timeoutMs: 30_000,
});
console.log('Got OTP:', otp);
```

---

### Full Verification Flow (convenience method)

```typescript
// Register → trigger email → wait for OTP → unregister — all in one call
const otp = await client.getOtpForInbox(
  'mytest@ditube.info',
  async () => {
    // This function should trigger your app to send the verification email
    await fetch('https://yourapp.com/api/send-verification', {
      method: 'POST',
      body: JSON.stringify({ email: 'mytest@ditube.info' }),
    });
  },
  { timeoutMs: 30_000, autoUnregister: true },
);
console.log('Verified with OTP:', otp);
```

---

### Real-time WebSocket

```typescript
// Connect to real-time email delivery (Startup plan+)
const ws = client.realtime({
  mailbox:              'mytest@ditube.info', // undefined = subscribe to all your inboxes
  autoReconnect:        true,
  reconnectDelayMs:     3_000,
  maxReconnectAttempts: 10,
  pingIntervalMs:       30_000,
});

// Event handlers
ws.on('connected', info => {
  console.log('Connected — plan:', info.plan);
  console.log('Subscribed to:', info.subscribed_inboxes);
});

ws.on('email', email => {
  console.log('New email!');
  console.log('From:', email.from);
  console.log('Subject:', email.subject);
  console.log('OTP:', email.otp);
  console.log('Link:', email.verificationLink);
});

ws.on('disconnected', ({ code, reason }) => {
  console.log('Disconnected:', code, reason);
});

ws.on('reconnecting', ({ attempt, maxAttempts }) => {
  console.log(`Reconnecting... ${attempt}/${maxAttempts}`);
});

ws.on('error', err => {
  console.error('WS error:', err.message);
  if (err.upgrade_url) console.log('Upgrade at:', err.upgrade_url);
});

// Connect
await ws.connect();

// One-time handler
ws.once('email', email => {
  console.log('First email received, removing handler');
});

// Check connection status
console.log('Connected:', ws.isConnected);

// Disconnect cleanly
ws.disconnect();
```

---

### Domains

```typescript
// List available domains on your plan
const domains = await client.domains.list();

// With expiry metadata
const domainsWithExpiry = await client.domains.listWithExpiry();

// Custom domains (Growth plan+)
const custom = await client.domains.listCustom();

const result = await client.domains.addCustom('mail.yourdomain.com');
console.log('DNS records to add:', result.dns_records);

const verification = await client.domains.verifyCustom('mail.yourdomain.com');
console.log('Verified:', verification.verified);

await client.domains.removeCustom('mail.yourdomain.com');
```

---

### Webhooks

```typescript
// Register a webhook (Startup plan+)
const hook = await client.webhooks.register(
  'mytest@ditube.info',
  'https://your-server.com/hooks/email',
);
console.log('Webhook ID:', hook.id);

// List active webhooks
const hooks = await client.webhooks.list();

// Unregister
await client.webhooks.unregister(hook.id);
```

---

### Account

```typescript
// Account info
const info = await client.account.info();
console.log(info.plan, info.credits, info.api_inbox_count);

// Usage stats
const usage = await client.account.usage();
console.log(`${usage.requests_used} / ${usage.requests_limit} requests used`);
console.log('Resets at:', usage.resets);
```

---

### Error Handling

```typescript
import {
  FreecustomEmailClient,
  AuthError,
  PlanError,
  RateLimitError,
  NotFoundError,
  TimeoutError,
  FreecustomEmailError,
} from 'freecustom-email';

try {
  const otp = await client.otp.get('mytest@ditube.info');
} catch (err) {
  if (err instanceof AuthError) {
    console.error('Invalid API key');
  } else if (err instanceof PlanError) {
    console.error('Plan too low:', err.message);
    console.error('Upgrade at:', err.upgradeUrl);
  } else if (err instanceof RateLimitError) {
    console.error('Rate limited, retry after:', err.retryAfter, 'seconds');
  } else if (err instanceof NotFoundError) {
    console.error('Inbox not found or not registered');
  } else if (err instanceof TimeoutError) {
    console.error('Request timed out');
  } else if (err instanceof FreecustomEmailError) {
    console.error(`API error [${err.status}]: ${err.message}`);
  }
}
```

---

### TypeScript Types

```typescript
import type {
  Message,
  OtpResult,
  InboxObject,
  DomainInfo,
  AccountInfo,
  UsageStats,
  WsConnectedEvent,
  WsNewEmailEvent,
} from 'freecustom-email';
```

---

## Plans

| Plan       | Price    | Req/mo     | OTP | WebSocket |
|------------|----------|------------|-----|-----------|
| Free       | Free     | 5,000      | ❌  | ❌        |
| Developer  | $7/mo    | 100,000    | ❌  | ❌        |
| Startup    | $19/mo   | 500,000    | ❌  | ✅        |
| Growth     | $49/mo   | 2,000,000  | ✅  | ✅        |
| Enterprise | $149/mo  | 10,000,000 | ✅  | ✅        |

---

## Links

- **Playground:** https://freecustom.email/api/playground
- **Docs:** https://freecustom.email/api/docs
- **Dashboard:** https://freecustom.email/api/dashboard
- **Pricing:** https://freecustom.email/api/pricing
### Observability & Debugging

```typescript
// Fetch the event timeline for an inbox
const timeline = await client.inboxes.getTimeline('test@domain.com');
console.log(timeline);

// Fetch failure insights and warnings
const insights = await client.inboxes.getInsights('test@domain.com');
console.log(insights);
```
