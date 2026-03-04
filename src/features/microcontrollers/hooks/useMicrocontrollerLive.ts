import { useEffect, useRef, useState } from "react";
import { wsManager } from "@/ws/WebSocketManager";
import {
  DEFAULT_HEARTBEAT_TIMEOUT_MS,
  resolveHeartbeatTimeoutMs,
  resolveHeartbeatTimestampMs,
} from "@/features/microcontrollers/hooks/heartbeatTiming";

// ============================================================
// Config
// ============================================================

const HEARTBEAT_EVENT = "microcontroller_heartbeat";

// ============================================================
// Types
// ============================================================

export type LiveStatus = "pending" | "online" | "offline";

export type LiveState = {
  lastSeen: string | null;
  status: LiveStatus;
};

type MicrocontrollerHeartbeatEvent = {
  event_type?: "HEARTBEAT";
  timestamp?: number | string;
  sent_at?: number | string;
  payload?: {
    uuid?: string;
    status?: "online" | "offline";
    timestamp?: number | string;
    sent_at?: number | string;
    expected_interval_sec?: number | string;
    heartbeat_interval_sec?: number | string;
    heartbeat_interval?: number | string;
    interval_sec?: number | string;
    expectedIntervalSec?: number | string;
    heartbeatIntervalSec?: number | string;
    heartbeatInterval?: number | string;
    interval?: number | string;
    [key: string]: unknown;
  };
  data?: Record<string, unknown>;
};

type CachedMicrocontrollerLiveState = {
  state: LiveState;
  lastSeenMs: number;
  timeoutMs: number;
};

const liveStateCache = new Map<string, CachedMicrocontrollerLiveState>();

// ============================================================
// Helpers
// ============================================================

const resolveStatus = (rawStatus: unknown): LiveStatus => {
  return rawStatus === "offline" ? "offline" : "online";
};

const normalizeCachedState = (
  cachedState: CachedMicrocontrollerLiveState
): CachedMicrocontrollerLiveState => {
  if (cachedState.state.status !== "online") return cachedState;

  const timeoutMs = cachedState.timeoutMs ?? DEFAULT_HEARTBEAT_TIMEOUT_MS;
  const isExpired = Date.now() - cachedState.lastSeenMs >= timeoutMs;
  if (!isExpired) return cachedState;

  return {
    ...cachedState,
    state: {
      ...cachedState.state,
      status: "offline",
    },
  };
};

// ============================================================
// Hook
// ============================================================

export function useMicrocontrollerLive(uuid?: string) {
  const [state, setState] = useState<LiveState>({
    lastSeen: null,
    status: "pending",
  });

  const offlineTimeoutRef = useRef<number | null>(null);

  const clearOfflineTimeout = () => {
    if (offlineTimeoutRef.current != null) {
      clearTimeout(offlineTimeoutRef.current);
      offlineTimeoutRef.current = null;
    }
  };

  const setStateAndCache = (
    targetUuid: string,
    nextState: LiveState,
    lastSeenMs: number,
    timeoutMs: number
  ) => {
    setState(nextState);
    liveStateCache.set(targetUuid, {
      state: nextState,
      lastSeenMs,
      timeoutMs,
    });
  };

  const markOffline = (
    targetUuid: string,
    lastSeenMs: number,
    timeoutMs: number
  ) => {
    const lastSeen = new Date(lastSeenMs).toISOString();

    setStateAndCache(
      targetUuid,
      {
        lastSeen,
        status: "offline",
      },
      lastSeenMs,
      timeoutMs
    );
  };

  const scheduleOfflineTimeout = (
    targetUuid: string,
    lastSeenMs: number,
    timeoutMs: number
  ) => {
    clearOfflineTimeout();

    const elapsedMs = Date.now() - lastSeenMs;
    const remainingMs = Math.max(0, timeoutMs - elapsedMs);

    if (remainingMs === 0) {
      markOffline(targetUuid, lastSeenMs, timeoutMs);
      return;
    }

    offlineTimeoutRef.current = window.setTimeout(() => {
      markOffline(targetUuid, lastSeenMs, timeoutMs);
    }, remainingMs);
  };

  const applyHeartbeat = (
    event: MicrocontrollerHeartbeatEvent,
    fallbackUuid: string
  ) => {
    const payload = event.payload;
    const targetUuid =
      (typeof payload?.uuid === "string" ? payload.uuid : undefined) ??
      fallbackUuid;
    if (!targetUuid) return;

    const timestampMs = resolveHeartbeatTimestampMs(event);
    const timeoutMs = resolveHeartbeatTimeoutMs(
      event,
      DEFAULT_HEARTBEAT_TIMEOUT_MS
    );
    const status = resolveStatus(payload?.status);
    const lastSeen = new Date(timestampMs).toISOString();

    const nextState: LiveState = {
      lastSeen,
      status,
    };

    setStateAndCache(targetUuid, nextState, timestampMs, timeoutMs);

    if (status === "offline") {
      clearOfflineTimeout();
      return;
    }

    scheduleOfflineTimeout(targetUuid, timestampMs, timeoutMs);
  };

  useEffect(() => {
    if (!uuid) {
      clearOfflineTimeout();
      setState({
        lastSeen: null,
        status: "pending",
      });
      return;
    }

    const cachedLiveState = liveStateCache.get(uuid);
    if (cachedLiveState) {
      const normalizedCachedState = normalizeCachedState(cachedLiveState);
      setState(normalizedCachedState.state);
      liveStateCache.set(uuid, normalizedCachedState);

      if (normalizedCachedState.state.status === "online") {
        scheduleOfflineTimeout(
          uuid,
          normalizedCachedState.lastSeenMs,
          normalizedCachedState.timeoutMs ?? DEFAULT_HEARTBEAT_TIMEOUT_MS
        );
      } else {
        clearOfflineTimeout();
      }
    } else {
      const cachedHeartbeat = wsManager.getLastMessage<MicrocontrollerHeartbeatEvent>(
        uuid,
        HEARTBEAT_EVENT
      );

      if (cachedHeartbeat) {
        applyHeartbeat(cachedHeartbeat, uuid);
      } else {
        setState({
          lastSeen: null,
          status: "pending",
        });
        clearOfflineTimeout();
      }
    }

    const handler = (event: MicrocontrollerHeartbeatEvent) => {
      applyHeartbeat(event, uuid);
    };

    wsManager.subscribe(uuid, HEARTBEAT_EVENT, handler);

    return () => {
      clearOfflineTimeout();
      wsManager.unsubscribe(uuid, HEARTBEAT_EVENT, handler);
    };
  }, [uuid]);

  return state;
}
