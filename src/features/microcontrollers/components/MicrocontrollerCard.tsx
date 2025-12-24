import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { DeviceList } from "@/features/devices/components/DeviceList";
import { Microcontroller } from "./types";
import { canAddDevice, remainingDeviceSlots } from "../microcontroller.logic";


export function MicrocontrollerCard({
  microcontroller,
  onAttachProvider,
  onRefresh,
}: {
  microcontroller: Microcontroller;
  onAttachProvider(mc: Microcontroller): void;
  onRefresh(): void;
}) {
  const { t } = useTranslation();

  const provider = microcontroller.active_provider;
  const canAdd = canAddDevice(microcontroller);
  const remainingSlots = remainingDeviceSlots(microcontroller);

  const providerRangeLabel = (min: number | null | undefined, max: number | null | undefined, unit?: string | null) => {
    if (min == null && max == null) return t("microcontrollers.providerRangeUnknown");
    return t("microcontrollers.providerRangeLabel", {
      min: min ?? "-",
      max: max ?? "-",
      unit: unit ?? t("common.notAvailable"),
    });
  };

  const liveDevices = microcontroller.devices.map((device) => ({
    device_id: device.id,
    is_on: device.is_on ?? device.manual_state ?? false,
  }));

  return (
    <Card
      sx={{
        background: "linear-gradient(180deg, #0b1f2a 0%, #081824 100%)",
        color: "#f1f7f6",
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          {/* HEADER */}
          <Stack direction="row" justifyContent="space-between">
            <Stack spacing={0.25}>
              <Typography variant="h6" fontWeight={700}>
                {microcontroller.name}
              </Typography>

              <Typography
                variant="caption"
                sx={{ color: "rgba(241,247,246,0.6)" }}
              >
                {t("microcontrollers.typeLabel", {
                  type: microcontroller.type,
                })}
                {microcontroller.software_version &&
                  ` · v${microcontroller.software_version}`}
              </Typography>
            </Stack>

            <Chip
              size="small"
              label={
                microcontroller.enabled
                  ? t("microcontrollers.statusActive")
                  : t("microcontrollers.statusInactive")
              }
              sx={{
                fontWeight: 600,
                backgroundColor: microcontroller.enabled
                  ? "rgba(46, 204, 113, 0.15)"
                  : "rgba(255,255,255,0.08)",
                color: microcontroller.enabled ? "#2ecc71" : "#cfd8dc",
              }}
            />
          </Stack>

          {microcontroller.description && (
            <Typography
              variant="body2"
              sx={{ color: "rgba(241,247,246,0.7)" }}
            >
              {microcontroller.description}
            </Typography>
          )}

          <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

          {/* SLOT INFO */}
          <Typography variant="body2" sx={{ color: "rgba(241,247,246,0.75)" }}>
            {t("microcontrollers.deviceSlotsInfo", {
              used: microcontroller.devices.length,
              max: microcontroller.max_devices,
            })}
            {remainingSlots > 0 && (
              <> · {t("microcontrollers.slotsRemaining", { count: remainingSlots })}</>
            )}
          </Typography>

          {!canAdd && (
            <Alert
              severity="info"
              sx={{
                backgroundColor: "rgba(52, 152, 219, 0.15)",
                color: "#d6ecfa",
                border: "1px solid rgba(52, 152, 219, 0.35)",
              }}
            >
              {t("microcontrollers.maxDevicesReached")}
            </Alert>
          )}

          <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

          {/* PROVIDER */}
          {provider ? (
            <Stack
              spacing={0.75}
              sx={{
                borderRadius: 2,
                border: "1px solid rgba(255,255,255,0.12)",
                p: 1,
                backgroundColor: "rgba(255,255,255,0.02)",
              }}
            >
              <Typography variant="subtitle2" fontWeight={600}>
                {t("microcontrollers.providerCardTitle")}
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap">
                {provider.provider_type && (
                  <Chip
                    size="small"
                    label={provider.provider_type.toUpperCase()}
                    sx={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#f1f7f6" }}
                  />
                )}
                {provider.vendor && (
                  <Chip
                    size="small"
                    label={provider.vendor}
                    sx={{ borderColor: "rgba(255,255,255,0.25)", color: "#f1f7f6" }}
                  />
                )}
                {provider.unit && (
                  <Chip
                    size="small"
                    label={provider.unit}
                    sx={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#f1f7f6" }}
                  />
                )}
              </Stack>
              <Typography variant="body2" color="rgba(241,247,246,0.7)">
                {provider.name ?? provider.vendor ?? t("microcontrollers.providerUnknown")}
              </Typography>
              <Typography variant="body2" color="rgba(241,247,246,0.6)">
                {providerRangeLabel(provider.value_min, provider.value_max, provider.unit)}
              </Typography>
              {provider.kind && (
                <Typography variant="body2" color="rgba(241,247,246,0.6)">
                  {t("microcontrollers.providerKindLabel", { kind: provider.kind })}
                </Typography>
              )}
            </Stack>
          ) : (
            <Alert
              severity="warning"
              sx={{
                backgroundColor: "rgba(241, 196, 15, 0.12)",
                color: "#fdebd0",
                border: "1px solid rgba(241, 196, 15, 0.35)",
              }}
            >
              {t("microcontrollers.manualOnlyHint")}
            </Alert>
          )}

          {/* ACTIONS */}
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#0f8b6f",
                "&:hover": { backgroundColor: "#0c735b" },
              }}
              onClick={() => onAttachProvider(microcontroller)}
            >
              {provider ? t("microcontrollers.changeProvider") : t("microcontrollers.attachProvider")}
            </Button>
          </Stack>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

          <DeviceList
            devices={microcontroller.devices}
            live={liveDevices}
            liveInitialized
            isOnline={microcontroller.enabled}
            raspberryId={microcontroller.id}
            raspberryUuid={microcontroller.uuid}
            raspberryName={microcontroller.name}
            provider={microcontroller.active_provider}
            onRefresh={onRefresh}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
