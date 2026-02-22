import { Box, Button, Chip, Stack, Switch, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { devicesApi } from "@/api/devicesApi";
import { parseApiError } from "@/api/parseApiError";
import { useToast } from "@/context/ToastContext";
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
  const { notifyError } = useToast();
  const [manualOverride, setManualOverride] = useState<boolean | undefined>(
    undefined
  );
  const [manualSaving, setManualSaving] = useState(false);

  const mode = (device.mode ?? deviceLive?.mode ?? null) as string | null;
  const modeLabel = resolveModeLabel(mode, t);
  const isAutoMode = mode === "AUTO";
  const isManualMode = mode === "MANUAL";
  const baseManualState =
    typeof device.manual_state === "boolean"
      ? device.manual_state
      : typeof deviceLive?.isOn === "boolean"
        ? deviceLive.isOn
        : false;
  const resolvedManualState = manualOverride ?? baseManualState;
  const manualSwitchDisabled =
    manualSaving || !isManualMode || !microcontrollerLive?.isOnline;
  const effectiveDevice =
    manualOverride === undefined
      ? device
      : {
          ...device,
          manual_state: manualOverride,
        };

  useEffect(() => {
    if (!isManualMode) {
      if (manualOverride !== undefined) setManualOverride(undefined);
      return;
    }

    if (manualOverride !== undefined && manualOverride === baseManualState) {
      setManualOverride(undefined);
    }
  }, [baseManualState, isManualMode, manualOverride]);

  const isOn = resolveOnState(effectiveDevice, deviceLive);
  const providerPower = providerLive?.power ?? provider?.last_value?.measured_value ?? null;
  const providerUnit =
    providerLive?.unit ??
    provider?.last_value?.measured_unit ??
    provider?.unit ??
    null;
  const thresholdValue = deviceLive?.threshold ?? device.threshold_value ?? null;
  const thresholdUnit = provider?.unit ?? providerUnit ?? "";
  const thresholdDisplayLabel = isAutoMode
    ? thresholdValue != null
      ? `${thresholdValue} ${thresholdUnit}`.trim()
      : t("common.notAvailable")
    : "—";

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
  const metaCellSx = {
    minHeight: 52,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 0.35,
  } as const;
  const metaValueSx = {
    minHeight: 24,
    display: "flex",
    alignItems: "flex-end",
  } as const;
  const handleManualSwitchChange = async (_: unknown, next: boolean) => {
    if (!isManualMode || manualSwitchDisabled) return;

    setManualOverride(next);
    setManualSaving(true);

    try {
      const res = await devicesApi.setManualState(device.id, next);
      const payload = res.data as any;
      const updated = payload?.device ?? payload;
      const acknowledgedState =
        typeof updated?.manual_state === "boolean"
          ? updated.manual_state
          : typeof updated?.is_on === "boolean"
            ? updated.is_on
            : typeof payload?.is_on === "boolean"
              ? payload.is_on
              : next;

      setManualOverride(acknowledgedState);
    } catch (error) {
      setManualOverride(undefined);
      notifyError(parseApiError(error).message || t("common.error.generic"));
    } finally {
      setManualSaving(false);
    }
  };

  return (
    <CardShell
      title={device.name}
      subtitle={`${t("dashboard.cards.deviceNumber")} ${device.device_number}`}
      headerSx={{ minHeight: 88 }}
      titleSx={{
        display: "-webkit-box",
        overflow: "hidden",
        textOverflow: "ellipsis",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: 2,
        lineHeight: 1.3,
        minHeight: "2.6em",
        wordBreak: "break-word",
      }}
      subtitleSx={{
        display: "block",
        minHeight: 20,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
      actionsSx={{ flexShrink: 0 }}
      actions={
        <Stack
          spacing={0.5}
          alignItems="flex-end"
          sx={{ minHeight: 56, justifyContent: "space-between", textAlign: "right" }}
        >
          <Chip
            size="small"
            label={modeLabel}
            color="primary"
            variant="outlined"
            sx={{ minWidth: 74 }}
          />
          {isManualMode ? (
            <Stack
              direction="row"
              spacing={0.5}
              alignItems="center"
              justifyContent="flex-end"
              sx={{ minHeight: 24 }}
            >
              <Typography variant="caption" color="text.secondary" noWrap>
                {t("common.enabled")}
              </Typography>
              <Switch
                size="small"
                checked={resolvedManualState}
                onChange={handleManualSwitchChange}
                disabled={manualSwitchDisabled}
                sx={{
                  ml: 0.25,
                  "& .MuiSwitch-switchBase": {
                    p: 0.4,
                  },
                  "& .MuiSwitch-thumb": {
                    width: 14,
                    height: 14,
                  },
                  "& .MuiSwitch-track": {
                    borderRadius: 8,
                  },
                }}
              />
            </Stack>
          ) : (
            <Stack spacing={0} alignItems="flex-end">
              <Typography variant="caption" color="text.secondary" noWrap>
                {t("dashboard.cards.autoThreshold")}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={600}
                color="text.primary"
                noWrap
                sx={{ maxWidth: 132 }}
              >
                {thresholdDisplayLabel}
              </Typography>
            </Stack>
          )}
        </Stack>
      }
      sx={{
        width: "100%",
        minHeight: 420,
        height: "100%",
        borderColor: alpha("#0f8b6f", 0.28),
        background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(247,252,249,1) 100%)",
      }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
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
            minHeight: 44,
            borderRadius: 999,
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <Typography variant="caption" color="text.secondary" noWrap>
            {t("dashboard.cards.providerLive")}
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
            <Chip
              size="small"
              label={providerStatus.label}
              color={providerStatus.color}
              variant={providerStatus.variant}
              sx={{
                minWidth: 108,
                "& .MuiChip-label": {
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                },
              }}
            />
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.primary"
              sx={{ width: 34, textAlign: "right" }}
            >
              {providerStatus.countdown}
            </Typography>
          </Stack>
        </Stack>

        <Grid container columnSpacing={1.25} rowSpacing={1}>
          <Grid size={{ xs: 6 }}>
            <Stack sx={metaCellSx}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {t("dashboard.cards.microcontroller")}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
                {microcontroller.name}
              </Typography>
            </Stack>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Stack sx={metaCellSx}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {t("dashboard.cards.provider")}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
                {provider?.name ?? t("dashboard.cards.providerMissing")}
              </Typography>
            </Stack>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Stack sx={metaCellSx}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {t("dashboard.cards.deviceState")}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={700}
                color={stateColor}
                noWrap
                sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}
              >
                {stateLabel}
              </Typography>
            </Stack>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Stack sx={metaCellSx}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {t("dashboard.cards.microStatus")}
              </Typography>
              <Box sx={metaValueSx}>
                <Chip
                  size="small"
                  label={microStatus.label}
                  color={microStatus.color}
                  variant={microStatus.variant}
                  sx={{
                    maxWidth: "100%",
                    "& .MuiChip-label": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  }}
                />
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Stack sx={metaCellSx}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {t("dashboard.cards.ratedPower")}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
                {device.rated_power != null
                  ? `${device.rated_power} ${providerUnit ?? "kW"}`
                  : t("common.notAvailable")}
              </Typography>
            </Stack>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Stack sx={metaCellSx}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {t("dashboard.cards.lastHeartbeat")}
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
                {heartbeatLabel}
              </Typography>
            </Stack>
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
