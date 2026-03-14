// ─────────────────────────────────────────────────────────────────────────────
//  WebSocket Client — freecustom-email SDK
//
//  Handles:
//    - Auto-reconnect with exponential backoff
//    - Ping / pong keepalive
//    - Typed events via EventEmitter-style API
//    - Works in Node.js (uses ws package) and browser (uses native WebSocket)
// ─────────────────────────────────────────────────────────────────────────────
import type {
  WsClientOptions,
  WsEvent,
  WsConnectedEvent,
  WsNewEmailEvent,
  WsErrorEvent,
} from './types.js';

type EventMap = {
  connected:    WsConnectedEvent;
  email:        WsNewEmailEvent;
  error:        WsErrorEvent;
  disconnected: { code: number; reason: string };
  reconnecting: { attempt: number; maxAttempts: number };
  close:        void;
};

type EventHandler<K extends keyof EventMap> = (event: EventMap[K]) => void;

// Works in both Node.js (ws) and browser (native WebSocket)
// We use a lazy import to avoid bundling ws in browser builds
async function createWs(url: string): Promise<WebSocket> {
  if (typeof globalThis.WebSocket !== 'undefined') {
    return new globalThis.WebSocket(url);
  }
  // Node.js — dynamically import ws
  const wsModule = await import('ws') as any;
  const WsClass = wsModule.default || wsModule;
  return new WsClass(url) as unknown as WebSocket;
}

export class WsClient {
  private readonly apiKey: string;
  private readonly baseWsUrl: string;
  private readonly options: Required<WsClientOptions>;

  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;

  // Event listeners
  private listeners = new Map<keyof EventMap, Set<EventHandler<any>>>();

  constructor(apiKey: string, baseWsUrl: string, options: WsClientOptions = {}) {
    this.apiKey    = apiKey;
    this.baseWsUrl = baseWsUrl.replace(/^http/, 'ws');
    this.options   = {
      mailbox:              options.mailbox              ?? undefined as unknown as string,
      autoReconnect:        options.autoReconnect        ?? true,
      reconnectDelayMs:     options.reconnectDelayMs     ?? 3_000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
      pingIntervalMs:       options.pingIntervalMs       ?? 30_000,
    };
  }

  // ── Connection ─────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const url = this.buildUrl();
    this.ws = await createWs(url);
    this.attachHandlers();
  }

  disconnect(): void {
    this.closed = true;
    this.clearTimers();
    this.ws?.close(1000, 'Client disconnect');
    this.ws = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ── Event API ──────────────────────────────────────────────────────────────

  on<K extends keyof EventMap>(event: K, handler: EventHandler<K>): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler<any>);
    return this;
  }

  off<K extends keyof EventMap>(event: K, handler: EventHandler<K>): this {
    this.listeners.get(event)?.delete(handler as EventHandler<any>);
    return this;
  }

  once<K extends keyof EventMap>(event: K, handler: EventHandler<K>): this {
    const wrapper = (data: EventMap[K]) => {
      handler(data);
      this.off(event, wrapper);
    };
    return this.on(event, wrapper);
  }

  private emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    this.listeners.get(event)?.forEach(h => {
      try { h(data); } catch (_) { /* never let a user handler crash the client */ }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private buildUrl(): string {
    const url = new URL(`${this.baseWsUrl}/ws`);
    url.searchParams.set('api_key', this.apiKey);
    if (this.options.mailbox) {
      url.searchParams.set('mailbox', this.options.mailbox);
    }
    return url.toString();
  }

  private attachHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(
          typeof event.data === 'string' ? event.data : event.data.toString(),
        ) as WsEvent;

        switch (data.type) {
          case 'connected':
            this.emit('connected', data as WsConnectedEvent);
            break;
          case 'pong':
            // keepalive — no action needed
            break;
          case 'error':
            this.emit('error', data as WsErrorEvent);
            break;
          default:
            // All other events are email events
            this.emit('email', data as WsNewEmailEvent);
            break;
        }
      } catch (_) {
        // Ignore malformed frames
      }
    };

    this.ws.onclose = (event) => {
      this.clearTimers();
      const closeData = { code: event.code, reason: event.reason ?? '' };
      this.emit('disconnected', closeData);

      if (!this.closed && this.options.autoReconnect) {
        this.scheduleReconnect();
      } else {
        this.emit('close', undefined as unknown as void);
      }
    };

    this.ws.onerror = () => {
      // onerror always fires before onclose in the browser — let onclose handle reconnect
    };
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.options.pingIntervalMs);
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.emit('close', undefined as unknown as void);
      return;
    }

    this.reconnectAttempts++;
    const delay = this.options.reconnectDelayMs * Math.pow(1.5, this.reconnectAttempts - 1);

    this.emit('reconnecting', {
      attempt:     this.reconnectAttempts,
      maxAttempts: this.options.maxReconnectAttempts,
    });

    this.reconnectTimer = setTimeout(async () => {
      if (!this.closed) {
        await this.connect();
      }
    }, delay);
  }

  private clearTimers(): void {
    if (this.pingTimer)     { clearInterval(this.pingTimer);    this.pingTimer     = null; }
    if (this.reconnectTimer){ clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
  }
}
