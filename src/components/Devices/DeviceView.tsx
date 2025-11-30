import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Stack,
  Chip,
  Switch,
  Box,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CircleIcon from "@mui/icons-material/Circle";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import BoltIcon from "@mui/icons-material/Bolt";

export function DeviceView({
  device,
  online,
  isOn,
  slotIndex,
  toggling,
  onEdit,
  onDelete,
  onToggle,
  locked,
}: any) {
  return (
    <Card sx={{ p: 1 }}>
      <CardContent>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography fontWeight={600}>{device.name}</Typography>
            <CircleIcon
              sx={{ fontSize: 12, color: online ? "success.main" : "grey.500" }}
            />
          </Stack>

          <Stack direction="row" spacing={1}>
            <IconButton onClick={onEdit} disabled={locked}>
              <EditIcon color="primary" fontSize="small" />
            </IconButton>

            <IconButton onClick={onDelete} disabled={locked}>
              <DeleteIcon color="error" fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        {/* Details */}
        <Typography variant="body2">Slot: {slotIndex}</Typography>
        <Typography variant="body2">Moc: {device.rated_power_kw} kW</Typography>
        <Typography variant="body2">Tryb: {device.mode}</Typography>

        {/* AUTO POWER THRESHOLD */}
        {device.mode === "AUTO_POWER" && (
          <Stack direction="row" spacing={1} alignItems="center" mt={1}>
            <FlashOnIcon sx={{ color: "orange", fontSize: 18 }} />
            <Typography variant="body2">
              Próg PV: {device.threshold_kw} kW
            </Typography>
          </Stack>
        )}

        {/* State */}
        <Box mt={2}>
          {!online ? (
            <Chip label="Offline" size="small" />
          ) : device.mode === "MANUAL" ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <Switch
                checked={isOn}
                onChange={(e) => onToggle(e.target.checked)}
                disabled={toggling || locked}
              />
              <Chip
                icon={<BoltIcon />}
                label={isOn ? "Włączony" : "Wyłączony"}
                color={isOn ? "success" : "default"}
                size="small"
              />
            </Stack>
          ) : (
            <Chip
              icon={<BoltIcon />}
              label={isOn ? "Włączony" : "Wyłączony"}
              color={isOn ? "success" : "default"}
              size="small"
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
