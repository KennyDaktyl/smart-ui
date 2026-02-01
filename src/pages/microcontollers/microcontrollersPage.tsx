import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { microcontrollersApi } from "@/api/microcontrollerApi";
import { MicrocontrollerWithLive } from "@/features/microcontrollers/types/microcontroller";
import { MicrocontrollerCard } from "@/features/microcontrollers/components/MicrocontrollerCard";

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

      <Stack spacing={3}>
        {items.map((item) => (
          <MicrocontrollerCard key={item.mc.uuid} microcontroller={item.mc} layout="split" />
        ))}
      </Stack>
    </Box>
  );
}
