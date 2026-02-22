import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { LiveIndicator } from "@/features/common/components/atoms/LiveIndicator";
import { ProviderLiveWidget } from "@/features/live/widgets/ProviderLiveWidget";
import { ProviderTelemetryChart } from "@/features/providers/components/ProviderTelemetryChart";
import type { ProviderLiveSnapshot } from "@/features/providers/hooks/useProviderLive";
import { TelemetryDateNavigator } from "@/features/providers/telemetry/components/TelemetryDateNavigator";
import { TelemetryPanel } from "@/features/providers/telemetry/components/TelemetryPanel";
import { useProviderDetails } from "@/features/providers/telemetry/hooks/useProviderDetails";
import { useProviderTelemetryDay } from "@/features/providers/telemetry/hooks/useProviderTelemetryDay";
import {
  addDays,
  formatDateForInput,
  isFutureDate,
} from "@/features/providers/telemetry/utils/date";
import type {
  EnergyEntryPoint,
  ProviderResponse,
} from "@/features/providers/types/userProvider";

/* ============================================================
 * Types
 * ============================================================ */

type ProviderLocationState = {
  provider?: ProviderResponse;
};

const MAX_LIVE_ENTRIES_PER_DAY = 1440;

const normalizeEntry = (
  entry: EnergyEntryPoint
): EnergyEntryPoint | null => {
  const timestampMs = Date.parse(entry.timestamp);
  if (!Number.isFinite(timestampMs)) return null;
  if (!Number.isFinite(entry.energy)) return null;

  return {
    timestamp: new Date(timestampMs).toISOString(),
    energy: entry.energy,
  };
};

/* ============================================================
 * Page
 * ============================================================ */

export default function ProviderTelemetryPage() {
  const navigate = useNavigate();
  const { providerUuid } = useParams<{ providerUuid: string }>();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "pl" ? "pl-PL" : "en-US";

  const locationState =
    (location.state as ProviderLocationState | undefined) || {};
  const initialProvider =
    locationState.provider?.uuid === providerUuid
      ? locationState.provider
      : null;

  const today = useMemo(() => formatDateForInput(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [liveUnit, setLiveUnit] = useState<string | null>(null);
  const [liveEntriesByDate, setLiveEntriesByDate] = useState<
    Record<string, EnergyEntryPoint[]>
  >({});

  const { provider } = useProviderDetails({
    providerUuid,
    initialProvider,
  });

  const { day, unit, loading, error } = useProviderTelemetryDay({
    providerUuid,
    date: selectedDate,
    loadErrorMessage: t("providers.telemetry.error"),
  });

  const providerName =
    provider?.name ?? providerUuid ?? t("common.notAvailable");

  useEffect(() => {
    setLiveEntriesByDate({});
    setLiveUnit(null);
  }, [providerUuid]);

  const handleProviderLiveChange = useCallback(
    (live: ProviderLiveSnapshot) => {
      if (!providerUuid || !live.hasWs) return;
      if (!live.measuredAt) return;
      if (live.power == null || Number.isNaN(live.power)) return;
      const livePower = live.power;

      const measuredAtMs = Date.parse(live.measuredAt);
      if (!Number.isFinite(measuredAtMs)) return;

      if (live.unit) {
        setLiveUnit((prev) => (prev === live.unit ? prev : live.unit));
      }

      const normalizedTimestamp = new Date(measuredAtMs).toISOString();
      const dayKey = formatDateForInput(new Date(measuredAtMs));

      setLiveEntriesByDate((prev) => {
        const existingForDay = prev[dayKey] ?? [];
        const existingIndex = existingForDay.findIndex(
          (entry) => entry.timestamp === normalizedTimestamp
        );

        if (
          existingIndex >= 0 &&
          existingForDay[existingIndex]?.energy === livePower
        ) {
          return prev;
        }

        const nextForDay = [...existingForDay];
        const nextEntry: EnergyEntryPoint = {
          timestamp: normalizedTimestamp,
          energy: livePower,
        };

        if (existingIndex >= 0) {
          nextForDay[existingIndex] = nextEntry;
        } else {
          nextForDay.push(nextEntry);
        }

        nextForDay.sort(
          (left, right) =>
            Date.parse(left.timestamp) - Date.parse(right.timestamp)
        );

        const cappedEntries =
          nextForDay.length > MAX_LIVE_ENTRIES_PER_DAY
            ? nextForDay.slice(nextForDay.length - MAX_LIVE_ENTRIES_PER_DAY)
            : nextForDay;

        return {
          ...prev,
          [dayKey]: cappedEntries,
        };
      });
    },
    [providerUuid]
  );

  const selectedDayLiveEntries = useMemo(
    () => liveEntriesByDate[selectedDate] ?? [],
    [liveEntriesByDate, selectedDate]
  );

  const dayWithLiveEntries = useMemo(() => {
    if (!day) return null;

    const historicalEntries = (day.entries ?? [])
      .map(normalizeEntry)
      .filter((entry): entry is EnergyEntryPoint => entry != null);

    const liveEntries = (liveEntriesByDate[day.date] ?? [])
      .map(normalizeEntry)
      .filter((entry): entry is EnergyEntryPoint => entry != null);

    if (!liveEntries.length) return day;

    const merged = new Map<string, EnergyEntryPoint>();

    historicalEntries.forEach((entry) => {
      merged.set(entry.timestamp, entry);
    });

    liveEntries.forEach((entry) => {
      merged.set(entry.timestamp, entry);
    });

    return {
      ...day,
      entries: [...merged.values()].sort(
        (left, right) =>
          Date.parse(left.timestamp) - Date.parse(right.timestamp)
      ),
    };
  }, [day, liveEntriesByDate]);

  const nextDayDisabled = selectedDate >= today;
  const isTodaySelected = selectedDate === today;
  const liveSubscriptionEnabled = Boolean(providerUuid) && (provider?.enabled ?? true);
  const chartUnit = unit ?? liveUnit ?? provider?.unit ?? null;

  const handleDateChange = (nextDate: string) => {
    if (!nextDate) return;
    setSelectedDate(isFutureDate(nextDate, today) ? today : nextDate);
  };

  const goPreviousDay = () => {
    setSelectedDate((prev) => addDays(prev, -1));
  };

  const goNextDay = () => {
    setSelectedDate((prev) => {
      const next = addDays(prev, 1);
      return isFutureDate(next, today) ? prev : next;
    });
  };

  return (
    <Box p={{ xs: 1.5, sm: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, textTransform: "none" }}
      >
        {t("common.backToList")}
      </Button>

      <TelemetryPanel
        title={t("providers.telemetry.title")}
        providerName={providerName}
      >
        <Stack spacing={2}>
          <TelemetryDateNavigator
            dateLabel={t("providers.telemetry.dayLabel")}
            previousDayLabel={t("providers.telemetry.previousDay")}
            nextDayLabel={t("providers.telemetry.nextDay")}
            selectedDate={selectedDate}
            maxDate={today}
            nextDisabled={nextDayDisabled}
            onDateChange={handleDateChange}
            onPreviousDay={goPreviousDay}
            onNextDay={goNextDay}
          />

          <Stack spacing={0.75}>
            <ProviderLiveWidget
              uuid={providerUuid}
              enabled={liveSubscriptionEnabled}
              expectedIntervalSec={provider?.default_expected_interval_sec}
              initialMeasuredAt={provider?.last_value?.measured_at ?? null}
              initialPower={provider?.last_value?.measured_value ?? null}
              initialUnit={provider?.last_value?.measured_unit ?? provider?.unit ?? null}
              onChange={handleProviderLiveChange}
            >
              {(live) => (
                <Box
                  sx={{
                    width: "fit-content",
                    borderRadius: 999,
                    border: "1px solid rgba(15,139,111,0.24)",
                    bgcolor: "rgba(15,139,111,0.08)",
                    px: 1.5,
                    py: 0.75,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                  >
                    <LiveIndicator active={live.status === "online"} />
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="text.primary"
                    >
                      {t("providers.telemetry.liveStreaming")}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={800}
                      color="text.primary"
                    >
                      {live.power == null || Number.isNaN(live.power)
                        ? "--"
                        : `${live.power.toFixed(3)} ${
                            live.unit ?? chartUnit ?? ""
                          }`.trim()}
                    </Typography>
                    {live.measuredAt && (
                      <Typography variant="caption" color="text.secondary">
                        {new Date(live.measuredAt).toLocaleTimeString(locale)}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              )}
            </ProviderLiveWidget>

            {isTodaySelected ? (
              <Typography variant="caption" color="text.secondary">
                {t("providers.telemetry.liveMergedEntries", {
                  count: selectedDayLiveEntries.length,
                })}
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                {t("providers.telemetry.liveTodayHint")}
              </Typography>
            )}
          </Stack>

          {error && <Alert severity="error">{error}</Alert>}

          {loading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{ height: 240 }}
            >
              <CircularProgress />
            </Stack>
          ) : !day ? (
            <Typography color="text.secondary">
              {t("providers.telemetry.noData")}
            </Typography>
          ) : (
            <ProviderTelemetryChart
              day={dayWithLiveEntries ?? day}
              unit={chartUnit}
              noDataLabel={t("providers.telemetry.noDayData")}
              noEntriesLabel={t("providers.telemetry.noEntriesData")}
            />
          )}
        </Stack>
      </TelemetryPanel>
    </Box>
  );
}
