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
        Slot: {slotIndex}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        Moc: {device.rated_power_kw} kW
      </Typography>

      {device.mode === "AUTO_POWER" && (
        <Typography variant="body2" color="text.secondary">
          Próg PV: {device.threshold_kw} kW
        </Typography>
      )}

      {/* STATUS */}
      <Stack direction="row" alignItems="center" spacing={2} mt={2}>
        {waitingForState ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              Oczekiwanie na status…
            </Typography>
          </Stack>
        ) : (
          <Typography
            variant="body2"
            fontWeight={600}
            color={online ? "green" : "red"}
          >
            {online ? "Online" : "Offline"}
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
              ⚡ {isOn ? "Włączony" : "Wyłączony"}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
