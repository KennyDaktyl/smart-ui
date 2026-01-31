import { Stack } from "@mui/material";
import type { ReactNode } from "react";
import type { ProviderResponse } from "@/features/providers/types/userProvider";
import { useProvidersLive } from "@/features/providers/hooks/useProvidersLive";
import type { ProviderLiveState } from "@/features/providers/hooks/useProvidersLive";
import { EnergyValue } from "@/features/common/components/atoms/EnergyValue";
import { LiveIndicator } from "@/features/common/components/atoms/LiveIndicator";
import { CountdownTimer } from "@/features/common/components/atoms/CountdownTimer";

export type ProviderLiveEnergyProps = {
  provider: ProviderResponse;
  children?: (live: ProviderLiveState | undefined) => ReactNode;
};

export function ProviderLiveEnergy({ provider, children }: ProviderLiveEnergyProps) {
  const liveMap = useProvidersLive([provider]);
  const live = liveMap[provider.uuid];

  if (children) return <>{children(live)}</>;

  return (
    <Stack spacing={0.5} alignItems="flex-start">
      <Stack direction="row" spacing={1} alignItems="center">
        <LiveIndicator active={Boolean(live?.hasWs)} />
        <EnergyValue value={live?.power ?? null} unit={live?.unit ?? provider.unit ?? null} />
      </Stack>

      <CountdownTimer seconds={live?.countdownSec ?? null} />
    </Stack>
  );
}
