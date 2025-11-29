import { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Stack,
  TextField,
  MenuItem,
} from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

interface DeviceFormData {
  name: string;
  rated_power_kw: string | number;
  mode: string;
  device_number: number;
  threshold_kw: string | number;
}

interface DeviceFormProps {
  initialData: DeviceFormData;
  locked: boolean;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (form: DeviceFormData) => void;
}

export function DeviceForm({
  initialData,
  locked,
  saving,
  onCancel,
  onSubmit,
}: DeviceFormProps) {
  
  const [form, setForm] = useState<DeviceFormData>(initialData);

  const [errors, setErrors] = useState<{ 
    rated_power_kw: string; 
    threshold_kw: string; 
  }>({
    rated_power_kw: "",
    threshold_kw: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev: DeviceFormData) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    let valid = true;
    const newErrors = {
      rated_power_kw: "",
      threshold_kw: "",
    };

    if (!form.rated_power_kw || Number(form.rated_power_kw) <= 0) {
      newErrors.rated_power_kw = "Pole 'Moc (kW)' jest wymagane.";
      valid = false;
    }

    if (form.mode === "AUTO_POWER") {
      if (!form.threshold_kw || Number(form.threshold_kw) <= 0) {
        newErrors.threshold_kw =
          "Pole 'Próg mocy PV (kW)' jest wymagane.";
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSave = () => {
    if (validate()) onSubmit(form);
  };

  return (
    <Card sx={{ p: 1, opacity: locked ? 0.5 : 1 }}>
      <CardContent>

        <Stack direction="row" justifyContent="space-between">
          <Stack direction="row">
            <IconButton onClick={handleSave} disabled={saving || locked}>
              <SaveIcon color="primary" />
            </IconButton>

            <IconButton onClick={onCancel}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>

        <Stack spacing={2} mt={2}>
          <TextField
            label="Nazwa"
            fullWidth
            size="small"
            name="name"
            value={form.name}
            onChange={handleChange}
            disabled={locked}
          />

          <TextField
            label="Moc (kW)"
            fullWidth
            size="small"
            name="rated_power_kw"
            type="number"
            value={form.rated_power_kw}
            onChange={handleChange}
            disabled={locked}
            error={!!errors.rated_power_kw}
            helperText={errors.rated_power_kw}
          />

          <TextField
            select
            label="Tryb pracy"
            fullWidth
            size="small"
            name="mode"
            value={form.mode}
            onChange={handleChange}
            disabled={locked}
          >
            <MenuItem value="MANUAL">Ręczny</MenuItem>
            <MenuItem value="AUTO_POWER">Auto moc PV</MenuItem>
            <MenuItem value="SCHEDULE">Harmonogram</MenuItem>
          </TextField>

          {form.mode === "AUTO_POWER" && (
            <TextField
              label="Próg mocy PV (kW)"
              fullWidth
              size="small"
              name="threshold_kw"
              type="number"
              value={form.threshold_kw}
              onChange={handleChange}
              disabled={locked}
              error={!!errors.threshold_kw}
              helperText={errors.threshold_kw}
            />
          )}

          <TextField
            label="Slot"
            fullWidth
            size="small"
            name="device_number"
            value={form.device_number}
            InputProps={{ readOnly: true }}
          />

        </Stack>
      </CardContent>
    </Card>
  );
}
