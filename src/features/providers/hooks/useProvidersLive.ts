import { useEffect, useState } from "react";
import { wsManager } from "@/ws/WebSocketManager";
import { ProviderResponse } from "../types/userProvider";

type ProviderLiveState = {
  power: number | null;
  timestamp: string | null;
  loading: boolean;
  hasWs: boolean;
};

export function useProvidersLive(providers: ProviderResponse[]) {
  const [state, setState] = useState<Record<string, ProviderLiveState>>({});

  useEffect(() => {
    console.log("[useProvidersLive] providers:", providers);

    const unsubscribers: (() => void)[] = [];

    providers.forEach((p) => {
      if (!p.external_id) return;

      console.log("[WS] subscribe_inverter", p.external_id);

      // INIT spinner
      setState((prev) => ({
        ...prev,
        [p.uuid]: {
          power: null,
          timestamp: null,
          loading: true,
          hasWs: false,
        },
      }));

      const handler = (data: any) => {
        console.log("[WS] data", p.external_id, data);

        setState((prev) => ({
          ...prev,
          [p.uuid]: {
            power: data.active_power ?? null,
            timestamp: data.timestamp ?? null,
            loading: false,
            hasWs: true,
          },
        }));
      };

      wsManager.subscribeInverter(p.external_id, handler);

      // ⏱️ max spinner 3s
      const timeout = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          [p.uuid]: {
            ...prev[p.uuid],
            loading: false,
          },
        }));
      }, 3000);

      unsubscribers.push(() => {
        console.log("[WS] unsubscribe_inverter", p.external_id);
        clearTimeout(timeout);
        wsManager.unsubscribeInverter(p.external_id!, handler);
      });
    });

    // ✅ JEDYNY PRAWIDŁOWY CLEANUP
    return () => {
      unsubscribers.forEach((fn) => fn());
    };
  }, [providers]);

  return state;
}
