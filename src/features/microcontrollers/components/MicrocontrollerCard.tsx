import { Stack } from "@mui/material";
import Grid from "@mui/material/Grid2";

import type { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import type { Device } from "@/features/devices/types/devicesType";

import { MicrocontrollerLiveStatus } from "@/features/microcontrollers/live/MicrocontrollerLiveStatus";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DeviceSection } from "./DeviceSection";
import { MicrocontrollerBox } from "./MicrocontrollerBox";

type Props = {
  microcontroller: MicrocontrollerResponse;
  layout?: "stack" | "split";
};

export function MicrocontrollerCard({
  microcontroller,
  layout = "stack",
}: Props) {
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [devices, setDevices] = useState<Device[]>(microcontroller.devices ?? []);

  useEffect(() => {
    setDevices(microcontroller.devices ?? []);
  }, [microcontroller.devices]);

  const handleDevicesChange = useCallback((nextDevices: Device[]) => {
    setDevices(nextDevices);
  }, []);

  const microcontrollerWithDevices = useMemo(
    () => ({
      ...microcontroller,
      devices,
    }),
    [devices, microcontroller]
  );

  const availableProviders = microcontroller.available_api_providers ?? [];
  const powerProvider = microcontroller.power_provider ?? null;

  const initialProviderUuid =
    powerProvider?.uuid ?? microcontroller.config?.provider?.uuid ?? "";

  const currentProvider = useMemo(() => {
    if (powerProvider && powerProvider.uuid === initialProviderUuid) {
      return powerProvider;
    }

    return (
      availableProviders.find((p) => p.uuid === initialProviderUuid) ?? null
    );
  }, [availableProviders, powerProvider, initialProviderUuid]);

  return (
    <MicrocontrollerLiveStatus uuid={microcontroller.uuid}>
      {(live) => {
        const left = (
          <MicrocontrollerBox
            microcontroller={microcontrollerWithDevices}
            live={live}
            isAtDeviceCapacity={
              devices.length >= microcontroller.max_devices
            }
            onAddDevice={() => setAddDeviceOpen(true)}
          />
        );

        const right = (
          <DeviceSection
            microcontroller={microcontrollerWithDevices}
            live={live}
            provider={currentProvider}
            openAddDialog={addDeviceOpen}
            onCloseAddDialog={() => setAddDeviceOpen(false)}
            onDevicesChange={handleDevicesChange}
          />
        );

        if (layout === "split") {
          return (
            <Grid container spacing={3} sx={{ width: "100%" }}>
              <Grid size={{ xs: 12, md: 3 }}>
                {left}
              </Grid>
              <Grid size={{ xs: 12, md: 9 }} sx={{ minWidth: 0, px: 2 }}>
                {right}
              </Grid>
            </Grid>
          );
        }

        return (
          <Stack spacing={2}>
            {left}
            {right}
          </Stack>
        );
      }}
    </MicrocontrollerLiveStatus>
  );
}
