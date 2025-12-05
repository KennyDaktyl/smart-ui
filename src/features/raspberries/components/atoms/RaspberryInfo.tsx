import MemoryIcon from "@mui/icons-material/Memory";
import DeviceHubIcon from "@mui/icons-material/DeviceHub";
import { Stack } from "@mui/material";
import { InfoRow } from "@/components/atoms/InfoRow";
import { useTranslation } from "react-i18next";

interface RaspberryInfoProps {
  version: string | null;
  maxDevices: number;
}

export function RaspberryInfo({ version, maxDevices }: RaspberryInfoProps) {
  const { t } = useTranslation();

  return (
    <Stack direction="row" spacing={3} mt={2} alignItems="center">
      <InfoRow
        icon={<MemoryIcon sx={{ color: "primary.main" }} />}
        label={t("raspberries.info.software", {
          version: version || t("common.notAvailable"),
        })}
      />

      <InfoRow
        icon={<DeviceHubIcon sx={{ color: "primary.main" }} />}
        label={t("raspberries.info.maxDevices", { count: maxDevices })}
      />
    </Stack>
  );
}
