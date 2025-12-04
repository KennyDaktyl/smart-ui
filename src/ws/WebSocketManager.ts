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

    // Raspberry heartbeat
    if (msg.type === "raspberry_heartbeat") {
      const hb = msg.data;
      const set = this.raspberrySubs.get(hb.uuid);
      if (set) set.forEach((cb) => cb(hb));
      return;
    }

    // Inverter update
    if (msg.serial_number && msg.active_power !== undefined) {
      const set = this.inverterSubs.get(msg.serial_number);
      if (set) set.forEach((cb) => cb(msg));
      return;
    }
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
