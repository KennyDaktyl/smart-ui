import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { LiveIndicator } from "@/features/common/components/atoms/LiveIndicator";
import { ProviderLiveWidget } from "@/features/live/widgets/ProviderLiveWidget";
import {
  ProviderTelemetryChart,
  type TelemetryChartPoint,
} from "@/features/providers/components/ProviderTelemetryChart";
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
import LoadingOverlay from "@/features/common/components/LoadingOverlay";
import type {
  ProviderTelemetryEntry,
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
  entry: ProviderTelemetryEntry | TelemetryChartPoint
): TelemetryChartPoint | null => {
  const timestamp = "measured_at" in entry ? entry.measured_at : entry.timestamp;

  const timestampMs = Date.parse(timestamp);
  if (!Number.isFinite(timestampMs)) return null;

  if ("measured_at" in entry) {
    const value = entry.measured_value == null ? 0 : entry.measured_value;
    if (!Number.isFinite(value)) return null;

    return {
      timestamp: new Date(timestampMs).toISOString(),
      value,
      isNullSample: entry.measured_value == null,
    };
  }

  if ("energy" in entry) {
    if (!Number.isFinite(entry.energy)) return null;
    return {
      timestamp: new Date(timestampMs).toISOString(),
      value: entry.energy,
    };
  }

  if (!Number.isFinite(entry.value)) return null;

  return {
    timestamp: new Date(timestampMs).toISOString(),
    value: entry.value,
    isNullSample: entry.isNullSample,
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
    Record<string, TelemetryChartPoint[]>
  >({});

  const { provider } = useProviderDetails({
    providerUuid,
    initialProvider,
  });

  const { day, measuredUnit, energyUnit, loading, error } = useProviderTelemetryDay({
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
          existingForDay[existingIndex]?.value === livePower
        ) {
          return prev;
        }

        const nextForDay = [...existingForDay];
        const nextEntry: TelemetryChartPoint = {
          timestamp: normalizedTimestamp,
          value: livePower,
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
    if (!day) return [] as TelemetryChartPoint[];

    const historicalEntries = day.entries
      .map(normalizeEntry)
      .filter((entry): entry is TelemetryChartPoint => entry != null);

    const liveEntries = (liveEntriesByDate[day.date] ?? [])
      .map(normalizeEntry)
      .filter((entry): entry is TelemetryChartPoint => entry != null);

    if (!liveEntries.length) return historicalEntries;

    const merged = new Map<string, TelemetryChartPoint>();

    historicalEntries.forEach((entry) => {
      merged.set(entry.timestamp, entry);
    });

    liveEntries.forEach((entry) => {
      merged.set(entry.timestamp, entry);
    });

    return [...merged.values()].sort(
      (left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp)
    );
  }, [day, liveEntriesByDate]);

  const nextDayDisabled = selectedDate >= today;
  const isTodaySelected = selectedDate === today;
  const liveSubscriptionEnabled = Boolean(providerUuid) && (provider?.enabled ?? true);
  const chartMeasuredUnit = measuredUnit ?? liveUnit ?? provider?.unit ?? null;

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
    <Stack spacing={2} sx={{ width: "100%", minWidth: 0 }}>
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
                            live.unit ?? chartMeasuredUnit ?? ""
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

          <LoadingOverlay
            loading={loading}
            keepChildrenMounted={Boolean(day)}
            minHeight={240}
          >
            {!day ? (
              <Typography color="text.secondary">
                {t("providers.telemetry.noData")}
              </Typography>
            ) : (
              <ProviderTelemetryChart
                day={day}
                points={dayWithLiveEntries}
                measuredUnit={chartMeasuredUnit}
                energyUnit={energyUnit}
                yMin={provider?.value_min ?? null}
                yMax={provider?.value_max ?? null}
                noDataLabel={t("providers.telemetry.noDayData")}
                noEntriesLabel={t("providers.telemetry.noEntriesData")}
              />
            )}
          </LoadingOverlay>
        </Stack>
      </TelemetryPanel>
    </Stack>
  );
}
