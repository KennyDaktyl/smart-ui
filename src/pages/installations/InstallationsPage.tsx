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

export default function InstallationsPage() {
  const { token, user, loading } = useAuth();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // 📦 Pobierz instalacje użytkownika (na start)
  const fetchInstallations = async () => {
    if (!token) return [];
    try {
      const res = await userApi.getUserInstallations(token);
      const data = res.data.installations || [];
      setInstallations(data);
      setError("");
      return data;
    } catch (err) {
      console.error(err);
      setError("Nie udało się pobrać instalacji użytkownika.");
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
        Moje instalacje
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {lastUpdate && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          🔁 Ostatnia aktualizacja: {lastUpdate.toLocaleTimeString()}
        </Typography>
      )}

      {installations.length > 0 ? (
        installations.map((inst) => (
          <Card key={inst.id} sx={{ mb: 3, p: 1 }}>
            <CardContent>
              <Typography variant="h6">{inst.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                📍 {inst.station_addr || "Brak adresu"}
              </Typography>

              <Box mt={2}>
                <Typography variant="subtitle1" mb={1}>
                  Inwertery:
                </Typography>

                {inst.inverters?.length ? (
                  inst.inverters.map((inv: Inverter) => (
                    <InverterCard key={inv.id} inverter={inv} />
                  ))
                ) : (
                  <Typography color="text.secondary" sx={{ ml: 2 }}>
                    Brak inwerterów przypisanych do tej instalacji.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        ))
      ) : (
        <Typography variant="body1" color="text.secondary">
          Brak instalacji do wyświetlenia.
        </Typography>
      )}
    </Box>
  );
}
