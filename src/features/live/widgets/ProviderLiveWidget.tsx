import { Stack } from "@mui/material";
import { useEffect, type ReactNode } from "react";

import { CountdownTimer } from "@/features/common/components/atoms/CountdownTimer";
import { EnergyValue } from "@/features/common/components/atoms/EnergyValue";
import { LiveIndicator } from "@/features/common/components/atoms/LiveIndicator";
import {
  useProviderLive,
  type ProviderLiveSnapshot,
  type UseProviderLiveOptions,
} from "@/features/providers/hooks/useProviderLive";

export type ProviderLiveWidgetProps = UseProviderLiveOptions & {
  children?: (live: ProviderLiveSnapshot) => ReactNode;
  onChange?: (live: ProviderLiveSnapshot) => void;
};

export function ProviderLiveWidget({
  children,
  onChange,
  ...options
}: ProviderLiveWidgetProps) {
  const live = useProviderLive(options);

  useEffect(() => {
    onChange?.(live);
  }, [
    live.countdownSec,
    live.hasWs,
    live.isStale,
    live.loading,
    live.measuredAt,
    live.nextExpectedAt,
    live.power,
    live.status,
    live.unit,
    onChange,
  ]);

  if (children) return <>{children(live)}</>;

  return (
    <Stack spacing={0.5} alignItems="flex-start">
      <Stack direction="row" spacing={1} alignItems="center">
        <LiveIndicator active={live.status === "online"} />
        <EnergyValue value={live.power} unit={live.unit} />
      </Stack>

      <CountdownTimer seconds={live.countdownSec} />
    </Stack>
  );
}
