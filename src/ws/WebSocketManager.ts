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
    this.connect();
  }

  public static getInstance() {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
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
        this.connect();
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

    const heartbeat = this.parseHeartbeat(msg);
    if (heartbeat) {
      const set = this.raspberrySubs.get(heartbeat.uuid);
      if (set) set.forEach((cb) => cb(heartbeat));
      return;
    }

    // Raspberry heartbeat
    // Inverter update
    if (msg.serial_number && msg.active_power !== undefined) {
      const set = this.inverterSubs.get(msg.serial_number);
      if (set) set.forEach((cb) => cb(msg));
      return;
    }
  }

  /**
   * Normalize heartbeat payload across different message envelopes.
   * Supports legacy `{ type: "raspberry_heartbeat", data: {...} }`
   * and new agent payload `{ subject: "...raspberry.<uuid>.heartbeat", payload: { event_type: "HEARTBEAT", payload: {...} } }`.
   */
  private parseHeartbeat(msg: any) {
    if (!msg) return null;

    // Legacy shape
    if (msg.type === "raspberry_heartbeat" && msg.data) {
      return this.normalizeHeartbeat(msg.data, msg.subject);
    }

    // New agent shape: subject string + nested payload
    const subject = msg.subject || msg.topic || msg.type;
    const envelope = msg.payload ?? msg.data;

    if (typeof subject === "string" && subject.includes(".heartbeat") && envelope) {
      const inner = envelope.payload ?? envelope; // event_type wrapper or direct payload

      // Validate heartbeat event
      if (envelope.event_type && envelope.event_type !== "HEARTBEAT") return null;

      return this.normalizeHeartbeat(inner, subject);
    }

    return null;
  }

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
    if (!this.raspberrySubs.has(uuid)) {
      this.raspberrySubs.set(uuid, new Set());
    }
    this.raspberrySubs.get(uuid)!.add(cb);

    this.send({
      action: "subscribe_many",
      uuids: Array.from(this.raspberrySubs.keys()),
    });
  }

  public unsubscribeRaspberry(uuid: string, cb: RaspberryCallback) {
    const set = this.raspberrySubs.get(uuid);
    if (!set) return;

    set.delete(cb);

    if (set.size === 0) {
      this.raspberrySubs.delete(uuid);
    }

    this.send({
      action: "subscribe_many",
      uuids: Array.from(this.raspberrySubs.keys()),
    });
  }

  // ============================================================
  // Inverter subscriptions — FIXED
  // ============================================================
  public subscribeInverter(serial: string, cb: InverterCallback) {
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
  }

  private resubscribeAll() {
    // raspberries
    this.send({
      action: "subscribe_many",
      uuids: Array.from(this.raspberrySubs.keys()),
    });

    // inverters
    for (const serial of this.inverterSubs.keys()) {
      this.send({
        action: "subscribe_inverter",
        serial
      });
    }
  }
}

export const wsManager = WebSocketManager.getInstance();
