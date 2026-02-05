import Grid from "@mui/material/Grid2";
import { Stack } from "@mui/material";

import type { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";

import { MicrocontrollerLiveStatus } from "@/features/microcontrollers/live/MicrocontrollerLiveStatus";
import { MicrocontrollerBox } from "./MicrocontrollerBox";
import { DeviceSection } from "./DeviceSection";
import { useMemo, useState } from "react";

type Props = {
  microcontroller: MicrocontrollerResponse;
  layout?: "stack" | "split";
};

export function MicrocontrollerCard({
  microcontroller,
  layout = "stack",
}: Props) {
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);

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
            microcontroller={microcontroller}
            live={live}
            onAddDevice={() => setAddDeviceOpen(true)}
          />
        );

        const right = (
          <DeviceSection
            microcontroller={microcontroller}
            live={live}
            provider={currentProvider}
            openAddDialog={addDeviceOpen}
            onCloseAddDialog={() => setAddDeviceOpen(false)}
          />
        );

        if (layout === "split") {
          return (
            <Grid container spacing={3} sx={{ width: "100%" }}>
              <Grid size={{ xs: 12, md: 3 }}>
                {left}
              </Grid>
              <Grid size={{ xs: 12, md: 9 }} sx={{ minWidth: 0 }}>
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
