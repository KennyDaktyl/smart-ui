import { useCallback, useEffect, useState } from "react";
import { Button, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import type { LiveState } from "@/features/microcontrollers/hooks/useMicrocontrollerLive";
import type { Device } from "@/features/devices/types/devicesType";

import { devicesApi } from "@/api/devicesApi";
import { DeviceList } from "@/features/devices/components/DeviceList";
import { DeviceForm } from "@/features/devices/components/DeviceForm";
import { StickyDialog } from "@/components/dialogs/StickyDialog";

type Props = {
  microcontroller: MicrocontrollerResponse;
  live: LiveState;
  provider: any;
  openAddDialog: boolean;
  onCloseAddDialog: () => void;
  onDevicesChange?: (devices: Device[]) => void;
};

export function DeviceSection({
  microcontroller,
  live,
  provider,
  openAddDialog,
  onCloseAddDialog,
  onDevicesChange,
}: Props) {
  const { t } = useTranslation();

  const [devices, setDevices] = useState<Device[]>(
    microcontroller.devices ?? []
  );

  const syncDevices = useCallback(
    (nextDevices: Device[]) => {
      setDevices(nextDevices);
      onDevicesChange?.(nextDevices);
    },
    [onDevicesChange]
  );

  const handleDeviceUpdate = (updated: Device) => {
    setDevices((prev) => {
      const next = prev.map((d) =>
        d.id === updated.id ? { ...d, ...updated } : d
      );
      onDevicesChange?.(next);
      return next;
    });
  };

  useEffect(() => {
    syncDevices(microcontroller.devices ?? []);
  }, [microcontroller.devices, syncDevices]);

  const reloadDevices = async (): Promise<void> => {
    try {
      const res = await devicesApi.listForMicrocontroller(
        microcontroller.uuid
      );
      syncDevices(res.data);
    } catch (error) {
      console.error("Failed to reload devices", error);
    }
  };

  return (
    <>
      <Typography variant="subtitle1" fontWeight={600} mb={1}>
        {t("devices.sectionTitle", { name: microcontroller.name })}
      </Typography>

      <DeviceList
        devices={devices}
        liveInitialized={live.status !== "pending"}
        isOnline={live.status === "online"}
        microcontrollerUuid={microcontroller.uuid}
        provider={provider}
        assignedSensors={microcontroller.assigned_sensors}
        onReload={reloadDevices}
        onDeviceUpdate={handleDeviceUpdate}
      />

      <StickyDialog
        open={openAddDialog}
        onClose={onCloseAddDialog}
        maxWidth="md"
        title={t("common.add")}
        actions={
          <>
            <Button variant="outlined" onClick={onCloseAddDialog}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="create-device-form" variant="contained">
              {t("common.save")}
            </Button>
          </>
        }
      >
        <DeviceForm
          microcontrollerUuid={microcontroller.uuid}
          provider={provider}
          microcontrollerOnline={live.status === "online"}
          assignedSensors={microcontroller.assigned_sensors}
          formId="create-device-form"
          hideActions
          existingDevices={devices}
          maxDevices={microcontroller.max_devices}
          onSubmit={async () => {
            onCloseAddDialog();
            await reloadDevices();
          }}
          onCancel={onCloseAddDialog}
          variant="modal"
        />
      </StickyDialog>
    </>
  );
}
