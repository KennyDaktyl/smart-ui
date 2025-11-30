import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import { DeviceSlot } from "./DeviceSlot";

interface DeviceListProps {
  devices: any[];          // dane statyczne z API
  live: any[];             // live z heartbeata
  liveInitialized: boolean;
  raspberryId: number;
}

export function DeviceList({
  devices,
  live,
  liveInitialized,
  raspberryId,
}: DeviceListProps) {

  /* ------------------------------------------------------------
   * 1️⃣ Spinner do momentu pierwszego heartbeat
   * ------------------------------------------------------------ */
  if (!liveInitialized) {
    return (
      <Box mt={2} textAlign="center">
        <CircularProgress size={22} />
        <Typography variant="caption" color="text.secondary">
          Oczekiwanie na dane online urządzeń...
        </Typography>
      </Box>
    );
  }

  /* ------------------------------------------------------------
   * 2️⃣ Merging danych statycznych i live
   * ------------------------------------------------------------ */
  const mergedDevices = devices.map((dev) => {
    const liveData = live.find((l) => Number(l.device_id) === dev.id);

    return {
      ...dev,
      online: !!liveData,
      is_on: liveData?.is_on ?? false,
      live_pin: liveData?.pin ?? null,
    };
  });

  const maxSlots = devices.length > 0 
    ? Math.max(...devices.map((d) => d.device_number)) 
    : 1;

  /* ------------------------------------------------------------
   * 3️⃣ RENDER
   * ------------------------------------------------------------ */
  return (
    <Stack spacing={2} mt={2}>
      {Array.from({ length: maxSlots }).map((_, index) => {
        const slotNumber = index + 1;
        const device = mergedDevices.find((d) => d.device_number === slotNumber);

        return (
          <DeviceSlot
            key={slotNumber}
            raspberryId={raspberryId}
            device={device}
            slotIndex={slotNumber}
            online={device?.online ?? false}
            isOn={device?.is_on ?? false}
            liveInitialized={liveInitialized}
          />
        );
      })}
    </Stack>
  );
}
