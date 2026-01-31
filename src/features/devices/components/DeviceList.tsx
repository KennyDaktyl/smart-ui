import { Box, Typography, List, ListItem, ListItemText, Chip } from "@mui/material";
import { Device } from "../types/devicesType";

type Props = {
  devices: Device[];
  liveInitialized: boolean;
  isOnline: boolean;
  microcontrollerUuid: string;
};

export function DeviceList({
  devices,
  isOnline,
}: Props) {
  if (!devices.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No devices assigned
      </Typography>
    );
  }

  return (
    <List dense>
      {devices.map((device) => (
        <ListItem
          key={device.uuid}
          secondaryAction={
            <Chip
              size="small"
              label={isOnline ? "ACTIVE" : "INACTIVE"}
            />
          }
        >
          <ListItemText
            primary={device.name}
            secondary={`Mode: ${device.mode}`}
          />
        </ListItem>
      ))}
    </List>
  );
}
