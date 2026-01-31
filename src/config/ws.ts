export const WS_CONFIG = {
  url: import.meta.env.VITE_WS_URL ?? "ws://localhost:8765",
  reconnectDelayMs: 3000,
};
