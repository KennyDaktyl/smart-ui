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
  
  export function DeviceView({
    device,
    online,
    locked,
    manualState,
    isToggling,
    onEdit,
    onDelete,
    onToggle,
  }: any) {
    return (
      <Card sx={{ opacity: locked ? 0.5 : 1 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between">
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography>{device.name}</Typography>
              <CircleIcon sx={{ fontSize: 12, color: online ? "green" : "grey" }} />
            </Stack>
  
            <Stack direction="row" spacing={1}>
              <IconButton onClick={onEdit} disabled={locked}>
                <EditIcon color="primary" />
              </IconButton>
  
              <IconButton onClick={onDelete} disabled={locked}>
                <DeleteIcon color="error" />
              </IconButton>
            </Stack>
          </Stack>
  
          <Typography variant="body2">Slot: {device.device_number}</Typography>
          <Typography variant="body2">
            Moc: {device.rated_power_kw ?? "n/d"} kW
          </Typography>
          <Typography variant="body2">Tryb: {device.mode}</Typography>
  
          <Box mt={1}>
            {!online ? (
              <Chip label="Offline" size="small" />
            ) : device.mode === "MANUAL" ? (
              <Stack direction="row" spacing={2} alignItems="center">
                <Switch
                  checked={manualState}
                  onChange={(e) => onToggle(e.target.checked)}
                  disabled={isToggling || locked}
                />
                <Chip
                  label={manualState ? "Włączony" : "Wyłączony"}
                  color={manualState ? "success" : "default"}
                  size="small"
                />
              </Stack>
            ) : (
              <Typography variant="body2">
                Stan: {device.is_on ? "Włączony" : "Wyłączony"}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  }
  