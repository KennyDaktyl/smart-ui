// src/components/Devices/DeviceList.tsx

import { useMemo } from "react";
import { Stack } from "@mui/material";
import { DeviceSlot } from "./DeviceSlot";

interface DeviceListProps {
  devices: any[];      // dane z API
  live: any[];         // dane z heartbeat
  liveInitialized: boolean;
  raspberryId: number;
  onRefresh: () => void;
}

export function DeviceList({
  devices,
  live,
  liveInitialized,
  raspberryId,
  onRefresh,
}: DeviceListProps) {
  
  /* ------------------------------------------------------------
   * MERGE danych API + heartbeat — zoptymalizowany
   * ------------------------------------------------------------ */
  const mergedDevices = useMemo(() => {
    return devices.map((dev) => {
      const liveData = live.find((l) => Number(l.device_id) === Number(dev.id));

      return {
        ...dev,
        online: liveInitialized ? !!liveData : false,
        is_on: liveInitialized ? liveData?.is_on ?? false : false,
        waitingForState: !liveInitialized,
      };
    });
  }, [devices, live, liveInitialized]);

  /* ------------------------------------------------------------
   * Liczba slotów = max device_number
   * ------------------------------------------------------------ */
  const maxSlots = useMemo(() => {
    if (devices.length === 0) return 1;
    return Math.max(...devices.map((d) => d.device_number));
  }, [devices]);

  /* ------------------------------------------------------------
   * RENDER SLOTÓW
   * ------------------------------------------------------------ */
  return (
    <Stack spacing={2} mt={2}>
      {Array.from({ length: maxSlots }).map((_, idx) => {
        const slotNumber = idx + 1;

        const dev = mergedDevices.find((d) => d.device_number === slotNumber);

        return (
          <DeviceSlot
            key={slotNumber}
            raspberryId={raspberryId}
            device={dev}
            slotIndex={slotNumber}
            liveInitialized={liveInitialized}
            onRefresh={onRefresh}
          />
        );
      })}
    </Stack>
  );
}
