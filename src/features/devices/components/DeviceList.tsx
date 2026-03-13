import { Box, Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";

import type { Device } from "../types/devicesType";
import type { ProviderResponse } from "@/features/providers/types/userProvider";

import { DeviceCard } from "@/features/devices/components/DeviceCard";
import { useDeviceLiveState } from "@/features/devices/live/useDeviceLiveState";
import { DeviceForm } from "@/features/devices/components/DeviceForm";
import { devicesApi } from "@/api/devicesApi";
import { StickyDialog } from "@/components/dialogs/StickyDialog";

type Props = {
  devices: Device[];
  liveInitialized: boolean;
  isOnline: boolean;
  microcontrollerUuid: string;
  provider?: ProviderResponse | null;
  assignedSensors?: string[];
  onReload?: () => void;
  onDeviceUpdate?: (device: Device) => void;
};

export function DeviceList({
  devices,
  liveInitialized,
  isOnline,
  microcontrollerUuid,
  provider,
  assignedSensors,
  onReload,
  onDeviceUpdate,
}: Props) {
  const { t } = useTranslation();
  const microcontrollerStatus: "online" | "offline" | "pending" =
    !liveInitialized ? "pending" : isOnline ? "online" : "offline";

  const deviceHeartbeatSubscriptions = useMemo(
    () =>
      devices
        .map((device) => ({ id: device.id, uuid: device.uuid }))
        .filter((subscription) => Boolean(subscription.uuid))
        .sort((left, right) => left.uuid.localeCompare(right.uuid)),
    [devices]
  );
  const liveMap = useDeviceLiveState(
    microcontrollerUuid,
    deviceHeartbeatSubscriptions
  );
  const [localState, setLocalState] = useState<Record<number, boolean | undefined>>({});

  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLocalState((prev) => {
      let changed = false;
      const next = { ...prev };

      Object.entries(prev).forEach(([id, override]) => {
        if (override === undefined) return;

        const live = liveMap[Number(id)];
        if (live && live.isOn === override) {
          next[Number(id)] = undefined;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [liveMap]);

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
              microcontrollerStatus={microcontrollerStatus}
              localOverride={localState[device.id]}
              provider={provider}
              toggleDisabled={togglingIds.has(device.id) || !isOnline}
              onToggle={async (d, next) => {
                setLocalState((s) => ({ ...s, [d.id]: next }));
                setTogglingIds((prev) => new Set(prev).add(d.id));

                try {
                  const res = await devicesApi.setManualState(d.id, next);
                  const payload = res.data;
                  const updated = payload?.device ?? payload;
                  const acknowledgedState =
                    typeof updated?.manual_state === "boolean"
                      ? updated.manual_state
                      : typeof updated?.is_on === "boolean"
                        ? updated.is_on
                        : typeof payload?.is_on === "boolean"
                          ? payload.is_on
                          : next;

                  if (updated?.id != null) {
                    const normalizedUpdated: Device = {
                      ...d,
                      ...updated,
                      manual_state: acknowledgedState,
                    };
                    onDeviceUpdate?.(normalizedUpdated);

                    // backend acknowledged → update local state from response
                    setLocalState((s) => ({
                      ...s,
                      [updated.id]: acknowledgedState,
                    }));
                  } else {
                    setLocalState((s) => ({
                      ...s,
                      [d.id]: acknowledgedState,
                    }));
                  }
                } catch {
                  setLocalState((s) => ({ ...s, [d.id]: undefined }));
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

      <StickyDialog
        open={Boolean(editingDevice)}
        onClose={() => setEditingDevice(null)}
        maxWidth="md"
        title={t("common.edit")}
        actions={
          <>
            <Button variant="outlined" onClick={() => setEditingDevice(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="edit-device-form" variant="contained">
              {t("common.save")}
            </Button>
          </>
        }
      >
        {editingDevice && (
          <DeviceForm
            device={editingDevice}
            provider={provider}
            microcontrollerOnline={isOnline}
            assignedSensors={assignedSensors}
            existingDevices={devices}
            formId="edit-device-form"
            hideActions
            onSubmit={() => {
              setEditingDevice(null);
              onReload?.();
            }}
            onCancel={() => setEditingDevice(null)}
            variant="modal"
          />
        )}
      </StickyDialog>
    </>
  );
}
