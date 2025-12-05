import {
    FormControl,
    Select,
    MenuItem,
    InputLabel,
  } from "@mui/material";
  
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
    return (
      <FormControl fullWidth size="small" sx={{ mt: 2 }}>
        <InputLabel>Przypisany inwerter</InputLabel>
  
        <Select
          value={value}
          label="Przypisany inwerter"
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
  