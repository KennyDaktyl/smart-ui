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
  const mode = liveState?.mode ?? device.mode;
  const isAuto = mode === "AUTO";

  /**
   * Do we have LIVE data from heartbeat?
   * (false ≠ OFF, false is a valid state)
   */
  const hasLiveState = liveState?.isOn !== undefined;

  /**
   * Final ON/OFF resolution (pure state, no "pending" logic here)
   */
  const resolvedIsOn: boolean =
    localOverride ??
    (hasLiveState ? liveState.isOn : undefined) ??
    device.manual_state ??
    false;

  /**
   * Status badge (AUTO)
   * pending  → no live data yet
   * online   → pin ON
   * offline  → pin OFF
   */
  const statusType: "online" | "offline" | "pending" = !hasLiveState
    ? "pending"
    : resolvedIsOn
    ? "online"
    : "offline";

  const statusLabel = !hasLiveState
    ? t("common.waitingForStatus")
    : resolvedIsOn
    ? t("common.enabled")
    : t("common.disabled");

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
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      <Stack spacing={2.5} sx={{ flex: 1, justifyContent: "space-between" }}>
        {/* MODE */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {t("common.configuration")}
          </Typography>
          <Chip size="small" label={mode} />
        </Box>

        {/* SWITCH */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {t("common.enabled")}
          </Typography>

          <Switch
            checked={resolvedIsOn}
            disabled={toggleDisabled}
            onChange={handleToggle}
          />
        </Box>

        {/* STATUS (AUTO only) */}
        {isAuto && (
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ gap: 1, flexWrap: "wrap" }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("common.status")}
            </Typography>

            <Box sx={{ minWidth: 96, display: "flex", justifyContent: "flex-end" }}>
              <StatusBadge status={statusType} label={statusLabel} />
            </Box>
          </Box>
        )}

        {/* AUTO DETAILS */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ gap: 1, flexWrap: "wrap" }}
        >
          <Typography variant="body2" color="text.secondary">
            {t("providers.card.range")}
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {device.threshold_value} {provider?.unit ?? ""}
          </Typography>
        </Box>

        {device.rated_power_w != null && (
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ gap: 1, flexWrap: "wrap" }}
          >
            <Typography variant="body2" color="text.secondary">
              {t("providers.card.rated_power_w")}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {device.rated_power_w} {provider?.unit ?? ""}
            </Typography>
          </Box>
        )}

        {/* UPDATED AT */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ gap: 1, flexWrap: "wrap" }}
        >
          <Typography variant="caption" color="text.secondary">
            {t("providers.live.updatedAt")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {lastStateLabel}
          </Typography>
        </Box>
      </Stack>
    </CardShell>
  );
}
