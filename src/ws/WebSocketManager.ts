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
const UNSUBSCRIBE_DEBOUNCE_MS = 250;
const IS_DEV = import.meta.env.DEV;

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

  private lastMessages = new Map<SubscriptionKey, unknown>();

  private pendingUnsubscribes = new Map<
    SubscriptionKey,
    number
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

    this.lastMessages.set(key, envelope.data);

    if (IS_DEV) {
      console.debug("[WS] incoming", {
        subject: envelope.subject,
        parsedEvent: parsed.eventName,
        key,
        callbacks: callbacks?.size ?? 0,
      });
    }

    if (!callbacks || callbacks.size === 0) return;

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
    this.cancelPendingUnsubscribe(key);

    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
      isFirstSubscriber = true;
    }

    this.subscribers.get(key)!.add(cb);

    if (isFirstSubscriber) {
      console.info("[WS] subscribe ->", subject, eventName, uuid);
      this.send({
        action: "subscribe",
        subject,
        uuid,
        event: eventName,
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
      this.subscribers.delete(key);
      this.scheduleUnsubscribe(key, subject);
    }
  }

  public getLastMessage<T = unknown>(
    uuid: string,
    eventName: string
  ): T | null {
    const key: SubscriptionKey = `${uuid}:${eventName}`;
    const cached = this.lastMessages.get(key);
    return (cached as T | undefined) ?? null;
  }

  public refreshAllSubscriptions() {
    const entries = Array.from(this.subscribers.keys())
      .map((key) => {
        const [uuid, ...eventParts] = key.split(":");
        const eventName = eventParts.join(":");
        if (!uuid || !eventName) return null;

        const subject = `device_communication.${uuid}.event.${eventName}`;
        return { key, uuid, eventName, subject };
      })
      .filter(
        (
          entry
        ): entry is {
          key: SubscriptionKey;
          uuid: string;
          eventName: string;
          subject: string;
        } => entry != null
      );

    if (entries.length === 0) return;

    entries.forEach((entry) => {
      this.cancelPendingUnsubscribe(entry.key);
    });

    this.ensureConnected();

    console.info("[WS] refresh subscriptions ->", entries.length);
    this.send({
      action: "unsubscribe_many",
      subjects: entries.map((entry) => entry.subject),
    });

    entries.forEach((entry) => {
      this.send({
        action: "subscribe",
        subject: entry.subject,
        uuid: entry.uuid,
        event: entry.eventName,
      });
    });
  }

  public resetSubscriptionsForRouteChange() {
    const entries = Array.from(this.subscribers.keys())
      .map((key) => {
        const [uuid, ...eventParts] = key.split(":");
        const eventName = eventParts.join(":");
        if (!uuid || !eventName) return null;

        const subject = `device_communication.${uuid}.event.${eventName}`;
        return { key, subject };
      })
      .filter(
        (
          entry
        ): entry is {
          key: SubscriptionKey;
          subject: string;
        } => entry != null
      );

    if (entries.length > 0) {
      entries.forEach((entry) => {
        this.cancelPendingUnsubscribe(entry.key);
      });

      console.info("[WS] route reset -> unsubscribe_many", entries.length);
      this.send({
        action: "unsubscribe_many",
        subjects: entries.map((entry) => entry.subject),
      });
    }

    this.pendingUnsubscribes.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.pendingUnsubscribes.clear();
    this.subscribers.clear();
  }

  public disconnect() {
    console.info("[WS] disconnect requested");

    this.pendingUnsubscribes.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.pendingUnsubscribes.clear();

    this.subscribers.clear();
    this.lastMessages.clear();

    this.cleanupSocket();
  }

  // ============================================================
  // Sending
  // ============================================================

  private send(data: any) {
    if (IS_DEV && data?.action) {
      if (data.action === "unsubscribe_many") {
        console.info("[WS] send unsubscribe_many", data);
      } else {
        console.debug("[WS] send", data.action, data);
      }
    }

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

  private cancelPendingUnsubscribe(key: SubscriptionKey) {
    const timeout = this.pendingUnsubscribes.get(key);
    if (timeout == null) return false;
    clearTimeout(timeout);
    this.pendingUnsubscribes.delete(key);
    return true;
  }

  private scheduleUnsubscribe(
    key: SubscriptionKey,
    subject: string
  ) {
    this.cancelPendingUnsubscribe(key);

    const timeout = window.setTimeout(() => {
      this.pendingUnsubscribes.delete(key);

      const set = this.subscribers.get(key);
      if (set && set.size > 0) return;

      console.info("[WS] unsubscribe ->", subject);
      this.send({
        action: "unsubscribe_many",
        subjects: [subject],
      });
    }, UNSUBSCRIBE_DEBOUNCE_MS);

    this.pendingUnsubscribes.set(key, timeout);
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

    this.pendingUnsubscribes.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.pendingUnsubscribes.clear();

    this.ws = null;
    this.isConnected = false;
    this.pendingMessages = [];
  }
}

export const wsManager = WebSocketManager.getInstance();
