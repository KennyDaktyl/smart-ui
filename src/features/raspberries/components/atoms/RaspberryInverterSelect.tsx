import { FormControl, Select, MenuItem, InputLabel } from "@mui/material";
import { useTranslation } from "react-i18next";

interface RaspberryInverterSelectProps {
  value: number | "";
  inverters: any[];
  loading: boolean;
  onChange: (id: number) => void;
}

export function RaspberryInverterSelect({
  value,
  inverters,
  loading,
  onChange,
}: RaspberryInverterSelectProps) {
  const { t } = useTranslation();

  return (
    <FormControl fullWidth size="small" sx={{ mt: 2 }}>
      <InputLabel>{t("raspberries.select.label")}</InputLabel>

      <Select
        value={value}
        label={t("raspberries.select.label")}
        disabled={loading}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {inverters.map((inv) => (
          <MenuItem key={inv.id} value={inv.id}>
            {inv.name || inv.serial_number}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
