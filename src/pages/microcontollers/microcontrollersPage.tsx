import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Stack,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { microcontrollersApi } from "@/api/microcontrollerApi";
import { MicrocontrollerWithLive } from "@/features/microcontrollers/types/microcontroller";
import { MicrocontrollerCard } from "@/features/microcontrollers/components/MicrocontrollerCard";
import { useToast } from "@/context/ToastContext";

export default function MicrocontrollersPage() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const { notifySuccess, notifyError } = useToast();

  const [items, setItems] = useState<MicrocontrollerWithLive[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 🔔 Toast po loginie (z location.state)
   */
  useEffect(() => {
    const toast = location.state?.toast;
    if (!toast) return;

    if (toast.severity === "success") {
      notifySuccess(toast.message);
    } else {
      notifyError(toast.message);
    }

    // 🔥 bardzo ważne – czyścimy state, żeby toast nie pokazywał się ponownie
    window.history.replaceState({}, document.title);
  }, [location.state, notifySuccess, notifyError]);

  /**
   * 📡 Fetch microcontrollers
   */
  useEffect(() => {
    if (!token) return;

    const fetchMicrocontrollers = async () => {
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
      } catch (err) {
        console.error("Failed to fetch microcontrollers", err);
        setError(t("microcontrollers.fetchError"));
      } finally {
        setLoading(false);
      }
    };

    fetchMicrocontrollers();
  }, [token, t]);

  return (
    <Box
      sx={{
        p: 2,
        maxWidth: { xs: "100%", md: 1320 },
        mx: "auto",
        minHeight: "80vh",
      }}
    >
      <Typography variant="h4" mb={3}>
        {t("microcontrollers.title")}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="60vh"
        >
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={{ xs: 3, md: 4 }}>
          {items.map((item) => (
            <MicrocontrollerCard
              key={item.mc.uuid}
              microcontroller={item.mc}
              layout="split"
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}
