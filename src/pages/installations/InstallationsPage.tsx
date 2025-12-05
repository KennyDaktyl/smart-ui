import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import { userApi } from "@/api/userApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Installation, Inverter } from "@/features/installations/hooks/installation";
import { InverterCard } from "@/features/inverters/components/InverterCard";
import { useTranslation } from "react-i18next";

export default function InstallationsPage() {
  const { token, loading } = useAuth();
  const { t, i18n } = useTranslation();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const locale = i18n.language === "pl" ? "pl-PL" : "en-US";

  // 📦 Pobierz instalacje użytkownika (na start)
  const fetchInstallations = async () => {
    if (!token) return [];
    try {
      const res = await userApi.getUserInstallations(token);
      const data = res.data.installations || [];
      setInstallations(data);
      setError("");
      setLastUpdate(new Date());
      return data;
    } catch (err) {
      console.error(err);
      setError(t("installations.fetchError"));
      return [];
    } finally {
      setFetching(false);
    }
  };

  // 🧠 Pierwsze pobranie danych + podczyt mocy z backendu
  useEffect(() => {
    if (!token) return;

    const init = async () => {
      const data = await fetchInstallations();
    };

    init();
  }, [token]);

  if (loading || fetching) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        {t("installations.title")}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {lastUpdate && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          🔁 {t("installations.lastUpdate", {
            time: lastUpdate.toLocaleTimeString(locale),
          })}
        </Typography>
      )}

      {installations.length > 0 ? (
        installations.map((inst) => (
          <Card key={inst.id} sx={{ mb: 3, p: 1 }}>
            <CardContent>
              <Typography variant="h6">{inst.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                📍 {inst.station_addr || t("installations.noAddress")}
              </Typography>

              <Box mt={2}>
                <Typography variant="subtitle1" mb={1}>
                  {t("installations.inverters")}
                </Typography>

                {inst.inverters?.length ? (
                  inst.inverters.map((inv: Inverter) => (
                    <InverterCard key={inv.id} inverter={inv} />
                  ))
                ) : (
                  <Typography color="text.secondary" sx={{ ml: 2 }}>
                    {t("installations.noInverters")}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography variant="body1" color="text.secondary">
          {t("installations.noInstallations")}
        </Typography>
      )}
    </Box>
  );
}
