import type { ReactNode } from "react";
import type { ProviderResponse } from "@/features/providers/types/userProvider";
import type { ProviderLiveState } from "@/features/providers/hooks/useProvidersLive";
import type { ProviderLiveSnapshot } from "@/features/providers/hooks/useProviderLive";
import { ProviderLiveWidget } from "@/features/live/widgets/ProviderLiveWidget";
import { createInitialProviderMetrics } from "@/features/providers/utils/providerLiveMetrics";

export type ProviderLiveEnergyProps = {
  provider: ProviderResponse;
  children?: (live: ProviderLiveState | undefined) => ReactNode;
};

export function ProviderLiveEnergy({ provider, children }: ProviderLiveEnergyProps) {
  const mapToLegacy = (live: ProviderLiveSnapshot): ProviderLiveState => ({
    loading: live.loading,
    hasWs: live.hasWs,
    isStale: live.isStale,
    timestamp: live.measuredAt,
    nextExpectedAt: live.nextExpectedAt,
    countdownSec: live.countdownSec,
    power: live.power,
    unit: live.unit ?? provider.unit ?? null,
    metrics:
      Object.keys(live.metrics).length > 0
        ? live.metrics
        : createInitialProviderMetrics(
            provider.last_value?.measured_value ?? null,
            provider.last_value?.measured_unit ?? provider.unit ?? null
          ),
  });

  const props = {
    uuid: provider.uuid,
    enabled: provider.enabled,
    expectedIntervalSec: provider.default_expected_interval_sec,
    initialMeasuredAt: provider.last_value?.measured_at ?? null,
    initialPower: provider.last_value?.measured_value ?? null,
    initialUnit: provider.last_value?.measured_unit ?? provider.unit ?? null,
  };

  if (children) {
    return (
      <ProviderLiveWidget {...props}>
        {(live) => children(mapToLegacy(live))}
      </ProviderLiveWidget>
    );
  }

  return <ProviderLiveWidget {...props} />;
}
