import { Typography, Button, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  slotIndex: number;
  onAdd: () => void;
  disabled?: boolean;
  helperText?: string;
}

export function EmptyDeviceSlot({ slotIndex, onAdd, disabled, helperText }: Props) {
  const { t } = useTranslation();

  return (
    <Stack spacing={1}>
      <Typography variant="body2">
        {t("devices.emptySlot", { slot: slotIndex })}
      </Typography>

      {helperText && (
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      )}

      <Button variant="outlined" size="small" onClick={onAdd} disabled={disabled}>
        {t("devices.addDevice")}
      </Button>
    </Stack>
  );
}
