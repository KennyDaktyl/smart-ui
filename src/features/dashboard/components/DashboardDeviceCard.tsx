import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Switch,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { alpha } from "@mui/material/styles";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { devicesApi } from "@/api/devicesApi";
import { parseApiError } from "@/api/parseApiError";
import { useToast } from "@/context/ToastContext";
import { CardShell } from "@/features/common/components/CardShell";
import { ProviderPowerGauge } from "@/features/dashboard/components/ProviderPowerGauge";
import { useDeviceEventLive } from "@/features/devices/live/useDeviceEventLive";
import type { DeviceLiveState } from "@/features/devices/live/useDeviceLiveState";
import type { Device } from "@/features/devices/types/devicesType";
import { formatDeviceAutoRuleSummary } from "@/features/devices/utils/autoRuleSummary";
import type { MicrocontrollerOnlineState } from "@/features/microcontrollers/hooks/useMicrocontrollersOnlineStatus";
import type { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import type { ProviderLiveState } from "@/features/providers/hooks/useProvidersLive";
import { ProviderLiveMetricsPanel } from "@/features/providers/components/ProviderLiveMetricsPanel";
import type { ProviderResponse } from "@/features/providers/types/userProvider";
import {
  BATTERY_SOC_METRIC_KEY,
  GRID_POWER_METRIC_KEY,
  formatProviderMetricValue,
  getPrimaryProviderMetricLabel,
  resolveProviderDisplayMetrics,
} from "@/features/providers/utils/providerLiveMetrics";

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

const isDependencyTriggerReason = (value: string | null | undefined) =>
  value === "DEVICE_DEPENDENCY_ON" || value === "DEVICE_DEPENDENCY_OFF";

const resolveDependencyPresentation = (
  triggerReason: string | null | undefined,
  isOn: boolean | null,
  t: (key: string) => string
) => {
  if (!isDependencyTriggerReason(triggerReason)) {
    return null;
  }

  return {
    modeLabel: t("dashboard.cards.dependencyMode"),
    detailLabel:
      isOn === false
        ? t("dashboard.cards.dependencyForcedOff")
        : t("dashboard.cards.dependencyForcedOn"),
  };
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

const truncateAutoLogic = (value: string, maxLength = 88) => {
  if (value.length <= maxLength) return value;

  const sliced = value.slice(0, maxLength);
  const lastSeparator = Math.max(
    sliced.lastIndexOf(" OR "),
    sliced.lastIndexOf(" AND "),
    sliced.lastIndexOf(" ")
  );
  const cutoff = lastSeparator > 28 ? lastSeparator : maxLength;

  return `${sliced.slice(0, cutoff).trim()}...`;
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
  const [autoLogicDialogOpen, setAutoLogicDialogOpen] = useState(false);
  const { lastEvent } = useDeviceEventLive({
    deviceUuid: device.uuid,
    enabled: true,
  });

  const mode = (modeOverride ?? device.mode ?? deviceLive?.mode ?? null) as
    | string
    | null;
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
  const dependencyPresentation = resolveDependencyPresentation(
    lastEvent?.trigger_reason,
    isOn,
    t
  );
  const modeLabel = dependencyPresentation?.modeLabel ?? resolveModeLabel(mode, t);
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
  const autoLogicDisplayLabel = isAutoMode
    ? formatDeviceAutoRuleSummary(device, t, thresholdUnit) ?? t("common.notAvailable")
    : "—";
  const autoLogicPreviewLabel =
    isAutoMode && autoLogicDisplayLabel !== t("common.notAvailable")
      ? truncateAutoLogic(autoLogicDisplayLabel)
      : autoLogicDisplayLabel;
  const autoLogicHasMore =
    autoLogicPreviewLabel !== autoLogicDisplayLabel &&
    autoLogicDisplayLabel !== t("common.notAvailable");
  const logicSectionTitle = dependencyPresentation
    ? t("dashboard.cards.dependencyTitle")
    : isAutoMode
      ? t("dashboard.cards.autoLogic")
      : t("dashboard.cards.modeSummary");
  const logicSectionValue = dependencyPresentation
    ? dependencyPresentation.detailLabel
    : isAutoMode
      ? autoLogicPreviewLabel
      : modeLabel;
  const logicSectionCaption =
    dependencyPresentation || !isAutoMode || thresholdValue == null
      ? null
      : `${t("dashboard.cards.autoThreshold")}: ${thresholdDisplayLabel}`;
  const logicSectionColor = dependencyPresentation
    ? "info.main"
    : autoLogicDisplayLabel !== t("common.notAvailable")
      ? "warning.dark"
      : "text.primary";
  const providerMetrics = useMemo(
    () =>
      provider
        ? resolveProviderDisplayMetrics({
            provider,
            liveMetrics: providerLive?.metrics,
            power: providerPower,
            unit: providerUnit,
            t,
          })
        : [],
    [provider, providerLive?.metrics, providerPower, providerUnit, t]
  );
  const gaugeCenterMetrics = useMemo(
    () =>
      providerMetrics
        .filter((metric) =>
          metric.key === BATTERY_SOC_METRIC_KEY ||
          metric.key === GRID_POWER_METRIC_KEY
        )
        .slice(0, 2)
        .map((metric) => ({
          key: metric.key,
          label: metric.label,
          value: formatProviderMetricValue(metric.value, metric.unit),
          color:
            metric.key === BATTERY_SOC_METRIC_KEY
              ? "#1f8f63"
              : "#375a7f",
        })),
    [providerMetrics]
  );

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
    dependencyPresentation
      ? dependencyPresentation.detailLabel
      : isOn == null
      ? t("common.waitingForStatus")
      : isOn
        ? t("devices.details.stateOn")
        : t("devices.details.stateOff");

  const stateColor =
    dependencyPresentation
      ? "info.main"
      : isOn == null
        ? "text.secondary"
        : isOn
          ? "success.main"
          : "error.main";

  const heartbeatLabel = deviceLive?.seenAt
    ? new Date(deviceLive.seenAt).toLocaleTimeString()
    : t("common.notAvailable");
  const canEditDevice = Boolean(onEditRequest);
  const canOpenProvider = Boolean(provider?.uuid);
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
  const handleEditRequest = () => onEditRequest?.(device);
  const handleOpenProvider = () => {
    if (!provider?.uuid) return;
    navigate(`/providers/${provider.uuid}/telemetry`, {
      state: { provider },
    });
  };
  const handleOpenMicrocontroller = () => {
    navigate("/microcontrollers");
  };
  const handleOpenAutoLogicDialog = () => {
    if (!autoLogicHasMore) return;
    setAutoLogicDialogOpen(true);
  };
  const handleCloseAutoLogicDialog = () => {
    setAutoLogicDialogOpen(false);
  };
  const interactiveMetaSx = {
    alignItems: "flex-start",
    borderRadius: 1.5,
    px: 0.5,
    py: 0.35,
    mx: -0.5,
    transition: "transform 140ms ease, background-color 140ms ease",
    cursor: "pointer",
    "&:hover": {
      transform: "scale(1.02)",
      backgroundColor: (theme: any) => alpha(theme.palette.primary.main, 0.05),
    },
  } as const;

  return (
    <>
      <CardShell
        title={device.name}
        subtitle={`${t("dashboard.cards.deviceNumber")} ${device.device_number}`}
        visualState={isDeviceOffline ? "offline" : "default"}
        headerSx={{
          minHeight: 108,
          alignItems: "stretch",
        }}
        titleSx={{
          display: "-webkit-box",
          overflow: "hidden",
          textOverflow: "ellipsis",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 3,
          lineHeight: 1.3,
          minHeight: "3.9em",
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
            sx={{
              minHeight: 82,
              width: 168,
              maxWidth: 168,
              justifyContent: "space-between",
              textAlign: "right",
              flexShrink: 0,
            }}
          >
          <Tooltip
            title={
              canEditDevice
                ? t("dashboard.cards.editDeviceHint")
                : ""
            }
          >
            <span>
              <Chip
                size="small"
                icon={canEditDevice ? <EditOutlinedIcon fontSize="small" /> : undefined}
                label={modeLabel}
                clickable={canEditDevice}
                onClick={handleEditRequest}
                color="primary"
                variant="outlined"
                sx={{
                  minWidth: 124,
                  maxWidth: 168,
                  ...(canEditDevice
                    ? {
                        cursor: "pointer",
                        transition: "transform 140ms ease, background-color 140ms ease",
                        "&:hover": {
                          transform: "scale(1.04)",
                          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                        },
                        "& .MuiChip-label": {
                          px: 1.25,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        },
                      }
                    : {}),
                }}
              />
            </span>
          </Tooltip>
          <Stack
            spacing={0.35}
            alignItems="flex-end"
            sx={{ width: "100%", maxWidth: 168, minHeight: 64 }}
          >
            <Stack direction="row" spacing={0.25} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {logicSectionTitle}
              </Typography>
              {isAutoMode && autoLogicHasMore && !dependencyPresentation ? (
                <Tooltip
                  title={t("dashboard.cards.autoLogicInfo")}
                  placement="left-start"
                >
                  <IconButton
                    size="small"
                    aria-label={t("dashboard.cards.autoLogicInfo")}
                    onClick={handleOpenAutoLogicDialog}
                    sx={{
                      p: 0.2,
                      color: "text.secondary",
                      "&:hover": {
                        color: "primary.main",
                      },
                    }}
                  >
                    <InfoOutlinedIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              ) : null}
            </Stack>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{
                width: "100%",
                textAlign: "right",
                display: "-webkit-box",
                overflow: "hidden",
                textOverflow: "ellipsis",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: dependencyPresentation ? 2 : autoLogicHasMore ? 2 : 3,
                minHeight: "2.8em",
                color: logicSectionColor,
              }}
            >
              {logicSectionValue}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                width: "100%",
                textAlign: "right",
                minHeight: 18,
                visibility: logicSectionCaption ? "visible" : "hidden",
              }}
            >
              {logicSectionCaption ?? "."}
            </Typography>
          </Stack>
          </Stack>
        }
        sx={{
          width: "100%",
          minHeight: 760,
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
        <Stack spacing={0.8} sx={{ minHeight: 246, flexShrink: 0 }}>
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
            providerPowerLabel={
              provider
                ? getPrimaryProviderMetricLabel(provider, t)
                : t("providers.live.metrics.providerPower")
            }
            ratedPowerLabel={t("dashboard.cards.ratedPower")}
            centerMetrics={gaugeCenterMetrics}
          />
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 1,
            py: 0.85,
            minHeight: 52,
            borderRadius: 2,
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
            backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.045),
          }}
        >
          <Stack spacing={0.2} sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" noWrap>
              {t("dashboard.cards.powerSwitch")}
            </Typography>
            <Typography
              variant="body2"
              color="text.primary"
              sx={{
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {isManualMode
                ? t("dashboard.cards.powerSwitchManualHint")
                : t("dashboard.cards.powerSwitchAutoHint")}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            justifyContent="flex-end"
            sx={{ flexShrink: 0 }}
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

        <Box
          sx={{
            minHeight: 88,
            px: 0.95,
            py: 1,
            borderRadius: 2.5,
            border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
            background: (theme) =>
              `linear-gradient(180deg, ${alpha(theme.palette.common.white, 0.92)} 0%, ${alpha(theme.palette.success.light, 0.08)} 100%)`,
          }}
        >
          {provider ? (
            <ProviderLiveMetricsPanel
              provider={provider}
              live={providerLive}
              compact
              title={t("dashboard.cards.providerMetrics")}
              emptyLabel={t("providers.live.noMetrics")}
              metrics={providerMetrics}
            />
          ) : (
            <Stack spacing={0.6}>
              <Typography variant="caption" color="text.secondary">
                {t("dashboard.cards.providerMetrics")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("dashboard.cards.providerMissing")}
              </Typography>
            </Stack>
          )}
        </Box>

        <Grid container columnSpacing={1.25} rowSpacing={1} sx={{ minHeight: 144 }}>
          <Grid size={{ xs: 6 }}>
            <Stack sx={metaCellSx}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {t("dashboard.cards.microcontroller")}
              </Typography>
              <Stack
                direction="row"
                spacing={0.35}
                onClick={handleOpenMicrocontroller}
                sx={interactiveMetaSx}
              >
                <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
                  {microcontroller.name}
                </Typography>
                <Tooltip title={t("dashboard.cards.openMicrocontroller")}>
                  <IconButton size="small" sx={{ p: 0.15 }}>
                    <OpenInNewIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Stack sx={metaCellSx}>
              <Typography variant="caption" color="text.secondary" noWrap>
                {t("dashboard.cards.provider")}
              </Typography>
              <Stack
                direction="row"
                spacing={0.35}
                onClick={canOpenProvider ? handleOpenProvider : undefined}
                sx={canOpenProvider ? interactiveMetaSx : undefined}
              >
                <Typography variant="body2" fontWeight={600} color="text.primary" noWrap>
                  {provider?.name ?? t("dashboard.cards.providerMissing")}
                </Typography>
                {canOpenProvider && (
                  <Tooltip title={t("dashboard.cards.openProvider")}>
                    <IconButton size="small" sx={{ p: 0.15 }}>
                      <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
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

      <Dialog
        open={autoLogicDialogOpen}
        onClose={handleCloseAutoLogicDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t("dashboard.cards.autoLogic")}</DialogTitle>
        <DialogContent>
          <DialogContentText
            sx={{
              color: "text.primary",
              wordBreak: "break-word",
              lineHeight: 1.55,
            }}
          >
            {autoLogicDisplayLabel}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAutoLogicDialog}>
            {t("common.cancel")}
          </Button>
        </DialogActions>
      </Dialog>

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
