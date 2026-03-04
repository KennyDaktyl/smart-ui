import { ReactNode } from "react";
import Grid from "@mui/material/Grid2";
import { Typography } from "@mui/material";

import { DeviceInfoTile } from "./DeviceInfoTile";
import type { Device } from "@/features/devices/types/devicesType";

interface DeviceDetailsInfoProps {
  device: Device;
  isAutoMode: boolean;
  modeLabel: string;
  stateLabel: string;
  onlineLabel: string;
  formattedLastUpdate: string;
  t: (key: string, opts?: any) => ReactNode;
}

export function DeviceDetailsInfo({
  device,
  isAutoMode,
  modeLabel,
  stateLabel,
  onlineLabel,
  formattedLastUpdate,
  t,
}: DeviceDetailsInfoProps) {
  return (
    <Grid container spacing={2}>
      <Grid xs={12} sm={6} md={4}>
        <DeviceInfoTile
          label={String(t("devices.details.fields.slot"))}
          value={String(device.device_number ?? "-")}
        />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
        <DeviceInfoTile
          label={String(t("devices.details.fields.power"))}
          value={
            device.rated_power != null
              ? (
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ color: (theme) => theme.palette.info.main }}
                  >
                    {`${device.rated_power} W`}
                  </Typography>
                )
              : (
                  <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                    {String(t("common.notAvailable"))}
                  </Typography>
                )
          }
        />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
        <DeviceInfoTile
          label={String(t("devices.details.fields.threshold"))}
          value={
            isAutoMode && device.threshold_value != null
              ? (
                  <Typography
                    variant="subtitle1"
                    fontWeight={600}
                    sx={{ color: (theme) => theme.palette.warning.dark }}
                  >
                    {`${device.threshold_value} W`}
                  </Typography>
                )
              : (
                  <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                    {String(t("common.notAvailable"))}
                  </Typography>
                )
          }
        />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
        <DeviceInfoTile
          label={String(t("devices.details.fields.mode"))}
          value={modeLabel}
        />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
        <DeviceInfoTile
          label={String(t("devices.details.fields.state"))}
          value={stateLabel}
        />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
        <DeviceInfoTile
          label={String(t("devices.details.fields.status"))}
          value={onlineLabel}
        />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
        <DeviceInfoTile
          label={String(t("devices.details.fields.microcontrollerId"))}
          value={
            device.microcontroller_id
              ? String(device.microcontroller_id)
              : String(t("common.notAvailable"))
          }
        />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
        <DeviceInfoTile
          label={String(t("devices.details.fields.lastUpdate"))}
          value={formattedLastUpdate}
        />
      </Grid>
    </Grid>
  );
}
