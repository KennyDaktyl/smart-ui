import { useState } from "react";
import {
  Card,
  CardContent,
  IconButton,
  Stack,
  TextField,
  MenuItem,
} from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

import { DeviceFormData } from "@/types/device";
import { DeviceMode } from "@/types/enums";

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

  const [errors, setErrors] = useState<Record<string, string>>({
    rated_power_kw: "",
    threshold_kw: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value === "" ? "" : value,
    }));

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {
      rated_power_kw: "",
      threshold_kw: "",
    };

    if (form.rated_power_kw === "" || Number(form.rated_power_kw) <= 0) {
      newErrors.rated_power_kw = "Pole 'Moc (kW)' jest wymagane.";
      isValid = false;
    }

    if (form.mode === DeviceMode.AUTO_POWER) {
      if (form.threshold_kw === "" || Number(form.threshold_kw) <= 0) {
        newErrors.threshold_kw = "Pole 'Próg mocy PV (kW)' jest wymagane.";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmitForm = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validate()) return;

    const normalized: DeviceFormData = {
      ...form,
      rated_power_kw:
        form.rated_power_kw === "" ? 0 : Number(form.rated_power_kw),
      threshold_kw:
        form.mode === DeviceMode.AUTO_POWER
          ? (form.threshold_kw === "" ? "" : Number(form.threshold_kw))
          : "",
    };

    onSubmit(normalized);
  };

  return (
    <Card sx={{ p: 1, opacity: locked ? 0.5 : 1 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between">
          <Stack direction="row" alignItems="center">
            <IconButton onClick={handleSubmitForm} disabled={saving || locked}>
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
            name="name"
            fullWidth
            size="small"
            value={form.name}
            onChange={handleChange}
            disabled={locked}
          />

          <TextField
            label="Moc (kW)"
            name="rated_power_kw"
            type="number"
            fullWidth
            size="small"
            value={form.rated_power_kw}
            onChange={handleChange}
            disabled={locked}
            error={!!errors.rated_power_kw}
            helperText={errors.rated_power_kw}
          />

          <TextField
            select
            label="Tryb pracy"
            name="mode"
            fullWidth
            size="small"
            value={form.mode}
            onChange={handleChange}
            disabled={locked}
          >
            <MenuItem value={DeviceMode.MANUAL}>Ręczny</MenuItem>
            <MenuItem value={DeviceMode.AUTO_POWER}>Auto moc PV</MenuItem>
            <MenuItem value={DeviceMode.SCHEDULE}>Harmonogram</MenuItem>
          </TextField>

          {form.mode === DeviceMode.AUTO_POWER && (
            <TextField
              label="Próg mocy PV (kW)"
              name="threshold_kw"
              type="number"
              fullWidth
              size="small"
              value={form.threshold_kw}
              onChange={handleChange}
              disabled={locked}
              error={!!errors.threshold_kw}
              helperText={errors.threshold_kw}
            />
          )}

          <TextField
            label="Slot"
            name="device_number"
            fullWidth
            size="small"
            value={form.device_number}
            slotProps={{
              input: {
                readOnly: true,
              },
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
