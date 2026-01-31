import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { microcontrollersApi } from "@/api/microcontrollerApi";
import { MicrocontrollerWithLive } from "@/features/microcontrollers/types/microcontroller";
import { MicrocontrollerCard } from "@/features/microcontrollers/components/MicrocontrollerCard";
import { DeviceList } from "@/features/devices/components/DeviceList";
import { MicrocontrollerLiveStatus } from "@/features/microcontrollers/live/MicrocontrollerLiveStatus";

export default function MicrocontrollersPage() {
  const { token } = useAuth();
  const { t } = useTranslation();

  const [items, setItems] = useState<MicrocontrollerWithLive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const res = await microcontrollersApi.getUserMicrocontrollers();

        const mapped: MicrocontrollerWithLive[] = res.data.map((mc: any) => ({
          mc,
          live: [],
          liveInitialized: false,
          isOnline: false,
          lastSeen: null,
        }));

        setItems(mapped);
      } catch {
        setError(t("microcontrollers.fetchError"));
      } finally {
        setLoading(false);
      }
    })();
  }, [token, t]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={{ xs: 1.5, md: 3 }}>
      <Typography variant="h4" mb={3}>
        {t("microcontrollers.title")}
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={3}>
        {items.map((item) => (
          <Grid
            key={item.mc.uuid}
            size={{ xs: 12, md: 6, lg: 4 }}
          >
            <MicrocontrollerLiveStatus uuid={item.mc.uuid}>
              {(live) => {
                const isOnline = live.status === "online";
                const liveInitialized = live.status !== "pending";

                return (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <MicrocontrollerCard
                      microcontroller={item.mc}
                      isOnline={isOnline}
                      lastSeen={live.lastSeen}
                      liveInitialized={liveInitialized}
                      liveState={live}
                    />

                    <Box>
                      <Stack mb={1}>
                        <Typography variant="subtitle1">
                          {t("devices.sectionTitle", {
                            name: item.mc.name,
                          })}
                        </Typography>
                      </Stack>

                      <DeviceList
                        devices={item.mc.devices}
                        liveInitialized={liveInitialized}
                        isOnline={isOnline}
                        microcontrollerUuid={item.mc.uuid}
                      />
                    </Box>
                  </Box>
                );
              }}
            </MicrocontrollerLiveStatus>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
