// src/ws/WebSocketManager.ts

type RaspberryCallback = (data: any) => void;
type InverterCallback = (data: any) => void;

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8765";

class WebSocketManager {
  private static instance: WebSocketManager;

  private ws: WebSocket | null = null;
  private reconnectTimeout: number | null = null;

  private raspberrySubs = new Map<string, RaspberryCallback>();
  private inverterSubs = new Map<string, InverterCallback>();

  private isConnected = false;

  // ⭐ kolejka wiadomości które mają zostać wysłane po otwarciu
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
    console.log("🌐 [WSManager] Attempting connection:", WS_URL);

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log("🟢 [WSManager] WS OPEN");

      this.isConnected = true;

      // send queue
      for (const msg of this.pendingMessages) {
        console.log("➡️ Sending queued:", msg);
        this.ws?.send(JSON.stringify(msg));
      }
      this.pendingMessages = [];

      this.resubscribeAll();
    };

    this.ws.onerror = (err) => {
      console.error("🔥 [WSManager] WebSocket ERROR:", err);
    };

    this.ws.onclose = (ev) => {
      console.warn("🔴 [WSManager] WS CLOSED", ev.code, ev.reason);
      this.isConnected = false;

      this.reconnectTimeout = window.setTimeout(() => {
        console.log("♻️ Reconnecting...");
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
      console.error("❌ WS parse error");
      return;
    }

    // -----------------------
    // 1️⃣ RASPBERRY HEARTBEAT
    // -----------------------
    if (msg.type === "raspberry_heartbeat") {
      const hb = msg.data;
      const cb = this.raspberrySubs.get(hb.uuid);
      if (cb) cb(hb);
      return;
    }

    // -----------------------
    // 2️⃣ INVERTER UPDATE (brak msg.type!)
    // -----------------------
    if (msg.serial_number && msg.active_power !== undefined) {
      const cb = this.inverterSubs.get(msg.serial_number);
      if (cb) cb(msg);
      return;
    }

    console.warn("⚠️ Unknown WS message:", msg);
  }

  private send(data: any) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.log("⏳ WS not ready → queue", data);
      this.pendingMessages.push(data);
    }
  }

  // ============================================================
  // RASPBERRY SUBSCRIPTIONS
  // ============================================================
  public subscribeRaspberry(uuid: string, cb: RaspberryCallback) {
    this.raspberrySubs.set(uuid, cb);

    this.send({
      action: "subscribe_many",
      uuids: Array.from(this.raspberrySubs.keys()),
    });
  }

  public unsubscribeRaspberry(uuid: string) {
    this.raspberrySubs.delete(uuid);

    this.send({
      action: "subscribe_many",
      uuids: Array.from(this.raspberrySubs.keys()),
    });
  }

  // ============================================================
  // INVERTER SUBSCRIPTIONS
  // ============================================================
  public subscribeInverter(serial: string, cb: InverterCallback) {
    this.inverterSubs.set(serial, cb);

    this.send({
      action: "subscribe_inverter",
      serial
    });
  }

  public unsubscribeInverter(serial: string) {
    this.inverterSubs.delete(serial);

    this.send({
      action: "unsubscribe_inverter",
      serial
    });
  }

  // ============================================================
  // RESUBSCRIBE AFTER RECONNECT
  // ============================================================
  private resubscribeAll() {
    if (this.raspberrySubs.size > 0) {
      this.send({
        action: "subscribe_many",
        uuids: Array.from(this.raspberrySubs.keys()),
      });
    }

    for (const serial of this.inverterSubs.keys()) {
      this.send({
        action: "subscribe_inverter",
        serial,
      });
    }
  }
}

export const wsManager = WebSocketManager.getInstance();
