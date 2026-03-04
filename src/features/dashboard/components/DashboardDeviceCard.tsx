import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
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
  onEditRequest?: (device: Device) => void;
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
  currentPower: number | null,
  threshold: number | null,
  ratedPower: number | null
) => {
  const min = provider?.value_min ?? 0;

  const explicitMax = provider?.value_max;
  if (explicitMax != null && explicitMax > min) {
    return { min, max: explicitMax };
  }

  const observedPower = currentPower ?? 0;
  const lastPower = provider?.last_value?.measured_value ?? 0;
  const thresholdValue = threshold ?? 0;
  const ratedValue = ratedPower ?? 0;

  return {
    min,
    max: Math.max(min + 1, observedPower, lastPower, thresholdValue, ratedValue, 10),
  };
};

const resolveOnState = (
  device: Device,
  live: DeviceLiveState | undefined,
  resolvedMode?: Device["mode"] | string | null
): boolean | null => {
  const mode = resolvedMode ?? device.mode ?? live?.mode;

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
  onEditRequest,
}: DashboardDeviceCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifyError } = useToast();
  const [modeOverride, setModeOverride] = useState<Device["mode"] | undefined>(
    undefined
  );
  const [manualOverride, setManualOverride] = useState<boolean | undefined>(
    undefined
  );
  const [manualSaving, setManualSaving] = useState(false);
  const [confirmManualOpen, setConfirmManualOpen] = useState(false);
  const [pendingManualState, setPendingManualState] = useState<boolean | null>(
    null
  );

  const mode = (modeOverride ?? device.mode ?? deviceLive?.mode ?? null) as
    | string
    | null;
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
  const manualSwitchDisabled = manualSaving || !microcontrollerLive?.isOnline;
  const effectiveDevice =
    manualOverride === undefined
      ? device
      : {
          ...device,
          manual_state: manualOverride,
        };

  useEffect(() => {
    if (!isManualMode) {
      if (manualOverride !== undefined && !manualSaving) {
        setManualOverride(undefined);
      }
      return;
    }

    if (manualOverride !== undefined && manualOverride === baseManualState) {
      setManualOverride(undefined);
    }
  }, [baseManualState, isManualMode, manualOverride, manualSaving]);

  useEffect(() => {
    if (modeOverride && device.mode === modeOverride) {
      setModeOverride(undefined);
    }
  }, [device.mode, modeOverride]);

  const isOn = resolveOnState(effectiveDevice, deviceLive, mode);
  const switchChecked = isManualMode
    ? resolvedManualState
    : isOn ?? resolvedManualState;
  const manualStateLabel = switchChecked
    ? t("common.enabled")
    : t("common.disabled");
  const livePower = providerLive?.power;
  const hasFiniteLivePower = livePower != null && Number.isFinite(livePower);
  const providerPower = hasFiniteLivePower
    ? Number(livePower)
    : provider?.last_value?.measured_value ?? null;
  const providerUnit =
    (hasFiniteLivePower ? providerLive?.unit : null) ??
    provider?.last_value?.measured_unit ??
    providerLive?.unit ??
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
    () =>
      resolveGaugeBounds(
        provider,
        providerPower,
        isAutoMode ? thresholdValue : null,
        device.rated_power ?? null
      ),
    [device.rated_power, isAutoMode, provider, providerPower, thresholdValue]
  );

  const microStatus = resolveMicroStatus(microcontrollerLive, t);
  const providerStatus = resolveProviderLiveStatus(provider, providerLive, t);
  const isDeviceOffline = microcontrollerLive?.isOnline === false;

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
    minHeight: 56,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: 0.45,
  } as const;
  const metaValueSx = {
    minHeight: 24,
    display: "flex",
    alignItems: "flex-end",
  } as const;
  const setDeviceManualState = async (next: boolean) => {
    if (manualSwitchDisabled) return;

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

      if (updated?.mode === "MANUAL") {
        setModeOverride("MANUAL");
      }
      setManualOverride(acknowledgedState);
    } catch (error) {
      setManualOverride(undefined);
      notifyError(parseApiError(error).message || t("common.error.generic"));
    } finally {
      setManualSaving(false);
    }
  };

  const handleManualSwitchChange = (_: unknown, next: boolean) => {
    if (manualSwitchDisabled) return;

    if (isManualMode) {
      void setDeviceManualState(next);
      return;
    }

    setPendingManualState(next);
    setConfirmManualOpen(true);
  };

  const handleConfirmManual = () => {
    if (pendingManualState == null) {
      setConfirmManualOpen(false);
      return;
    }

    setConfirmManualOpen(false);
    void setDeviceManualState(pendingManualState);
    setPendingManualState(null);
  };

  const handleCancelManualConfirm = () => {
    setConfirmManualOpen(false);
    setPendingManualState(null);
  };

  const manualActionLabel =
    pendingManualState == null
      ? ""
      : pendingManualState
        ? t("dashboard.cards.stateOn")
        : t("dashboard.cards.stateOff");

  return (
    <>
      <CardShell
        title={device.name}
        subtitle={`${t("dashboard.cards.deviceNumber")} ${device.device_number}`}
        visualState={isDeviceOffline ? "offline" : "default"}
        headerSx={{ minHeight: 94 }}
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
            sx={{ minHeight: 62, justifyContent: "space-between", textAlign: "right" }}
          >
          <Chip
            size="small"
            label={modeLabel}
            clickable={Boolean(onEditRequest)}
            onClick={() => onEditRequest?.(device)}
            color="primary"
            variant="outlined"
            sx={{
              minWidth: 74,
              ...(onEditRequest
                ? {
                    cursor: "pointer",
                    "& .MuiChip-label": { px: 1.25 },
                  }
                : {}),
            }}
          />
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            justifyContent="flex-end"
            sx={{ minHeight: 24 }}
          >
            <Typography variant="caption" color="text.secondary" noWrap>
              {manualStateLabel}
            </Typography>
            <Switch
              size="small"
              checked={switchChecked}
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
          {isAutoMode && (
            <Stack spacing={0} alignItems="flex-end">
              <Typography variant="caption" color="text.secondary" noWrap>
                {t("dashboard.cards.autoThreshold")}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={600}
                noWrap
                sx={{
                  maxWidth: 132,
                  color:
                    thresholdValue != null
                      ? (theme) => theme.palette.warning.dark
                      : "text.primary",
                }}
              >
                {thresholdDisplayLabel}
              </Typography>
            </Stack>
          )}
          </Stack>
        }
        sx={{
          width: "100%",
          minHeight: 528,
          height: "100%",
          borderColor: isDeviceOffline
            ? "rgba(100,116,139,0.55)"
            : alpha("#0f8b6f", 0.28),
          background: isDeviceOffline
            ? "linear-gradient(180deg, rgba(226,232,240,0.96) 0%, rgba(203,213,225,0.92) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(247,252,249,1) 100%)",
          opacity: isDeviceOffline ? 0.78 : 1,
          filter: isDeviceOffline ? "grayscale(0.88) saturate(0.72)" : "none",
        }}
      >
      <Stack spacing={1.8} sx={{ height: "100%" }}>
        <Stack spacing={0.8} sx={{ minHeight: 246 }}>
          <ProviderPowerGauge
            power={providerPower}
            unit={providerUnit}
            min={gaugeBounds.min}
            max={gaugeBounds.max}
            threshold={isAutoMode ? thresholdValue : null}
            ratedPower={device.rated_power ?? null}
            isOn={isOn}
            onLabel={t("dashboard.cards.stateOn")}
            offLabel={t("dashboard.cards.stateOff")}
            pendingLabel="--"
            noDataLabel={t("dashboard.cards.noPowerData")}
            providerPowerLabel={t("devices.details.live.providerPower")}
            ratedPowerLabel={t("dashboard.cards.ratedPower")}
          />
        </Stack>

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
              <Typography
                variant="body2"
                fontWeight={600}
                noWrap
                sx={{
                  color:
                    device.rated_power != null
                      ? (theme) => theme.palette.info.main
                      : "text.secondary",
                }}
              >
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

      <Dialog open={confirmManualOpen} onClose={handleCancelManualConfirm}>
        <DialogTitle>{t("dashboard.cards.manualSwitchConfirmTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("dashboard.cards.manualSwitchConfirmDescription", {
              action: manualActionLabel,
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelManualConfirm}>{t("common.cancel")}</Button>
          <Button onClick={handleConfirmManual} variant="contained" autoFocus>
            {t("dashboard.cards.manualSwitchConfirmOk")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
