import { Box, Stack, Typography, CircularProgress, Switch, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

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

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid #ddd",
        bgcolor: "#fff",
      }}
    >
      <Typography variant="h6" fontWeight={600}>
        {device.name}
        <Stack direction="row" spacing={1} mt={2}>
        <IconButton onClick={onEdit}>
          <EditIcon />
        </IconButton>

        <IconButton onClick={onDelete}>
          <DeleteIcon />
        </IconButton>
      </Stack>
      </Typography>
      
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
            color={online ? "green" : "red"}
            fontWeight={600}
          >
            {online ? "Online" : "Offline"}
          </Typography>
        )}

        {waitingForState ? (
          <CircularProgress size={18} />
        ) : (
          <Switch
            checked={isOn}
            onChange={(e) => onToggle(e.target.checked)}
            disabled={!online || toggling || locked}
          />
        )}
      </Stack>

      
    </Box>
  );
}
