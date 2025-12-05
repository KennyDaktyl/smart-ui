import { Typography, Button, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  slotIndex: number;
  onAdd: () => void;
}

export function EmptyDeviceSlot({ slotIndex, onAdd }: Props) {
  const { t } = useTranslation();

  return (
    <Stack spacing={1}>
      <Typography variant="body2">
        {t("devices.emptySlot", { slot: slotIndex })}
      </Typography>

      <Button variant="outlined" size="small" onClick={onAdd}>
        {t("devices.addDevice")}
      </Button>
    </Stack>
  );
}
