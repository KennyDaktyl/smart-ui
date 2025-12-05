import { Typography, Button, Stack } from "@mui/material";

interface Props {
  slotIndex: number;
  onAdd: () => void;
}

export function EmptyDeviceSlot({ slotIndex, onAdd }: Props) {
  return (
    <Stack spacing={1}>
      <Typography variant="body2">
        Brak urządzenia w slocie {slotIndex}
      </Typography>

      <Button variant="outlined" size="small" onClick={onAdd}>
        Dodaj urządzenie
      </Button>
    </Stack>
  );
}
