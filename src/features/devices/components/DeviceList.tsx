import { Box, Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useState } from "react";

import type { Device } from "../types/devicesType";
import type { ProviderResponse } from "@/features/providers/types/userProvider";

import { DeviceCard } from "@/features/devices/components/DeviceCard";
import { useDeviceLiveState } from "@/features/devices/live/useDeviceLiveState";
import { DeviceForm } from "@/features/devices/components/DeviceForm";
import { devicesApi } from "@/api/devicesApi";

type Props = {
  devices: Device[];
  liveInitialized: boolean;
  isOnline: boolean;
  microcontrollerUuid: string;
  provider?: ProviderResponse | null;
  onReload?: () => void;
  onDeviceUpdate?: (device: Device) => void;
};

export function DeviceList({
  devices,
  isOnline,
  microcontrollerUuid,
  provider,
  onReload,
  onDeviceUpdate,
}: Props) {
  const { t } = useTranslation();
  const liveMap = useDeviceLiveState(microcontrollerUuid);

  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  if (!devices.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t("common.none")}
      </Typography>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",              // mobile: 1 w kolumnie, pełna szerokość
            sm: "repeat(2, minmax(0, 1fr))",   // tablet: 2
            md: "repeat(3, minmax(0, 1fr))",   // desktop: max 3
          },
          gap: { xs: 2, md: 3 },
          width: "100%",
          justifyItems: "stretch",
          alignItems: "stretch",
        }}
      >
        {devices.map((device) => (
          <Box key={device.id} sx={{ width: "100%", minWidth: 0 }}>
            <DeviceCard
              device={device}
              liveState={liveMap[device.id]}
              provider={provider}
              toggleDisabled={togglingIds.has(device.id) || !isOnline}
              onToggle={async (d, next) => {
                setTogglingIds((prev) => new Set(prev).add(d.id));
                try {
                  const res = await devicesApi.setManualState(d.id, next);
                  const updated = res.data?.device ?? res.data;
                  if (updated?.id != null) onDeviceUpdate?.(updated);
                  else onReload?.();
                } finally {
                  setTogglingIds((prev) => {
                    const copy = new Set(prev);
                    copy.delete(d.id);
                    return copy;
                  });
                }
              }}
              onEdit={(d) => setEditingDevice(d)}
              onDelete={async (d) => {
                await devicesApi.deleteDevice(d.id);
                onReload?.();
              }}
            />
          </Box>
        ))}
      </Box>

      <Dialog
        open={Boolean(editingDevice)}
        onClose={() => setEditingDevice(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t("common.edit")}</DialogTitle>
        <DialogContent dividers>
          {editingDevice && (
            <DeviceForm
              device={editingDevice}
              provider={provider}
              microcontrollerOnline={isOnline}
              onSubmit={() => {
                setEditingDevice(null);
                onReload?.();
              }}
              onCancel={() => setEditingDevice(null)}
              variant="modal"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
