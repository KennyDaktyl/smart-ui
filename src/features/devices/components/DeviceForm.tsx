import {
  Box,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Button,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Device } from "@/features/devices/types/devicesType";
import type { ProviderResponse } from "@/features/providers/types/userProvider";
import type { DeviceMode } from "@/features/devices/enums/deviceMode";
import { ProviderLiveEnergy } from "@/features/providers/live/ProviderLiveEnergy";
import { DeviceThresholdControl } from "@/features/devices/components/DeviceThresholdControl";
import { useDeviceActions } from "@/features/devices/hooks/useDeviceActions";
import { devicesApi } from "@/api/devicesApi";

export type DeviceFormValues = {
  name: string;
  mode: DeviceMode;
  thresholdValue?: number | null;
};

type Props = {
  device?: Device;
  provider?: ProviderResponse | null;
  microcontrollerOnline: boolean;
  onSubmit?: (values: DeviceFormValues) => Promise<void> | void;
  variant?: "panel" | "modal";
  microcontrollerUuid?: string;
  onCancel?: () => void;
  existingDevices?: Device[];
  maxDevices?: number;
};

const getNextDeviceNumber = (
  device: Device | undefined,
  existingDevices: Device[] | undefined,
  maxDevices: number | undefined
) => {
  if (device?.device_number != null) {
    return device.device_number;
  }

  const used = new Set((existingDevices ?? []).map((d) => d.device_number));
  const upperBound = maxDevices ?? Math.max(used.size + 1, 1);
  for (let i = 1; i <= upperBound; i += 1) {
    if (!used.has(i)) return i;
  }
  return upperBound + 1;
};

export function DeviceForm({
  device,
  provider,
  microcontrollerOnline,
  onSubmit,
  variant = "panel",
  microcontrollerUuid,
  onCancel,
  existingDevices,
  maxDevices,
}: Props) {
  const { t } = useTranslation();
  const tt = t as (key: string, options?: Record<string, unknown>) => string;
  const { setManualState, manualSaving, error, clearError } = useDeviceActions();
  const hasError = Boolean(error);

  const [name, setName] = useState(device?.name ?? "");
  const [mode, setMode] = useState<DeviceMode>(device?.mode ?? "AUTO");
  const [deviceNumber, setDeviceNumber] = useState<number>(
    getNextDeviceNumber(device, existingDevices, maxDevices)
  );
  const [ratedPower, setRatedPower] = useState<string>(
    device?.rated_power_w != null ? String(device.rated_power_w) : ""
  );
  const [manualState, setManualStateValue] = useState<boolean>(device?.manual_state ?? false);
  const [thresholdValue, setThresholdValue] = useState<number>(
    device?.threshold_value ?? provider?.value_min ?? 0
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setName(device?.name ?? "");
    setMode(device?.mode ?? "AUTO");
    setDeviceNumber(getNextDeviceNumber(device, existingDevices, maxDevices));
    setRatedPower(device?.rated_power_w != null ? String(device.rated_power_w) : "");
    setManualStateValue(device?.manual_state ?? false);
    setThresholdValue(device?.threshold_value ?? provider?.value_min ?? 0);
    setSubmitted(false);
  }, [device, existingDevices, maxDevices, provider?.value_min]);

  const isManual = mode === "MANUAL";
  const canUseForm = microcontrollerOnline && Boolean(provider);
  const isAtCapacity =
    !device && maxDevices != null && (existingDevices?.length ?? 0) >= maxDevices;
  const ratedPowerNumber = ratedPower.trim() === "" ? null : Number(ratedPower);
  const isRatedPowerValid =
    ratedPowerNumber != null && !Number.isNaN(ratedPowerNumber);

  const thresholdMin = provider?.value_min ?? 0;
  const thresholdMax = provider?.value_max ?? 0;
  const thresholdUnit = provider?.unit ?? null;
  const thresholdStep = thresholdUnit === "kW" ? 0.1 : thresholdUnit === "W" ? 10 : 1;
  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#ffffff",
      color: "#111827",
      "& fieldset": {
        borderColor: "#d1d5db",
      },
      "&:hover fieldset": {
        borderColor: "#9ca3af",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#2563eb",
        borderWidth: 2,
      },
    },
    "& .MuiInputLabel-root": {
      color: "#374151",
      backgroundColor: "#ffffff",
      padding: "0 4px",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#2563eb",
    },
    "& .MuiInputLabel-root.MuiInputLabel-shrink": {
      color: "#374151",
    },
    "& .MuiFormHelperText-root": {
      color: "#dc2626",
    },
  };

  const handleManualToggle = async (next: boolean) => {
    if (!device?.id) return;
    clearError();
    const res = await setManualState(device.id, next);
    const nextDevice = res?.device ?? null;
    const nextState =
      typeof nextDevice?.manual_state === "boolean"
        ? nextDevice.manual_state
        : next;
    setManualStateValue(nextState);
    if (nextDevice?.mode) {
      setMode(nextDevice.mode as DeviceMode);
    }
  };

  const handleSubmit = async () => {
    if (!onSubmit) return;
    setSubmitted(true);
    if (isAtCapacity) return;
    if (!name.trim()) return;
    if (mode === "AUTO" && (thresholdValue == null || Number.isNaN(thresholdValue))) return;
    if (deviceNumber == null || Number.isNaN(deviceNumber)) return;
    if (!isRatedPowerValid) return;
    setSubmitting(true);
    try {
      if (device?.id) {
        await devicesApi.updateDevice(device.id, {
          name: name.trim(),
          device_number: deviceNumber,
          mode,
          threshold_value: isManual ? null : thresholdValue,
          rated_power_w: ratedPowerNumber,
        });
      } else if (microcontrollerUuid) {
        await devicesApi.createDevice(microcontrollerUuid, {
          name: name.trim(),
          device_number: deviceNumber,
          mode,
          threshold_value: isManual ? null : thresholdValue,
          rated_power_w: ratedPowerNumber,
        });
      }
      await onSubmit({
        name: name.trim(),
        mode,
        thresholdValue: isManual ? null : thresholdValue,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!microcontrollerOnline) {
    return (
      <Typography variant="body2" color="text.secondary">
        {tt("microcontroller.offlineWarning")}
      </Typography>
    );
  }

  if (!provider) {
    return (
      <Typography variant="body2" color="text.secondary">
        {tt("providers.empty.description")}
      </Typography>
    );
  }

  const content = (
    <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" fontWeight={700}>
            {tt("common.add")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {tt("common.configuration")}
          </Typography>
        </Stack>

          <Stack spacing={2}>
            <TextField
              label={tt("microcontroller.form.name")}
              size="small"
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
              sx={fieldSx}
              required
              error={submitted && !name.trim()}
              helperText={submitted && !name.trim() ? tt("errors.validation.required") : " "}
            />

            <FormControl fullWidth size="small" sx={fieldSx}>
              <InputLabel>{tt("common.configuration")}</InputLabel>
              <Select
                label={tt("common.configuration")}
                value={mode}
                onChange={(event) => setMode(event.target.value as DeviceMode)}
              >
                <MenuItem value="AUTO">AUTO</MenuItem>
                <MenuItem value="MANUAL">MANUAL</MenuItem>
                <MenuItem value="SCHEDULE">SCHEDULE</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="GPIO"
              size="small"
              type="number"
              value={deviceNumber}
              fullWidth
              sx={fieldSx}
              required
              inputProps={{ min: 1, step: 1, readOnly: true }}
              disabled
              error={submitted && (deviceNumber == null || Number.isNaN(deviceNumber))}
              helperText={
                submitted && (deviceNumber == null || Number.isNaN(deviceNumber))
                  ? tt("errors.validation.required")
                  : " "
              }
            />

            <TextField
              label={`${tt("devices.ratedPower")} (${provider?.unit ?? "W"})`}
              size="small"
              type="number"
              value={ratedPower}
              onChange={(event) => {
                setRatedPower(event.target.value);
              }}
              fullWidth
              sx={fieldSx}
              inputProps={{ min: 0, step: 1 }}
              required
              error={submitted && !isRatedPowerValid}
              helperText={
                submitted && !isRatedPowerValid
                  ? tt("errors.validation.required")
                  : " "
              }
            />
          </Stack>

          {isManual ? (
            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={600}>
                {`${tt("common.enabled")} / ${tt("common.disabled")}`}
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={manualState}
                    disabled={!microcontrollerOnline || manualSaving || !device?.id}
                    onChange={(_, next) => handleManualToggle(next)}
                  />
                }
                label={manualState ? tt("common.enabled") : tt("common.disabled")}
              />
              {hasError && (
                <Typography variant="caption" color="error">
                  {tt("common.error.generic")}
                </Typography>
              )}
            </Stack>
          ) : (
            <Stack spacing={2}>
              {/* <Typography variant="subtitle2" fontWeight={600}>
                {tt("microcontroller.maxDevices")}
              </Typography> */}
              <DeviceThresholdControl
                value={thresholdValue}
                min={thresholdMin}
                max={thresholdMax}
                unit={thresholdUnit}
                step={thresholdStep}
                disabled={!canUseForm}
                onChange={setThresholdValue}
              />
              <Divider />
            </Stack>
          )}

        {onSubmit && (
          <Box display="flex" justifyContent="flex-end" gap={1}>
            {onCancel && (
              <Button variant="outlined" onClick={onCancel}>
                {tt("common.cancel")}
              </Button>
            )}
            <Button
              variant="contained"
              disabled={submitting || isAtCapacity}
              onClick={handleSubmit}
            >
              {tt("common.save")}
            </Button>
          </Box>
        )}
    </Stack>
  );

  if (variant === "modal") {
    return content;
  }

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        bgcolor: "background.paper",
        borderColor: "divider",
      }}
    >
      <CardContent>{content}</CardContent>
    </Card>
  );
}
