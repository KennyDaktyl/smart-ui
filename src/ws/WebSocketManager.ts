type RaspberryCallback = (data: any) => void;
type InverterCallback = (data: any) => void;

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8765";

class WebSocketManager {
  private static instance: WebSocketManager;

  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null;

  private raspberrySubs = new Map<string, Set<RaspberryCallback>>();
  private inverterSubs = new Map<string, Set<InverterCallback>>();

  private isConnected = false;

  private pendingMessages: any[] = [];

  private constructor() {
    // lazy connect; only when someone subscribes
  }

  public static getInstance() {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  private ensureConnected() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.connect();
  }

  private connect() {
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      this.isConnected = true;

      for (const msg of this.pendingMessages) {
        this.ws?.send(JSON.stringify(msg));
      }
      this.pendingMessages = [];

      this.resubscribeAll();
    };

    this.ws.onclose = () => {
      this.isConnected = false;

      this.reconnectTimeout = window.setTimeout(() => {
        // reconnect only if we still have subscribers
        if (this.hasSubscribers()) {
          this.connect();
        } else {
          this.cleanupSocket();
        }
      }, 3000);
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event);
    };
  }

  private handleMessage(event: MessageEvent) {
    let msg: any;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }

    const wsEvent = this.extractEvent(msg);
    if (!wsEvent) return;

    console.log("[WS] incoming event:", wsEvent.event_type, wsEvent.payload);

    switch (wsEvent.event_type) {
      case "HEARTBEAT": {
        const heartbeat = this.normalizeHeartbeat(wsEvent.payload, wsEvent.subject);
        if (!heartbeat) return;

        const set = this.raspberrySubs.get(heartbeat.uuid);
        if (set) set.forEach((cb) => cb(heartbeat));
        return;
      }

      case "POWER_READING": {
        const inverter = this.normalizePowerReading(wsEvent.payload, wsEvent.subject);
        if (!inverter) return;

        const set = this.inverterSubs.get(inverter.serial_number);
        if (set) set.forEach((cb) => cb(inverter));
        return;
      }

      default:
        return;
    }
  }

  /**
   * Extract a normalized event with `event_type` and `payload`.
   * Supports:
   * - agent envelope `{ subject, payload: { event_type, payload } }`
   * - backend envelope `{ event_type, payload }`
   * - legacy heartbeat `{ type: "raspberry_heartbeat", data: {...} }`
   */
  private extractEvent(msg: any) {
    if (!msg) return null;

    const subject = msg.subject || msg.topic || msg.type;
    const envelope = msg.payload ?? msg.data ?? msg;

    // Legacy heartbeat without event_type
    if (msg.type === "raspberry_heartbeat" && msg.data) {
      return { event_type: "HEARTBEAT", payload: msg.data, subject };
    }

    // Envelope carries event_type
    if (envelope && envelope.event_type) {
      return {
        event_type: envelope.event_type,
        payload: envelope.payload ?? envelope.data ?? envelope,
        subject,
      };
    }

    // Root carries event_type
    if (msg.event_type) {
      return {
        event_type: msg.event_type,
        payload: msg.payload ?? msg.data ?? msg,
        subject,
      };
    }

    // Legacy inverter payload without event_type
    if ((envelope && (envelope.active_power !== undefined || envelope.serial_number || envelope.serial))) {
      return {
        event_type: "POWER_READING",
        payload: envelope,
        subject,
      };
    }

    return null;
  }

  /**
   * Normalize heartbeat payload across different message envelopes.
   * Supports nested payload and subject-derived uuid.
   */
  private normalizeHeartbeat(payload: any, subject?: string) {
    if (!payload) return null;

    const subjectParts = typeof subject === "string" ? subject.split(".") : [];
    const subjectUuid =
      subjectParts.length >= 3 && subjectParts[1] === "raspberry" ? subjectParts[2] : undefined;

    const hb = payload.payload ?? payload; // allow nested payload inside payload
    const uuid = hb.uuid ?? subjectUuid;
    if (!uuid) return null;

    const timestamp = hb.timestamp ?? hb.sent_at;

    return {
      ...hb,
      uuid,
      sent_at:
        hb.sent_at ??
        (typeof timestamp === "number" ? new Date(timestamp * 1000).toISOString() : undefined),
    };
  }

  private normalizePowerReading(payload: any, subject?: string) {
    if (!payload) return null;

    const data = payload.payload ?? payload;
    const subjectSerial = this.extractSerialFromSubject(subject);
    const serial = data.serial_number ?? data.serial ?? subjectSerial;

    if (!serial) return null;
    if (data.active_power === undefined) return null;

    return { ...data, serial_number: serial };
  }

  private extractSerialFromSubject(subject?: string) {
    if (!subject || typeof subject !== "string") return undefined;

    const parts = subject.split(".");
    const idx = parts.findIndex((p) => p === "inverter");
    if (idx !== -1 && parts[idx + 1]) return parts[idx + 1];

    return undefined;
  }

  private send(data: any) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(data));
    } else {
      this.pendingMessages.push(data);
    }
  }

  // ============================================================
  // Raspberry subscriptions
  // ============================================================
  public subscribeRaspberry(uuid: string, cb: RaspberryCallback) {
    this.ensureConnected();

    if (!this.raspberrySubs.has(uuid)) {
      this.raspberrySubs.set(uuid, new Set());
    }
    this.raspberrySubs.get(uuid)!.add(cb);

    this.syncRaspberrySubs();
  }

  public unsubscribeRaspberry(uuid: string, cb: RaspberryCallback) {
    const set = this.raspberrySubs.get(uuid);
    if (!set) return;

    set.delete(cb);

    let removed: string[] | undefined;
    if (set.size === 0) {
      this.raspberrySubs.delete(uuid);
      removed = [uuid];
    }

    this.syncRaspberrySubs(removed);
    this.maybeClose();
  }

  // ============================================================
  // Inverter subscriptions — FIXED
  // ============================================================
  public subscribeInverter(serial: string, cb: InverterCallback) {
    this.ensureConnected();

    if (!this.inverterSubs.has(serial)) {
      this.inverterSubs.set(serial, new Set());
    }

    this.inverterSubs.get(serial)!.add(cb);

    this.send({
      action: "subscribe_inverter",
      serial
    });
  }

  public unsubscribeInverter(serial: string, cb: InverterCallback) {
    const set = this.inverterSubs.get(serial);
    if (!set) return;

    set.delete(cb);

    if (set.size === 0) {
      this.inverterSubs.delete(serial);

      this.send({
        action: "unsubscribe_inverter",
        serial
      });
    }

    this.maybeClose();
  }

  private resubscribeAll() {
    // raspberries
    this.syncRaspberrySubs();

    // inverters
    for (const serial of this.inverterSubs.keys()) {
      this.send({
        action: "subscribe_inverter",
        serial
      });
    }
  }

  private syncRaspberrySubs(removed?: string[]) {
    const uuids = Array.from(this.raspberrySubs.keys());

    // Always send current snapshot
    this.send({
      action: "subscribe_many",
      uuids,
    });

    // Be explicit about removals so the server can drop stale subs
    if (removed && removed.length > 0) {
      this.send({
        action: "unsubscribe_many",
        uuids: removed,
      });
    } else if (uuids.length === 0) {
      this.send({
        action: "unsubscribe_many",
        uuids: [],
      });
    }
  }

  private hasSubscribers() {
    return this.raspberrySubs.size > 0 || this.inverterSubs.size > 0;
  }

  private maybeClose() {
    if (!this.hasSubscribers()) {
      this.cleanupSocket();
    }
  }

  private cleanupSocket() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onmessage = null;
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }
    this.isConnected = false;
    this.pendingMessages = [];
  }
}

export const wsManager = WebSocketManager.getInstance();
