import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { alpha } from "@mui/material/styles";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { CardShell } from "@/features/common/components/CardShell";
import { ProviderPowerGauge } from "@/features/dashboard/components/ProviderPowerGauge";
import type { DeviceLiveState } from "@/features/devices/live/useDeviceLiveState";
import type { Device } from "@/features/devices/types/devicesType";
import type { MicrocontrollerOnlineState } from "@/features/microcontrollers/hooks/useMicrocontrollersOnlineStatus";
import type { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import type { ProviderLiveState } from "@/features/providers/hooks/useProvidersLive";
import type { ProviderResponse } from "@/features/providers/types/userProvider";

type DashboardDeviceCardProps = {
  device: Device;
  microcontroller: MicrocontrollerResponse;
  provider: ProviderResponse | null;
  deviceLive?: DeviceLiveState;
  microcontrollerLive?: MicrocontrollerOnlineState;
  providerLive?: ProviderLiveState;
};

const resolveModeLabel = (
  mode: Device["mode"] | string | null | undefined,
  t: (key: string) => string
) => {
  if (mode === "AUTO") return t("devices.details.modes.auto");
  if (mode === "SCHEDULE") return t("devices.details.modes.schedule");
  if (mode === "MANUAL") return t("devices.details.modes.manual");
  return t("common.notAvailable");
};

const resolveGaugeBounds = (
  provider: ProviderResponse | null,
  currentPower: number | null
) => {
  const min = provider?.value_min ?? 0;

  const explicitMax = provider?.value_max;
  if (explicitMax != null && explicitMax > min) {
    return { min, max: explicitMax };
  }

  const observedPower = Math.abs(currentPower ?? 0);
  const lastPower = Math.abs(provider?.last_value?.measured_value ?? 0);

  return {
    min,
    max: Math.max(min + 1, observedPower, lastPower, 10),
  };
};

const resolveOnState = (
  device: Device,
  live: DeviceLiveState | undefined
): boolean | null => {
  const mode = device.mode ?? live?.mode;

  if (mode === "MANUAL") {
    const manual = device.manual_state;
    if (typeof manual === "boolean") return manual;
  }

  if (typeof live?.isOn === "boolean") return live.isOn;
  return null;
};

const resolveMicroStatus = (
  live: MicrocontrollerOnlineState | undefined,
  t: (key: string) => string
) => {
  if (!live) {
    return {
      label: t("common.waitingForStatus"),
      color: "default" as const,
      variant: "outlined" as const,
    };
  }

  if (live.isOnline) {
    return {
      label: t("common.online"),
      color: "success" as const,
      variant: "filled" as const,
    };
  }

  return {
    label: t("common.offline"),
    color: "default" as const,
    variant: "outlined" as const,
  };
};

const resolveProviderLiveStatus = (
  provider: ProviderResponse | null,
  live: ProviderLiveState | undefined,
  t: (key: string, options?: Record<string, unknown>) => string
) => {
  const countdown =
    live?.countdownSec != null
      ? `${live.countdownSec}s`
      : live?.isStale
        ? t("dashboard.cards.providerCountdownOverdue")
        : "--";

  if (!provider) {
    return {
      label: t("dashboard.cards.providerLiveMissing"),
      color: "default" as const,
      variant: "outlined" as const,
      countdown,
    };
  }

  if (!provider.enabled) {
    return {
      label: t("dashboard.cards.providerLiveDisabled"),
      color: "default" as const,
      variant: "outlined" as const,
      countdown,
    };
  }

  if (live?.hasWs && !live.isStale) {
    return {
      label: t("dashboard.cards.providerLiveOn"),
      color: "success" as const,
      variant: "filled" as const,
      countdown,
    };
  }

  if (live?.isStale) {
    return {
      label: t("dashboard.cards.providerLiveStale"),
      color: "warning" as const,
      variant: "outlined" as const,
      countdown,
    };
  }

  if (live?.loading || live?.timestamp) {
    return {
      label: t("dashboard.cards.providerLivePending"),
      color: "default" as const,
      variant: "outlined" as const,
      countdown,
    };
  }

  return {
    label: t("dashboard.cards.providerLiveOff"),
    color: "default" as const,
    variant: "outlined" as const,
    countdown,
  };
};

export function DashboardDeviceCard({
  device,
  microcontroller,
  provider,
  deviceLive,
  microcontrollerLive,
  providerLive,
}: DashboardDeviceCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const mode = (device.mode ?? deviceLive?.mode ?? null) as string | null;
  const modeLabel = resolveModeLabel(mode, t);
  const isAutoMode = mode === "AUTO";

  const isOn = resolveOnState(device, deviceLive);
  const providerPower = providerLive?.power ?? provider?.last_value?.measured_value ?? null;
  const providerUnit =
    providerLive?.unit ??
    provider?.last_value?.measured_unit ??
    provider?.unit ??
    null;
  const thresholdValue = deviceLive?.threshold ?? device.threshold_value ?? null;
  const thresholdUnit = provider?.unit ?? providerUnit ?? "";
  const autoThresholdLabel = isAutoMode
    ? thresholdValue != null
      ? `${thresholdValue} ${thresholdUnit}`.trim()
      : t("common.notAvailable")
    : t("dashboard.cards.thresholdInactive");

  const gaugeBounds = useMemo(
    () => resolveGaugeBounds(provider, providerPower),
    [provider, providerPower]
  );

  const microStatus = resolveMicroStatus(microcontrollerLive, t);
  const providerStatus = resolveProviderLiveStatus(provider, providerLive, t);

  const stateLabel =
    isOn == null
      ? t("common.waitingForStatus")
      : isOn
        ? t("devices.details.stateOn")
        : t("devices.details.stateOff");

  const stateColor =
    isOn == null ? "text.secondary" : isOn ? "success.main" : "error.main";

  const heartbeatLabel = deviceLive?.seenAt
    ? new Date(deviceLive.seenAt).toLocaleTimeString()
    : t("common.notAvailable");

  return (
    <CardShell
      title={device.name}
      subtitle={`${t("dashboard.cards.deviceNumber")} ${device.device_number}`}
      actions={
        <Stack spacing={0.35} alignItems="flex-end">
          <Chip size="small" label={modeLabel} color="primary" variant="outlined" />
          {isAutoMode && (
            <Stack spacing={0} alignItems="flex-end" sx={{ textAlign: "right" }}>
              <Typography variant="caption" color="text.secondary">
                {t("dashboard.cards.autoThreshold")}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {autoThresholdLabel}
              </Typography>
            </Stack>
          )}
        </Stack>
      }
      sx={{
        width: "100%",
        minHeight: 420,
        borderColor: alpha("#0f8b6f", 0.28),
        background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(247,252,249,1) 100%)",
      }}
    >
      <Stack spacing={2.25} sx={{ height: "100%" }}>
        <ProviderPowerGauge
          power={providerPower}
          unit={providerUnit}
          min={gaugeBounds.min}
          max={gaugeBounds.max}
          isOn={isOn}
          onLabel={t("dashboard.cards.stateOn")}
          offLabel={t("dashboard.cards.stateOff")}
          pendingLabel="--"
          noDataLabel={t("dashboard.cards.noPowerData")}
        />

        <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
          {t("dashboard.cards.providerRange", {
            min: gaugeBounds.min.toFixed(1),
            max: gaugeBounds.max.toFixed(1),
            unit: providerUnit ?? "",
          })}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 0.5,
            py: 0.75,
            borderRadius: 999,
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {t("dashboard.cards.providerLive")}
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Chip
              size="small"
              label={providerStatus.label}
              color={providerStatus.color}
              variant={providerStatus.variant}
            />
            <Typography variant="caption" fontWeight={700} color="text.primary">
              {providerStatus.countdown}
            </Typography>
          </Stack>
        </Stack>

        <Grid container spacing={1.25}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">
              {t("dashboard.cards.microcontroller")}
            </Typography>
            <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
              {microcontroller.name}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">
              {t("dashboard.cards.provider")}
            </Typography>
            <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
              {provider?.name ?? t("dashboard.cards.providerMissing")}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">
              {t("dashboard.cards.deviceState")}
            </Typography>
            <Typography variant="body2" fontWeight={700} color={stateColor}>
              {stateLabel}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">
              {t("dashboard.cards.microStatus")}
            </Typography>
            <Box>
              <Chip
                size="small"
                label={microStatus.label}
                color={microStatus.color}
                variant={microStatus.variant}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">
              {t("dashboard.cards.ratedPower")}
            </Typography>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {device.rated_power != null
                ? `${device.rated_power} ${providerUnit ?? "kW"}`
                : t("common.notAvailable")}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Typography variant="caption" color="text.secondary">
              {t("dashboard.cards.lastHeartbeat")}
            </Typography>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {heartbeatLabel}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: "auto", pt: 0.5 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() =>
              navigate(`/devices/${device.id}`, {
                state: { device },
              })
            }
            sx={{ textTransform: "none", borderRadius: 999 }}
          >
            {t("common.details")}
          </Button>
        </Box>
      </Stack>
    </CardShell>
  );
}
