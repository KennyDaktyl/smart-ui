import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  Switch,
  IconButton,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { useTranslation } from "react-i18next";

interface DeviceBoxProps {
  device: any;
  online: boolean;
  isOn: boolean;
  waitingForState: boolean;
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
  slotIndex,
  toggling,
  onEdit,
  onDelete,
  onToggle,
  locked,
}: DeviceBoxProps) {
  const { t } = useTranslation();
  const autoMode = device.mode !== "MANUAL";

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid #ddd",
        bgcolor: "#fff",
      }}
    >
      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={600}>
          {device.name}
        </Typography>

        <Stack direction="row" spacing={1}>
          <IconButton onClick={onEdit} size="small">
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton onClick={onDelete} size="small" color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      {/* INFO */}
      <Typography variant="body2" color="text.secondary">
        {t("devices.slotLabel", { slot: slotIndex })}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        {t("devices.powerLabel", { power: device.rated_power_kw })}
      </Typography>

      {device.mode === "AUTO_POWER" && (
        <Typography variant="body2" color="text.secondary">
          {t("devices.thresholdLabel", { threshold: device.threshold_kw })}
        </Typography>
      )}

      {/* STATUS */}
      <Stack direction="row" alignItems="center" spacing={2} mt={2}>
        {waitingForState ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              {t("devices.waiting")}
            </Typography>
          </Stack>
        ) : (
          <Typography
            variant="body2"
            fontWeight={600}
            color={online ? "green" : "red"}
          >
            {online ? t("common.online") : t("common.offline")}
          </Typography>
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
    </Box>
  );
}
