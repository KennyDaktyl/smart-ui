import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { providersApi } from "@/api/providersApi";
import { DateRangeFields } from "@/features/common/components/DateRangeFields";
import { ProviderTelemetryChart } from "@/features/providers/components/ProviderTelemetryChart";
import { ProviderResponse } from "@/features/providers/types/userProvider";
import {
  DayEnergy,
  ProviderEnergySeries,
} from "@/features/providers/types/providerEnergy";

type ProviderLocationState = {
  provider?: ProviderResponse;
};

export default function ProviderTelemetryPage() {
  const navigate = useNavigate();
  const { providerUuid } = useParams<{ providerUuid: string }>();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const locale = i18n.language === "pl" ? "pl-PL" : "en-US";

  const locationState = (location.state as ProviderLocationState | undefined) || {};
  const [provider, setProvider] = useState<ProviderResponse | null>(
    locationState.provider ?? null
  );
  const [loadingProvider, setLoadingProvider] = useState(!locationState.provider);

  const [energyByDay, setEnergyByDay] = useState<Record<string, DayEnergy>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ===================== DATE RANGE ===================== */

  const formatLocalDateTime = (date: Date) => {
    const pad = (v: number) => String(v).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const today = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return {
      start: formatLocalDateTime(start),
      end: formatLocalDateTime(now),
    };
  }, []);

  const [range, setRange] = useState(today);

  /* ===================== LOAD PROVIDER ===================== */

  useEffect(() => {
    if (!providerUuid || provider) return;

    const fetchProvider = async () => {
      setLoadingProvider(true);
      try {
        const res = await providersApi.getProviderByUuid(providerUuid);
        setProvider(res.data);
      } catch {
        setProvider(null);
      } finally {
        setLoadingProvider(false);
      }
    };

    fetchProvider();
  }, [providerUuid, provider]);

  /* ===================== LOAD ENERGY ===================== */

  useEffect(() => {
    if (!providerUuid) return;

    const fetchEnergy = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await providersApi.getProviderEnergy(providerUuid, {
          date_start: new Date(range.start).toISOString(),
          date_end: new Date(range.end).toISOString(),
        });

        setEnergyByDay(res.data.days ?? {});
      } catch {
        setError(t("providers.telemetry.error"));
        setEnergyByDay({});
      } finally {
        setLoading(false);
      }
    };

    fetchEnergy();
  }, [providerUuid, range.start, range.end, t]);

  /* ===================== DAYS ===================== */

  const days = useMemo(() => {
    return Object.values(energyByDay).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }, [energyByDay]);

  const [activeDayIndex, setActiveDayIndex] = useState(0);

  useEffect(() => {
    const firstWithData = days.findIndex((d) => d.hours.length > 0);
    setActiveDayIndex(firstWithData >= 0 ? firstWithData : 0);
  }, [days]);

  const activeDay = days[activeDayIndex];

  /* ===================== RENDER ===================== */

  return (
    <Box p={{ xs: 1.5, sm: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, textTransform: "none" }}
      >
        {t("common.backToList")}
      </Button>

      <Box
        sx={{
          borderRadius: 3,
          background: "linear-gradient(145deg, #0b1828 0%, #0f8b6f 120%)",
          color: "#e2f2ec",
          boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="overline" sx={{ opacity: 0.8 }}>
            {t("providers.telemetry.title")}
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            {provider?.name || providerUuid}
          </Typography>
        </Box>

        <Box sx={{ background: "#f6fbf8", p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <DateRangeFields
              startLabel={t("providers.telemetry.rangeStart")}
              endLabel={t("providers.telemetry.rangeEnd")}
              startValue={range.start}
              endValue={range.end}
              onChangeStart={(v) => setRange((r) => ({ ...r, start: v }))}
              onChangeEnd={(v) => setRange((r) => ({ ...r, end: v }))}
            />

            {error && <Alert severity="error">{error}</Alert>}

            {loading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ height: 240 }}>
                <CircularProgress />
              </Stack>
            ) : !activeDay ? (
              <Typography color="text.secondary">
                {t("providers.telemetry.noData")}
              </Typography>
            ) : (
              <>
                <Stack direction="row" spacing={2} justifyContent="space-between">
                  <Button
                    startIcon={<ChevronLeftIcon />}
                    disabled={activeDayIndex === 0}
                    onClick={() => setActiveDayIndex((i) => i - 1)}
                  >
                    {t("common.back")}
                  </Button>
                  <Button
                    endIcon={<ChevronRightIcon />}
                    disabled={activeDayIndex >= days.length - 1}
                    onClick={() => setActiveDayIndex((i) => i + 1)}
                  >
                    {t("common.next")}
                  </Button>
                </Stack>

                <ProviderTelemetryChart
                  day={activeDay}
                  unit="Wh"
                  noDataLabel={t("providers.telemetry.noDayData")}
                />
              </>
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
