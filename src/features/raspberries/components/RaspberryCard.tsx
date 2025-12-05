import { Box, Snackbar, Alert, Typography } from "@mui/material";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { raspberryApi } from "@/api/raspberryApi";
import { useTranslation } from "react-i18next";

import { RaspberryHeader } from "./atoms/RaspberryHeader";
import { RaspberryInfo } from "./atoms/RaspberryInfo";
import { InverterPower } from "@/features/inverters/components/InverterPower";
import { RaspberryInverterSelect } from "./atoms/RaspberryInverterSelect";

interface RaspberryCardProps {
  rpi: any;
  isOnline: boolean;
  lastSeen?: string | null;
  liveInitialized: boolean;
  availableInverters: any[];
}

export function RaspberryCard({
  rpi,
  isOnline,
  lastSeen,
  liveInitialized,
  availableInverters,
}: RaspberryCardProps) {
  const { token } = useAuth();
  const { t, i18n } = useTranslation();

  const [selected, setSelected] = useState<number | "">(rpi.inverter_id || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const assigned = availableInverters.find((i) => i.id === rpi.inverter_id);

  const handleAssign = async (invId: number) => {
    if (!token) return;

    try {
      setLoading(true);

      await raspberryApi.updateRaspberry(token, rpi.uuid, {
        inverter_id: invId,
      });

      setSelected(invId);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  const locale = i18n.language === "pl" ? "pl-PL" : "en-US";

  return (
    <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #ddd" }}>
      <RaspberryHeader
        name={rpi.name}
        isOnline={isOnline}
        liveInitialized={liveInitialized}
      />

      {liveInitialized && lastSeen && (
        <Typography variant="caption" color="text.secondary">
          {t("raspberries.lastContact", {
            time: new Date(lastSeen).toLocaleTimeString(locale),
          })}
        </Typography>
      )}

      <RaspberryInfo
        version={rpi.software_version}
        maxDevices={rpi.max_devices}
      />

      {assigned?.serial_number && assigned?.id && (
        <InverterPower inverterId={assigned.id} serial={assigned.serial_number} />
      )}

      <RaspberryInverterSelect
        value={selected}
        inverters={availableInverters}
        loading={loading}
        onChange={handleAssign}
      />

      <Snackbar
        open={success}
        autoHideDuration={2500}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          {t("raspberries.assigned")}
        </Alert>
      </Snackbar>
    </Box>
  );
}
