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
    <FormControl
      fullWidth
      size="small"
      sx={{
        mt: 2,
        color: "#0d1b2a",
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          backgroundColor: "#ffffff",
          boxShadow: "0 10px 22px rgba(0,0,0,0.14)",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(15,139,111,0.32)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(15,139,111,0.4)",
            borderWidth: 1.5,
          },
        },
        "& .MuiInputLabel-root": {
          color: "#3c4a5a",
        },
        "& .MuiInputLabel-root.Mui-focused": {
          color: "#0f8b6f",
        },
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "rgba(15,139,111,0.18)",
        },
        "& .MuiSelect-select": {
          color: "#0d1b2a",
        },
        "& .MuiSvgIcon-root": {
          color: "#3c4a5a",
        },
      }}
    >
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
