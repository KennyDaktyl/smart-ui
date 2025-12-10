import { ReactNode } from "react";
import Grid from "@mui/material/Grid2";

import { DeviceInfoTile } from "./DeviceInfoTile";

interface DeviceDetailsInfoProps {
  device: any;
  modeLabel: string;
  stateLabel: string;
  onlineLabel: string;
  formattedLastUpdate: string;
  t: (key: string, opts?: any) => ReactNode;
}

export function DeviceDetailsInfo({
  device,
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
          label={t("devices.details.fields.slot")}
          value={String(device.device_number ?? "-")}
        />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
        <DeviceInfoTile
          label={t("devices.details.fields.power")}
          value={
            device.rated_power_kw != null
              ? `${device.rated_power_kw} kW`
              : t("common.notAvailable")
          }
        />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
        <DeviceInfoTile
          label={t("devices.details.fields.threshold")}
          value={
            device.threshold_kw != null ? `${device.threshold_kw} kW` : t("common.notAvailable")
          }
        />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
        <DeviceInfoTile label={t("devices.details.fields.mode")} value={modeLabel} />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
        <DeviceInfoTile label={t("devices.details.fields.state")} value={stateLabel} />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
        <DeviceInfoTile
          label={t("devices.details.fields.status")}
          value={onlineLabel}
        />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
        <DeviceInfoTile
          label={t("devices.details.fields.raspberryId")}
          value={device.raspberry_id ? String(device.raspberry_id) : t("common.notAvailable")}
        />
      </Grid>
      <Grid xs={12} sm={6} md={4}>
        <DeviceInfoTile label={t("devices.details.fields.lastUpdate")} value={formattedLastUpdate} />
      </Grid>
    </Grid>
  );
}
