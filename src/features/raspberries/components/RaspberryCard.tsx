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
  const showPower = assigned?.serial_number && assigned?.id;

  const lastContactLabel =
    liveInitialized && lastSeen
      ? t("raspberries.lastContact", {
          time: new Date(lastSeen).toLocaleTimeString(locale),
        })
      : t("raspberries.lastContactWaiting");

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: "1px solid rgba(15,139,111,0.18)",
        background: "linear-gradient(135deg, #ffffff 0%, #f6fbf8 100%)",
        boxShadow: "0 16px 32px rgba(0,0,0,0.16)",
        color: "#0d1b2a",
        minHeight: 340,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <RaspberryHeader
        name={rpi.name}
        isOnline={isOnline}
        liveInitialized={liveInitialized}
      />

      <Typography variant="caption" sx={{ color: "#6b7280" }}>
        {lastContactLabel}
      </Typography>

      <RaspberryInfo
        version={rpi.software_version}
        maxDevices={rpi.max_devices}
      />

      <Box sx={{ mt: 1, minHeight: 118, display: "flex", alignItems: "stretch" }}>
        {showPower ? (
          <Box sx={{ flex: 1 }}>
            <InverterPower inverterId={assigned!.id} serial={assigned!.serial_number} />
          </Box>
        ) : (
          <Alert severity="info" sx={{ flex: 1, alignItems: "center" }}>
            {t("raspberries.noPowerData")}
          </Alert>
        )}
      </Box>

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
