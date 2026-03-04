import {
  Alert,
  Box,
  CircularProgress,

  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import { microcontrollersApi } from "@/api/microcontrollerApi";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { MicrocontrollerCard } from "@/features/microcontrollers/components/MicrocontrollerCard";
import { MicrocontrollerWithLive } from "@/features/microcontrollers/types/microcontroller";

export default function MicrocontrollersPage() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const { notifySuccess, notifyError } = useToast();

  const [items, setItems] = useState<MicrocontrollerWithLive[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const toast = location.state?.toast;
    if (!toast) return;

    if (toast.severity === "success") {
      notifySuccess(toast.message);
    } else {
      notifyError(toast.message);
    }

    window.history.replaceState({}, document.title);
  }, [location.state, notifySuccess, notifyError]);

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
