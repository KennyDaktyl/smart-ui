import { Stack } from "@mui/material";
import { DeviceSlot } from "./DeviceSlot";

interface DeviceListProps {
  devices: any[];          // dane statyczne z API
  live: any[];             // live z heartbeata
  liveInitialized: boolean;
  raspberryId: number;
  onRefresh: () => void;
}

export function DeviceList({
  devices,
  live,
  liveInitialized,
  raspberryId,
  onRefresh
}: DeviceListProps) {

   console.log("📦 DEVICES (from API):", devices);
  console.log("⚡ LIVE DEVICES (from heartbeat):", live);
  console.log("📡 liveInitialized:", liveInitialized);

  /* ------------------------------------------------------------
   * MERGE: dane API + live heartbeat
   * ------------------------------------------------------------ */
  const mergedDevices = devices.map((dev) => {
    const liveData =
  live.find(l => Number(l.device_id) === Number(dev.id)) ||
  null;

    return {
      ...dev,
      online: liveInitialized ? !!liveData : false,
      is_on: liveInitialized ? (liveData?.is_on ?? false) : false,
      waitingForState: !liveInitialized,  // ⭐ nowy sygnał
    };
  });

  /* ------------------------------------------------------------
   * Liczba slotów = max device_number
   * ------------------------------------------------------------ */
  const maxSlots =
    devices.length > 0
      ? Math.max(...devices.map((d) => d.device_number))
      : 1;

  /* ------------------------------------------------------------
   * RENDER SLOTÓW
   * ------------------------------------------------------------ */

  return (
    <Stack spacing={2} mt={2}>
      {Array.from({ length: maxSlots }).map((_, idx) => {
        const slotNumber = idx + 1;

        const dev = mergedDevices.find(
          (d) => d.device_number === slotNumber
        );

        return (
          <DeviceSlot
            key={slotNumber}
            raspberryId={raspberryId}
            device={dev}
            slotIndex={slotNumber}
            online={dev?.online ?? false}
            isOn={dev?.is_on ?? false}
            liveInitialized={liveInitialized}
            onRefresh={onRefresh}              // ⭐ NAJWAŻNIEJSZE
          />
        );
      })}
    </Stack>
  );
}
