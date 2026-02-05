import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import type { LiveState } from "@/features/microcontrollers/hooks/useMicrocontrollerLive";
import type { Device } from "@/features/devices/types/devicesType";

import { devicesApi } from "@/api/devicesApi";
import { DeviceList } from "@/features/devices/components/DeviceList";
import { DeviceForm } from "@/features/devices/components/DeviceForm";

type Props = {
  microcontroller: MicrocontrollerResponse;
  live: LiveState;
  provider: any;
  openAddDialog: boolean;
  onCloseAddDialog: () => void;
};

export function DeviceSection({
  microcontroller,
  live,
  provider,
  openAddDialog,
  onCloseAddDialog,
}: Props) {
  const { t } = useTranslation();

  const [devices, setDevices] = useState<Device[]>(
    microcontroller.devices ?? []
  );

  const handleDeviceUpdate = (updated: Device) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d))
    );
  };

  useEffect(() => {
    setDevices(microcontroller.devices ?? []);
  }, [microcontroller.devices]);

  const reloadDevices = async (): Promise<void> => {
    try {
      const res = await devicesApi.listForMicrocontroller(
        microcontroller.uuid
      );
      setDevices(res.data);
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
        onReload={reloadDevices}
        onDeviceUpdate={handleDeviceUpdate}
      />

      <Dialog
        open={openAddDialog}
        onClose={onCloseAddDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t("common.add")}</DialogTitle>
        <DialogContent dividers>
          <DeviceForm
            microcontrollerUuid={microcontroller.uuid}
            provider={provider}
            microcontrollerOnline={live.status === "online"}
            onSubmit={async () => {
              onCloseAddDialog();
              await reloadDevices();
            }}
            onCancel={onCloseAddDialog}
            variant="modal"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
