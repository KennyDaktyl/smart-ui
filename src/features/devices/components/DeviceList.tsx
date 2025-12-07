import { useMemo } from "react";
import { Stack } from "@mui/material";

import { DeviceSlot } from "./DeviceSlot";
import { mergeLiveDeviceData } from "../utils/mergeLiveDeviceData";
import { getMaxDeviceSlots } from "../utils/getMaxDeviceSlots";
import { DeviceSlotWrapper } from "../atoms/DeviceSlotWrapper";
import { EmptyDeviceSlot } from "../atoms/EmptyDeviceSlot";

interface DeviceListProps {
  devices: any[];
  live: any[];
  liveInitialized: boolean;
  isOnline: boolean;
  raspberryId: number;
  onRefresh: () => void;
}

export function DeviceList({
  devices,
  live,
  liveInitialized,
  isOnline,
  raspberryId,
  onRefresh,
}: DeviceListProps) {
  
  const mergedDevices = useMemo(() => {
    return mergeLiveDeviceData(devices, live, liveInitialized);
  }, [devices, live, liveInitialized]);

  const maxSlots = useMemo(() => getMaxDeviceSlots(devices), [devices]);

  return (
    <Stack spacing={2} mt={2}>
      {Array.from({ length: maxSlots }).map((_, idx) => {
        const slotIndex = idx + 1;
        const device = mergedDevices.find((d) => d.device_number === slotIndex);

        return (
          <DeviceSlotWrapper key={slotIndex}>
            <DeviceSlot
              raspberryId={raspberryId}
              device={device}
              slotIndex={slotIndex}
              liveInitialized={liveInitialized}
              isOnline={isOnline}
              onRefresh={onRefresh}
            />
          </DeviceSlotWrapper>
        );
      })}
    </Stack>
  );
}
