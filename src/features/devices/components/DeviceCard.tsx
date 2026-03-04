import {
  Box,
  Chip,
  IconButton,
  Stack,
  Typography,
  Switch,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import type { Device } from "@/features/devices/types/devicesType";
import type { ProviderResponse } from "@/features/providers/types/userProvider";
import { CardShell } from "@/features/common/components/CardShell";
import { StatusBadge } from "@/features/common/components/atoms/StatusBadge";

/**
 * UI optimistic override:
 * - true      → force ON
 * - false     → force OFF
 * - undefined → no override (use live/backend state)
 */
type LocalOverrideState = boolean | undefined;

type Props = {
  device: Device;
  liveState?: {
    isOn: boolean;
    mode?: string | null;
    threshold?: number | null;
  };
  microcontrollerStatus?: "online" | "offline" | "pending";
  localOverride?: LocalOverrideState;
  provider?: ProviderResponse | null;
  onEdit?: (device: Device) => void;
  onDelete?: (device: Device) => void;
  onToggle?: (device: Device, next: boolean) => void;
  toggleDisabled?: boolean;
};

export function DeviceCard({
  device,
  liveState,
  microcontrollerStatus = "pending",
  localOverride,
  provider,
  onEdit,
  onDelete,
  onToggle,
  toggleDisabled = false,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  /**
   * Mode resolution
   */
  // Device mode comes from configuration updates (PUT), so it must win over
  // heartbeat snapshots that can arrive later and still carry an old mode.
  const mode = device.mode ?? liveState?.mode;
  const isAuto = mode === "AUTO";
  const isManual = mode === "MANUAL";
  const modeLabel = mode ?? t("common.notAvailable");

  /**
   * Do we have LIVE data from heartbeat?
   * (false ≠ OFF, false is a valid state)
   */
  const hasLiveState = liveState?.isOn !== undefined;
  const liveIsOn = hasLiveState ? liveState.isOn : undefined;
  const microcontrollerOffline = microcontrollerStatus === "offline";

  /**
   * Final ON/OFF resolution (pure state, no "pending" logic here)
   */
  const resolvedIsOn: boolean =
    localOverride ??
    (isManual
      ? device.manual_state ?? liveIsOn
      : liveIsOn) ??
    false;

  /**
   * Status badge
   * pending  → no live data yet
   * online   → pin ON
   * offline  → pin OFF
   */
  const statusType: "online" | "offline" | "pending" = !hasLiveState
    ? microcontrollerOffline
      ? "offline"
      : "pending"
    : resolvedIsOn
      ? "online"
      : "offline";

  const statusLabel = !hasLiveState
    ? microcontrollerOffline
      ? t("common.offline")
      : t("common.waitingForStatus")
    : resolvedIsOn
      ? t("common.enabled")
      : t("common.disabled");
  const thresholdLabel = isAuto
    ? device.threshold_value != null
      ? `${device.threshold_value} ${provider?.unit ?? ""}`.trim()
      : t("common.notAvailable")
    : "—";
  const ratedPowerLabel =
    device.rated_power != null
      ? `${device.rated_power} ${provider?.unit ?? ""}`
      : t("common.notAvailable");

  const rowSx = {
    minHeight: 44,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 1.25,
  } as const;

  const handleToggle = (_: unknown, next: boolean) => {
    onToggle?.(device, next);
  };

  const lastStateLabel = device.last_state_change_at
    ? new Date(device.last_state_change_at).toLocaleString()
    : t("common.none");

  return (
    <CardShell
      title={device.name}
      subtitle={`GPIO ${device.device_number}`}
      visualState={microcontrollerOffline ? "offline" : "default"}
      headerSx={{ minHeight: 76 }}
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
        minHeight: 18,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
      actionsSx={{ flexShrink: 0 }}
      actions={
        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            onClick={() =>
              navigate(`/devices/${device.id}`, {
                state: { device },
              })
            }
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>

          <IconButton size="small" onClick={() => onEdit?.(device)}>
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton size="small" onClick={() => onDelete?.(device)}>
            <DeleteIcon fontSize="small" color="error" />
          </IconButton>
        </Stack>
      }
      sx={{
        width: "100%",
        minHeight: 420,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      <Stack spacing={1.25} sx={{ flex: 1 }}>
        {/* MODE */}
        <Box sx={rowSx}>
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
            {t("common.configuration")}
          </Typography>
          <Chip
            size="small"
            label={modeLabel}
            sx={{
              minWidth: 112,
              maxWidth: 152,
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            }}
          />
        </Box>

        {/* SWITCH */}
        <Box sx={rowSx}>
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
            {t("common.enabled")}
          </Typography>

          <Switch
            checked={resolvedIsOn}
            disabled={toggleDisabled}
            onChange={handleToggle}
          />
        </Box>

        {/* STATUS */}
        <Box sx={rowSx}>
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
            {t("common.status")}
          </Typography>
          <Box
            sx={{
              width: 164,
              maxWidth: "60%",
              flexShrink: 0,
              "& .MuiChip-root": {
                width: "100%",
                justifyContent: "center",
              },
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            }}
          >
            <StatusBadge status={statusType} label={statusLabel} />
          </Box>
        </Box>

        {/* THRESHOLD */}
        <Box sx={rowSx}>
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
            {t("providers.card.range")}
          </Typography>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              color:
                isAuto && device.threshold_value != null
                  ? (theme) => theme.palette.warning.dark
                  : "text.secondary",
              minWidth: 0,
              textAlign: "right",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {thresholdLabel}
          </Typography>
        </Box>

        {/* RATED POWER */}
        <Box sx={rowSx}>
          <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0 }}>
            {t("providers.card.rated_power")}
          </Typography>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{
              color:
                device.rated_power != null
                  ? (theme) => theme.palette.info.main
                  : "text.secondary",
              minWidth: 0,
              textAlign: "right",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {ratedPowerLabel}
          </Typography>
        </Box>

        {/* UPDATED AT */}
        <Box sx={{ ...rowSx, mt: "auto", minHeight: 36 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
            {t("providers.live.updatedAt")}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              minWidth: 0,
              textAlign: "right",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {lastStateLabel}
          </Typography>
        </Box>
      </Stack>
    </CardShell>
  );
}
