/* ============================================================
 * WebSocketManager
 * ============================================================
 */

type WsCallback<T = any> = (payload: T) => void;
type SubscriptionKey = `${string}:${string}`;

type WsEnvelope<T = any> = {
  subject: string;
  data: T;
};

// ============================================================
// Configuration
// ============================================================

const WS_URL =
  import.meta.env.VITE_WS_URL ?? "ws://localhost:8765";

const RECONNECT_DELAY_MS = 3000;

// ============================================================
// WebSocketManager
// ============================================================

class WebSocketManager {
  private static instance: WebSocketManager | null = null;

  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimeout: number | null = null;

  private subscribers = new Map<
    SubscriptionKey,
    Set<WsCallback>
  >();

  private pendingMessages: any[] = [];

  private constructor(
    private readonly url: string,
    private readonly reconnectDelayMs: number
  ) {}

  public static getInstance() {
    if (!this.instance) {
      this.instance = new WebSocketManager(
        WS_URL,
        RECONNECT_DELAY_MS
      );
    }
    return this.instance;
  }

  // ============================================================
  // Connection
  // ============================================================

  private ensureConnected() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    this.connect();
  }

  private connect() {
    console.info("[WS] connecting to", this.url);

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.info("[WS] connected");
      this.isConnected = true;

      for (const msg of this.pendingMessages) {
        this.ws?.send(JSON.stringify(msg));
      }
      this.pendingMessages = [];

      this.resubscribeAll();
    };

    this.ws.onclose = () => {
      console.warn("[WS] connection closed");
      this.isConnected = false;

      this.reconnectTimeout = window.setTimeout(() => {
        if (this.hasSubscribers()) {
          this.connect();
        } else {
          this.cleanupSocket();
        }
      }, this.reconnectDelayMs);
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };
  }

  // ============================================================
  // Incoming messages
  // ============================================================

  private handleMessage(event: MessageEvent) {
    let envelope: WsEnvelope;

    try {
      envelope = JSON.parse(event.data);
    } catch {
      console.warn("[WS] invalid JSON message");
      return;
    }

    if (!envelope.subject || envelope.data == null) {
      console.warn("[WS] invalid WS envelope", envelope);
      return;
    }

    const parsed = this.parseSubject(envelope.subject);
    if (!parsed) {
      console.warn("[WS] subject not matched", envelope.subject);
      return;
    }

    const key: SubscriptionKey = `${parsed.uuid}:${parsed.eventName}`;
    const callbacks = this.subscribers.get(key);

    if (!callbacks || callbacks.size === 0) return;

    // console.debug("[WS] incoming", key, envelope.data);

    // 🔥 KLUCZOWE: przekazujemy TYLKO payload
    callbacks.forEach((cb) => cb(envelope.data));
  }

  private parseSubject(subject: string) {
    const parts = subject.split(".");
    if (
      parts.length < 4 ||
      parts[0] !== "device_communication" ||
      parts[2] !== "event"
    ) {
      return null;
    }

    return {
      uuid: parts[1],
      eventName: parts.slice(3).join("_"),
    };
  }

  // ============================================================
  // Public API
  // ============================================================

  public subscribe(
    uuid: string,
    eventName: string,
    cb: WsCallback
  ) {
    this.ensureConnected();

    const key: SubscriptionKey = `${uuid}:${eventName}`;
    const subject = `device_communication.${uuid}.event.${eventName}`;

    let isFirstSubscriber = false;

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
      isFirstSubscriber = true;
    }

    this.subscribers.get(key)!.add(cb);

    if (isFirstSubscriber) {
      console.info("[WS] subscribe ->", subject);
      this.send({
        action: "subscribe",
        subject,
      });
    }
  }

  public unsubscribe(
    uuid: string,
    eventName: string,
    cb: WsCallback
  ) {
    const key: SubscriptionKey = `${uuid}:${eventName}`;
    const subject = `device_communication.${uuid}.event.${eventName}`;

    const set = this.subscribers.get(key);
    if (!set) return;

    set.delete(cb);

    if (set.size === 0) {
      console.info("[WS] unsubscribe ->", subject);
      this.subscribers.delete(key);

      this.send({
        action: "unsubscribe_many",
        subjects: [subject],
      });
    }
  }

  // ============================================================
  // Sending
  // ============================================================

  private send(data: any) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.pendingMessages.push(data);
    }
  }

  // ============================================================
  // Lifecycle
  // ============================================================

  private resubscribeAll() {
    console.info("[WS] resubscribing all");

    for (const key of this.subscribers.keys()) {
      const [uuid, eventName] = key.split(":");
      const subject = `device_communication.${uuid}.event.${eventName}`;

      this.send({
        action: "subscribe",
        subject,
      });
    }
  }

  private hasSubscribers() {
    return this.subscribers.size > 0;
  }

  private cleanupSocket() {
    console.info("[WS] cleanup socket");

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
    }

    this.ws = null;
    this.isConnected = false;
    this.pendingMessages = [];
  }
}

export const wsManager = WebSocketManager.getInstance();
