import { Box } from "@mui/material";

import type { DeviceLiveState } from "@/features/devices/live/useDeviceLiveState";
import type { Device } from "@/features/devices/types/devicesType";
import type { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import type { MicrocontrollerOnlineState } from "@/features/microcontrollers/hooks/useMicrocontrollersOnlineStatus";
import type { ProviderLiveState } from "@/features/providers/hooks/useProvidersLive";
import type { ProviderResponse } from "@/features/providers/types/userProvider";
import { DashboardDeviceCard } from "@/features/dashboard/components/DashboardDeviceCard";

export type DashboardDeviceItem = {
  device: Device;
  microcontroller: MicrocontrollerResponse;
  provider: ProviderResponse | null;
};

type DashboardDeviceListProps = {
  items: DashboardDeviceItem[];
  deviceLiveMap: Record<number, DeviceLiveState>;
  microcontrollerLiveMap: Record<string, MicrocontrollerOnlineState>;
  providerLiveMap: Record<string, ProviderLiveState>;
};

export function DashboardDeviceList({
  items,
  deviceLiveMap,
  microcontrollerLiveMap,
  providerLiveMap,
}: DashboardDeviceListProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(3, minmax(0, 1fr))",
          xl: "repeat(4, minmax(0, 1fr))",
        },
      }}
    >
      {items.map((item) => (
        <DashboardDeviceCard
          key={item.device.id}
          device={item.device}
          microcontroller={item.microcontroller}
          provider={item.provider}
          deviceLive={deviceLiveMap[item.device.id]}
          microcontrollerLive={microcontrollerLiveMap[item.microcontroller.uuid]}
          providerLive={item.provider ? providerLiveMap[item.provider.uuid] : undefined}
        />
      ))}
    </Box>
  );
}
