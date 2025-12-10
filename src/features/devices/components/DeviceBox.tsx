import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  Switch,
  IconButton,
  Button,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { useTranslation } from "react-i18next";

interface DeviceBoxProps {
  device: any;
  online: boolean;
  isOn: boolean;
  waitingForState: boolean;
  raspberryName: string;
  raspberryUuid: string;
  raspberryId: number;
  slotIndex: number;
  toggling: boolean;

  onEdit: () => void;
  onDelete: () => void;
  onToggle: (checked: boolean) => void;

  locked: boolean;
}

export function DeviceBox({
  device,
  online,
  isOn,
  waitingForState,
  raspberryName,
  raspberryUuid,
  raspberryId,
  slotIndex,
  toggling,
  onEdit,
  onDelete,
  onToggle,
  locked,
}: DeviceBoxProps) {
  const { t } = useTranslation();
  const autoMode = device.mode !== "MANUAL";
  const statusColor = online ? "#0f8b6f" : "#9ca3af";

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid rgba(226, 242, 236, 0.7)",
        background: "linear-gradient(135deg, #f9fbfd 0%, #eef5f3 100%)",
        boxShadow: "0 12px 26px rgba(0,0,0,0.14)",
        color: "#0d1b2a",
      }}
    >
      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Stack spacing={0.25}>
          <Typography variant="h6" fontWeight={600}>
            {device.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "#4b5563" }}>
            {t("devices.parentLabel", { name: raspberryName })}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={onEdit} size="small">
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton onClick={onDelete} size="small" color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      <Typography variant="body2" sx={{ color: "#405166" }}>
        {t("devices.slotLabel", { slot: slotIndex })}
      </Typography>

      <Typography variant="body2" sx={{ color: "#405166" }}>
        {t("devices.powerLabel", { power: device.rated_power_kw })}
      </Typography>

      {device.mode === "AUTO_POWER" && (
        <Typography variant="body2" sx={{ color: "#405166" }}>
          {t("devices.thresholdLabel", { threshold: device.threshold_kw })}
        </Typography>
      )}

      <Stack direction="row" alignItems="center" spacing={2} mt={2}>
        {waitingForState ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" sx={{ color: "#405166" }}>
              {t("devices.waiting")}
            </Typography>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: statusColor,
              }}
            />
            <Typography variant="body2" fontWeight={600} sx={{ color: statusColor }}>
              {online ? t("common.online") : t("common.offline")}
            </Typography>
          </Stack>
        )}

        {/* =============================================== */}
        {/* MANUAL — SWITCH */}
        {/* =============================================== */}
        {!autoMode ? (
          waitingForState ? (
            <CircularProgress size={18} />
          ) : (
            <Switch
              checked={isOn}
              disabled={!online || toggling || locked}
              onChange={(e) => onToggle(e.target.checked)}
            />
          )
        ) : (
          /* =============================================== */
          /* AUTO MODE — IKONKA + STAN                      */
          /* =============================================== */
          <Stack direction="row" spacing={1} alignItems="center">
            <PowerSettingsNewIcon
              fontSize="small"
              color={isOn ? "success" : "disabled"}
            />

            <Typography
              variant="body2"
              sx={{
                px: 1.2,
                py: 0.5,
                bgcolor: isOn ? "#c8f7c5" : "#eee",
                borderRadius: 2,
              }}
            >
              ⚡ {isOn ? t("devices.autoOn") : t("devices.autoOff")}
            </Typography>
          </Stack>
        )}
      </Stack>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button
          component={RouterLink}
          to={`/raspberries/${raspberryId}/devices/${device.id}`}
          state={{ device, raspberryName, raspberryId }}
          size="small"
          variant="contained"
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 999,
            background: "linear-gradient(135deg, #0f8b6f, #12b886)",
            boxShadow: "0 8px 16px rgba(15,139,111,0.35)",
            "&:hover": { background: "linear-gradient(135deg, #0c745d, #0f9b72)" },
          }}
        >
          {t("devices.detailsLink")}
        </Button>
      </Box>
    </Box>
  );
}
