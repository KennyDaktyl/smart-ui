import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { wsManager } from "@/ws/WebSocketManager";

export default function RefreshWsOnRouteChange() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    wsManager.resetSubscriptionsForRouteChange();
  }, [pathname]);

  return null;
}
