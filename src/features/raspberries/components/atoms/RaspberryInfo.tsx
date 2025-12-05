import MemoryIcon from "@mui/icons-material/Memory";
import DeviceHubIcon from "@mui/icons-material/DeviceHub";
import { Stack } from "@mui/material";
import { InfoRow } from "@/components/atoms/InfoRow";

interface RaspberryInfoProps {
  version: string | null;
  maxDevices: number;
}

export function RaspberryInfo({ version, maxDevices }: RaspberryInfoProps) {
  return (
    <Stack direction="row" spacing={3} mt={2} alignItems="center">
      <InfoRow
        icon={<MemoryIcon sx={{ color: "primary.main" }} />}
        label={`Soft: ${version || "n/d"}`}
      />

      <InfoRow
        icon={<DeviceHubIcon sx={{ color: "primary.main" }} />}
        label={`Max urządzeń: ${maxDevices}`}
      />
    </Stack>
  );
}
