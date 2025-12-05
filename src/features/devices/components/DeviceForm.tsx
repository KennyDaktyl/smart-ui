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

import { DeviceFormData } from "@/features/devices/types/device";
import { DeviceMode } from "@/shared/enums/deviceMode";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  const [errors, setErrors] = useState<Record<string, string>>({
    name: "",
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
      name: "",
      rated_power_kw: "",
      threshold_kw: "",
    };

    if (!form.name || form.name.trim().length === 0) {
      newErrors.name = t("devices.form.errors.nameRequired");
      isValid = false;
    }

    if (form.rated_power_kw === "" || Number(form.rated_power_kw) <= 0) {
      newErrors.rated_power_kw = t("devices.form.errors.powerRequired");
      isValid = false;
    }

    if (form.mode === DeviceMode.AUTO_POWER) {
      if (form.threshold_kw === "" || Number(form.threshold_kw) <= 0) {
        newErrors.threshold_kw = t("devices.form.errors.thresholdRequired");
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

          {/* --- NAZWA REQUIRED --- */}
          <TextField
            label={t("devices.form.nameLabel")}
            name="name"
            fullWidth
            size="small"
            value={form.name}
            onChange={handleChange}
            disabled={locked}
            error={!!errors.name}
            helperText={errors.name}
          />

          <TextField
            label={t("devices.form.powerLabel")}
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
            label={t("devices.form.modeLabel")}
            name="mode"
            fullWidth
            size="small"
            value={form.mode}
            onChange={handleChange}
            disabled={locked}
          >
            <MenuItem value={DeviceMode.MANUAL}>{t("devices.form.modes.manual")}</MenuItem>
            <MenuItem value={DeviceMode.AUTO_POWER}>{t("devices.form.modes.autoPower")}</MenuItem>
            <MenuItem value={DeviceMode.SCHEDULE}>{t("devices.form.modes.schedule")}</MenuItem>
          </TextField>

          {form.mode === DeviceMode.AUTO_POWER && (
            <TextField
              label={t("devices.form.thresholdLabel")}
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
            label={t("devices.form.slotLabel")}
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
