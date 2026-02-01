import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { providersApi } from "@/api/providersApi";
import { DateRangeFields } from "@/features/common/components/DateRangeFields";
import { ProviderTelemetryChart } from "@/features/providers/components/ProviderTelemetryChart";
import {
  ProviderMeasurement,
  ProviderResponse,
} from "@/features/providers/types/userProvider";

type ProviderLocationState = {
  provider?: ProviderResponse;
};

type DayEntry = {
  key: string;
  label: string;
  measurements: ProviderMeasurement[];
};

export default function ProviderTelemetryPage() {
  const navigate = useNavigate();
  const { providerUuid } = useParams<{ providerUuid: string }>();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const locationState = (location.state as ProviderLocationState | undefined) || {};
  const [provider, setProvider] = useState<ProviderResponse | null>(
    locationState.provider ?? null
  );
  const [loadingProvider, setLoadingProvider] = useState(!locationState.provider);

  const [measurementsByDay, setMeasurementsByDay] = useState<Record<string, ProviderMeasurement[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locale = i18n.language === "pl" ? "pl-PL" : "en-US";

  const formatLocalDateTime = (date: Date) => {
    const pad = (value: number) => String(value).padStart(2, "0");
    return [
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    ].join("T");
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

  const [range, setRange] = useState<{ start: string; end: string }>({
    start: today.start,
    end: today.end,
  });

  useEffect(() => {
    if (!providerUuid || provider) return;

    const fetchProvider = async () => {
      setLoadingProvider(true);
      try {
        try {
          const res = await providersApi.getProviderByUuid(providerUuid);
          setProvider(res.data);
          return;
        } catch {
          const res = await providersApi.getProviders();
          const found = res.data.find((item) => item.uuid === providerUuid);
          if (found) setProvider(found);
        }
      } catch (err) {
        console.error("Failed to load provider", err);
      } finally {
        setLoadingProvider(false);
      }
    };

    fetchProvider();
  }, [providerUuid, provider]);

  useEffect(() => {
    if (!providerUuid || !range.start || !range.end) return;

    const fetchMeasurements = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await providersApi.getProviderMeasurements(providerUuid, {
          date_start: new Date(range.start).toISOString(),
          date_end: new Date(range.end).toISOString(),
        });
        setMeasurementsByDay(res.data.days ?? {});
      } catch {
        setError(t("providers.telemetry.error"));
        setMeasurementsByDay({});
      } finally {
        setLoading(false);
      }
    };

    fetchMeasurements();
  }, [providerUuid, range.start, range.end, t]);

  const dayEntries = useMemo<DayEntry[]>(() => {
    const keys = buildDayKeys(range.start, range.end);
    return keys.map((key) => ({
      key,
      label: new Date(`${key}T00:00:00`).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      measurements: measurementsByDay[key] ?? [],
    }));
  }, [measurementsByDay, range.end, range.start, locale]);

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  useEffect(() => {
    const firstWithData = dayEntries.findIndex((entry) => entry.measurements.length > 0);
    setActiveDayIndex(firstWithData >= 0 ? firstWithData : 0);
  }, [dayEntries]);

  const safeIndex = Math.min(activeDayIndex, Math.max(dayEntries.length - 1, 0));
  const activeDay = dayEntries[safeIndex];
  const hasAnyData = dayEntries.some((entry) => entry.measurements.length > 0);

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
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            spacing={2}
          >
            <Box>
              <Typography variant="overline" sx={{ color: "rgba(226,242,236,0.75)" }}>
                {t("providers.telemetry.title")}
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {provider?.name || providerUuid}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(226,242,236,0.8)" }}>
                {provider ? `${provider.vendor} • ${provider.provider_type}` : t("common.details")}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            background: "#f6fbf8",
            p: { xs: 2, md: 3 },
            borderTop: "1px solid rgba(226,242,236,0.25)",
          }}
        >
          <Stack spacing={2}>
            <DateRangeFields
              startLabel={t("providers.telemetry.rangeStart")}
              endLabel={t("providers.telemetry.rangeEnd")}
              startValue={range.start}
              endValue={range.end}
              onChangeStart={(value) => setRange((prev) => ({ ...prev, start: value }))}
              onChangeEnd={(value) => setRange((prev) => ({ ...prev, end: value }))}
            />

            {loadingProvider && (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Typography variant="body2">{t("providers.telemetry.loading")}</Typography>
              </Stack>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            {loading ? (
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ height: 240 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">{t("providers.telemetry.loading")}</Typography>
              </Stack>
            ) : dayEntries.length === 0 || !hasAnyData ? (
              <Box sx={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  {t("providers.telemetry.noData")}
                </Typography>
              </Box>
            ) : (
              <>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<ChevronLeftIcon />}
                    onClick={() => setActiveDayIndex((idx) => Math.max(idx - 1, 0))}
                    disabled={safeIndex === 0}
                    sx={{ textTransform: "none" }}
                  >
                    {t("common.back")}
                  </Button>
                  <Box sx={{ flex: 1 }} />
                  <Button
                    variant="outlined"
                    size="small"
                    endIcon={<ChevronRightIcon />}
                    onClick={() =>
                      setActiveDayIndex((idx) => Math.min(idx + 1, dayEntries.length - 1))
                    }
                    disabled={safeIndex >= dayEntries.length - 1}
                    sx={{ textTransform: "none" }}
                  >
                    {t("common.next")}
                  </Button>
                </Stack>

                {activeDay && (
                  <ProviderTelemetryChart
                    dayKey={activeDay.key}
                    dayLabel={activeDay.label}
                    measurements={activeDay.measurements}
                    unit={provider?.unit ?? null}
                    noDataLabel={t("providers.telemetry.noDayData")}
                  />
                )}
              </>
            )}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

function buildDayKeys(start: string, end: string): string[] {
  if (!start || !end) return [];
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return [];

  const dayStart = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  const keys: string[] = [];
  let cursor = dayStart(startDate);
  const endDay = dayStart(endDate);

  while (cursor <= endDay) {
    const yyyy = cursor.getFullYear();
    const mm = String(cursor.getMonth() + 1).padStart(2, "0");
    const dd = String(cursor.getDate()).padStart(2, "0");
    keys.push(`${yyyy}-${mm}-${dd}`);
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  return keys;
}
