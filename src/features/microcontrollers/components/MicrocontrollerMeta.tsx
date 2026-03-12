import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import type { LiveState } from "@/features/microcontrollers/hooks/useMicrocontrollerLive";

type Props = {
  microcontroller: MicrocontrollerResponse;
  live: LiveState;
};

function resolveUpdatedAt(
  liveLastSeen?: string | null,
  backendMeasuredAt?: string | null
): string | null {
  return liveLastSeen ?? backendMeasuredAt ?? null;
}

export function MicrocontrollerMeta({
  microcontroller,
  live,
}: Props) {
  const { t } = useTranslation();
  const deviceCount = microcontroller.devices?.length ?? 0;
  const assignedSensors = microcontroller.assigned_sensors ?? [];

  const backendMeasuredAt =
    microcontroller.power_provider?.last_value?.measured_at ?? null;

  const resolvedUpdatedAt = resolveUpdatedAt(
    live.lastSeen as string | null,
    backendMeasuredAt
  );

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" color="text.secondary">
        {t("microcontroller.uuid")}: {microcontroller.uuid}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("microcontroller.maxDevices")}: {deviceCount}/{microcontroller.max_devices}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("microcontroller.sensorsLabel")}:{" "}
        {assignedSensors.length > 0
          ? assignedSensors
              .map((sensor) =>
                t(`microcontroller.sensorOptions.${sensor}`, {
                  defaultValue: sensor,
                })
              )
              .join(", ")
          : t("microcontroller.form.noSensors")}
      </Typography>

      {microcontroller.software_version && (
        <Typography variant="body2" color="text.secondary">
          {t("microcontroller.software")}: {microcontroller.software_version}
        </Typography>
      )}

      <Box minHeight={20}>
        <Typography variant="caption" color="text.secondary">
          {resolvedUpdatedAt
            ? `${t("providers.live.updatedAt")} ${new Date(
                resolvedUpdatedAt
              ).toLocaleString()}`
            : "—"}
        </Typography>
      </Box>
    </Stack>
  );
}
