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

type Props = {
  device: Device;
  isOnline?: boolean;
  liveState?: {
    isOn: boolean;
    mode?: string | null;
    threshold?: number | null;
  };
  provider?: ProviderResponse | null;
  onEdit?: (device: Device) => void;
  onDelete?: (device: Device) => void;
  onToggle?: (device: Device, next: boolean) => void;
  toggleDisabled?: boolean;
};

export function DeviceCard({
  device,
  liveState,
  provider,
  onEdit,
  onDelete,
  onToggle,
  toggleDisabled = false,
}: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const mode = liveState?.mode ?? device.mode;
  const isManual = mode === "MANUAL";
  const isAuto = mode === "AUTO"

  /**
   * Resolve current ON/OFF state
   */
  const isOn: boolean | undefined = isManual
    ? device.manual_state ?? undefined
    : liveState?.isOn;

  /**
   * Switch behavior:
   * - MANUAL: full control
   * - AUTO: can enable, cannot disable
   */
  const statusLabel =
    isOn == null
      ? t("common.waitingForStatus")
      : isOn
      ? t("common.enabled")
      : t("common.disabled");

  const statusType =
    isOn == null ? "pending" : isOn ? "online" : "offline";

  const lastStateLabel = device.last_state_change_at
    ? new Date(device.last_state_change_at).toLocaleString()
    : t("common.none");

  const handleToggle = (_: unknown, next: boolean) => {
    onToggle?.(device, next);
  };

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
    >
      <Stack spacing={1.5}>
        {/* MODE */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {t("common.configuration")}
          </Typography>
          <Chip size="small" label={mode} />
        </Box>

        {/* SWITCH – always visible */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {t("common.enabled")}
          </Typography>

          <Switch
            checked={Boolean(isOn)}
            onChange={handleToggle}
          />
        </Box>

        {/* STATUS (only informational in AUTO) */}
        {isAuto && (
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {t("common.status")}
            </Typography>
            <StatusBadge status={statusType} label={statusLabel} />
          </Box>
        )}

        {/* AUTO DETAILS */}
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            {t("providers.card.range")}
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {device.threshold_value} {provider?.unit ?? ""}
          </Typography>
        </Box>

        {device.rated_power_w != null && (
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {t("providers.card.rated_power_w")}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {device.rated_power_w} {provider?.unit ?? ""}
            </Typography>
          </Box>
        )}

        {/* UPDATED AT */}
        <Box display="flex" justifyContent="space-between">
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
