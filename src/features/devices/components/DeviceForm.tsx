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
import { useTranslation } from "react-i18next";
import { DeviceFormData, DeviceUIMode } from "../types/device";

interface DeviceFormProps {
  value: DeviceFormData;
  disabled: boolean;
  saving: boolean;
  onChange(next: DeviceFormData): void;
  onSubmit(): void;
  onCancel(): void;
}

export function DeviceForm({
  value,
  disabled,
  saving,
  onChange,
  onSubmit,
  onCancel,
}: DeviceFormProps) {
  const { t } = useTranslation();

  const handleChange =
    (field: keyof DeviceFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;

      onChange({
        ...value,
        [field]:
          raw === ""
            ? ""
            : field === "name"
            ? raw
            : Number(raw),
      });
    };

  const isAutoMode = value.mode === DeviceUIMode.AUTO_POWER;

  const nameError =
    value.name.trim().length === 0
      ? t("devices.form.errors.nameRequired")
      : "";

  const powerError =
    value.rated_power_w === "" || value.rated_power_w <= 0
      ? t("devices.form.errors.powerRequired")
      : "";

  const thresholdError =
    isAutoMode &&
    (value.threshold_value === "" || value.threshold_value <= 0)
      ? t("devices.form.errors.thresholdRequired")
      : "";

  const hasErrors = Boolean(nameError || powerError || thresholdError);

  return (
    <Card
      sx={{
        p: 1,
        opacity: disabled ? 0.6 : 1,
        border: "1px solid rgba(15,139,111,0.14)",
      }}
    >
      <CardContent>
        {/* ACTIONS */}
        <Stack direction="row" justifyContent="space-between">
          <Stack direction="row">
            <IconButton
              onClick={onSubmit}
              disabled={saving || disabled || hasErrors}
            >
              <SaveIcon color="primary" />
            </IconButton>

            <IconButton onClick={onCancel} disabled={saving}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>

        {/* FORM */}
        <Stack spacing={2} mt={2}>
          <TextField
            label={t("devices.form.nameLabel")}
            value={value.name}
            onChange={handleChange("name")}
            disabled={disabled}
            error={!!nameError}
            helperText={nameError}
            size="small"
            fullWidth
          />

          <TextField
            label={t("devices.form.powerLabel")}
            type="number"
            value={value.rated_power_w}
            onChange={handleChange("rated_power_w")}
            disabled={disabled}
            error={!!powerError}
            helperText={powerError}
            size="small"
            fullWidth
          />

          <TextField
            select
            label={t("devices.form.modeLabel")}
            value={value.mode}
            onChange={(e) =>
              onChange({
                ...value,
                mode: e.target.value as DeviceUIMode,
                threshold_value: "",
              })
            }
            disabled={disabled}
            size="small"
            fullWidth
          >
            <MenuItem value={DeviceUIMode.MANUAL}>
              {t("devices.form.modes.manual")}
            </MenuItem>
            <MenuItem value={DeviceUIMode.AUTO_POWER}>
              {t("devices.form.modes.autoPower")}
            </MenuItem>
            <MenuItem value={DeviceUIMode.SCHEDULE}>
              {t("devices.form.modes.schedule")}
            </MenuItem>
          </TextField>

          {isAutoMode && (
            <TextField
              label={t("devices.form.thresholdLabel")}
              type="number"
              value={value.threshold_value}
              onChange={handleChange("threshold_value")}
              disabled={disabled}
              error={!!thresholdError}
              helperText={thresholdError}
              size="small"
              fullWidth
            />
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
