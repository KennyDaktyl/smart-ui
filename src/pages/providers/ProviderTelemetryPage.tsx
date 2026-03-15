import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import ElectricMeterIcon from "@mui/icons-material/ElectricMeter";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
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

import IconLabel from "@/components/atoms/IconLabel";
import { LiveIndicator } from "@/features/common/components/atoms/LiveIndicator";
import { ProviderLiveWidget } from "@/features/live/widgets/ProviderLiveWidget";
import { ProviderMetricChart } from "@/features/providers/components/ProviderMetricChart";
import {
  ProviderTelemetryChart,
  type TelemetryChartPoint,
} from "@/features/providers/components/ProviderTelemetryChart";
import type { ProviderLiveSnapshot } from "@/features/providers/hooks/useProviderLive";
import { TelemetryDateNavigator } from "@/features/providers/telemetry/components/TelemetryDateNavigator";
import { TelemetryPanel } from "@/features/providers/telemetry/components/TelemetryPanel";
import { useProviderTelemetry } from "@/features/providers/telemetry/hooks/useProviderTelemetry";
import {
  addDays,
  formatDateForInput,
  isFutureDate,
} from "@/features/providers/telemetry/utils/date";
import {
  BATTERY_SOC_METRIC_KEY,
  GRID_POWER_METRIC_KEY,
  getPrimaryProviderMetricLabel,
} from "@/features/providers/utils/providerLiveMetrics";
import LoadingOverlay from "@/features/common/components/LoadingOverlay";
import type {
  ProviderMetricSeries,
  ProviderMatchedRevenue,
  ProviderTelemetryEntry,
  ProviderMarketPrice,
  ProviderResponse,
} from "@/features/providers/types/userProvider";

/* ============================================================
 * Types
 * ============================================================ */

type ProviderLocationState = {
  provider?: ProviderResponse;
};

const MAX_LIVE_ENTRIES_PER_DAY = 1440;
type LiveMetricEntriesByDate = Record<
  string,
  Record<string, TelemetryChartPoint[]>
>;

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

const upsertTelemetryEntry = (
  existingEntries: TelemetryChartPoint[],
  nextEntry: TelemetryChartPoint
) => {
  const existingIndex = existingEntries.findIndex(
    (entry) => entry.timestamp === nextEntry.timestamp
  );

  if (
    existingIndex >= 0 &&
    existingEntries[existingIndex]?.value === nextEntry.value &&
    existingEntries[existingIndex]?.isNullSample === nextEntry.isNullSample
  ) {
    return existingEntries;
  }

  const nextEntries = [...existingEntries];

  if (existingIndex >= 0) {
    nextEntries[existingIndex] = nextEntry;
  } else {
    nextEntries.push(nextEntry);
  }

  nextEntries.sort(
    (left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp)
  );

  return nextEntries.length > MAX_LIVE_ENTRIES_PER_DAY
    ? nextEntries.slice(nextEntries.length - MAX_LIVE_ENTRIES_PER_DAY)
    : nextEntries;
};

const mergeSeriesWithLiveEntries = (
  series: ProviderMetricSeries | null,
  liveEntries: TelemetryChartPoint[],
  liveUnit?: string | null
): ProviderMetricSeries | null => {
  if (!series || series.aggregation_mode === "hourly_integral" || liveEntries.length === 0) {
    return series;
  }

  const mergedEntries = new Map<string, TelemetryChartPoint>();

  series.entries
    .map(normalizeEntry)
    .filter((entry): entry is TelemetryChartPoint => entry != null)
    .forEach((entry) => {
      mergedEntries.set(entry.timestamp, entry);
    });

  liveEntries.forEach((entry) => {
    mergedEntries.set(entry.timestamp, entry);
  });

  return {
    ...series,
    unit: series.unit ?? liveUnit ?? null,
    entries: [...mergedEntries.values()].sort(
      (left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp)
    ),
  };
};

const convertMarketPriceToKwh = (price: number, unit: string) => {
  const normalizedUnit = unit.trim().toLowerCase();
  if (normalizedUnit === "mwh") return price / 1000;
  if (normalizedUnit === "wh") return price * 1000;
  return price;
};

const buildMarketPriceSeries = (
  price: ProviderMarketPrice | null
): ProviderMetricSeries | null => {
  if (!price || price.history.length === 0) {
    return null;
  }

  const entries = price.history
    .map((point) => ({
      timestamp: point.interval_start,
      value: convertMarketPriceToKwh(point.price, point.unit),
    }))
    .filter((entry) => Number.isFinite(Date.parse(entry.timestamp)));

  const firstTimestamp = entries[0]?.timestamp;
  if (!firstTimestamp) {
    return null;
  }

  return {
    metric_key: `market_${price.market.toLowerCase()}`,
    label: price.label,
    unit: "PLN/kWh",
    source_unit: `${price.currency}/${price.unit}`,
    chart_type: "line",
    aggregation_mode: "raw",
    date: new Date(firstTimestamp).toISOString().slice(0, 10),
    entries,
    hours: [],
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
  const [liveMetricEntriesByDate, setLiveMetricEntriesByDate] =
    useState<LiveMetricEntriesByDate>({});

  const { telemetry, loading, error } = useProviderTelemetry({
    providerUuid,
    date: selectedDate,
    loadErrorMessage: t("providers.telemetry.error"),
  });
  const provider = telemetry?.provider ?? initialProvider;
  const day = telemetry?.day ?? null;
  const measuredUnit = telemetry?.measured_unit ?? null;
  const energyUnit = telemetry?.energy_unit ?? null;
  const settlementPrice = telemetry?.settlement_price ?? null;
  const forecastPrice = telemetry?.forecast_price ?? null;
  const matchedRevenue = telemetry?.matched_revenue ?? null;

  const providerName =
    provider?.name ?? providerUuid ?? t("common.notAvailable");

  const batterySocMetric = telemetry?.metrics?.find(
    (metric) => metric.metric_key === "battery_soc"
  ) ?? null;
  const gridPowerMetric = telemetry?.metrics?.find(
    (metric) => metric.metric_key === "grid_power"
  ) ?? null;

  const shouldShowBatteryChart = Boolean(
    provider?.has_energy_storage && batterySocMetric
  );
  const shouldShowGridChart = Boolean(provider?.has_power_meter && gridPowerMetric);
  const primaryPowerLabel = provider
    ? getPrimaryProviderMetricLabel(provider, t)
    : t("providers.live.metrics.providerPower");
  const primaryPowerIcon =
    provider?.power_source === "meter" ? (
      <ElectricMeterIcon fontSize="small" />
    ) : (
      <SolarPowerIcon fontSize="small" />
    );

  useEffect(() => {
    setLiveEntriesByDate({});
    setLiveMetricEntriesByDate({});
    setLiveUnit(null);
  }, [providerUuid]);

  const handleProviderLiveChange = useCallback(
    (live: ProviderLiveSnapshot) => {
      if (!providerUuid || !live.hasWs) return;
      if (!live.measuredAt) return;

      const measuredAtMs = Date.parse(live.measuredAt);
      if (!Number.isFinite(measuredAtMs)) return;

      if (live.unit) {
        setLiveUnit((prev) => (prev === live.unit ? prev : live.unit));
      }

      const normalizedTimestamp = new Date(measuredAtMs).toISOString();
      const dayKey = formatDateForInput(new Date(measuredAtMs));

      if (live.power != null && !Number.isNaN(live.power)) {
        setLiveEntriesByDate((prev) => {
          const existingForDay = prev[dayKey] ?? [];
          const nextEntry: TelemetryChartPoint = {
            timestamp: normalizedTimestamp,
            value: live.power,
          };
          const nextForDay = upsertTelemetryEntry(existingForDay, nextEntry);

          if (nextForDay === existingForDay) {
            return prev;
          }

          return {
            ...prev,
            [dayKey]: nextForDay,
          };
        });
      }

      setLiveMetricEntriesByDate((prev) => {
        const nextMetrics = Object.entries(live.metrics).reduce<
          Record<string, TelemetryChartPoint[]>
        >((acc, [metricKey, metric]) => {
          if (metric?.value == null || Number.isNaN(metric.value)) {
            return acc;
          }

          const existingMetricEntries = prev[dayKey]?.[metricKey] ?? [];
          const nextMetricEntry = {
            timestamp: normalizedTimestamp,
            value: metric.value,
          } satisfies TelemetryChartPoint;
          const nextMetricEntries = upsertTelemetryEntry(
            existingMetricEntries,
            nextMetricEntry
          );

          if (nextMetricEntries !== existingMetricEntries) {
            acc[metricKey] = nextMetricEntries;
          }

          return acc;
        }, {});

        if (Object.keys(nextMetrics).length === 0) {
          return prev;
        }

        return {
          ...prev,
          [dayKey]: {
            ...(prev[dayKey] ?? {}),
            ...nextMetrics,
          },
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

  const selectedDayLiveMetricEntries = useMemo(
    () => liveMetricEntriesByDate[selectedDate] ?? {},
    [liveMetricEntriesByDate, selectedDate]
  );

  const batterySeriesWithLiveEntries = useMemo(
    () =>
      mergeSeriesWithLiveEntries(
        batterySocMetric,
        selectedDayLiveMetricEntries[BATTERY_SOC_METRIC_KEY] ?? [],
        "%"
      ),
    [batterySocMetric, selectedDayLiveMetricEntries]
  );

  const gridSeriesWithLiveEntries = useMemo(
    () =>
      mergeSeriesWithLiveEntries(
        gridPowerMetric,
        selectedDayLiveMetricEntries[GRID_POWER_METRIC_KEY] ?? [],
        gridPowerMetric?.unit
      ),
    [gridPowerMetric, selectedDayLiveMetricEntries]
  );

  const nextDayDisabled = selectedDate >= today;
  const isTodaySelected = selectedDate === today;
  const liveSubscriptionEnabled = Boolean(providerUuid) && (provider?.enabled ?? true);
  const chartMeasuredUnit = measuredUnit ?? liveUnit ?? provider?.unit ?? null;
  const precisePriceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 6,
      }),
    [locale]
  );

  const formatPricePerEnergyUnitLabel = useCallback(
    (price: number, currency: string, unit: string) =>
      `${precisePriceFormatter.format(price)} ${currency}/${unit}`,
    [precisePriceFormatter]
  );
  const marketSettlementSeries = useMemo(
    () => buildMarketPriceSeries(settlementPrice),
    [settlementPrice]
  );
  const marketForecastSeries = useMemo(
    () => buildMarketPriceSeries(forecastPrice),
    [forecastPrice]
  );

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
              initialMetrics={provider?.last_metric_snapshots ?? []}
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
              <Stack spacing={1.5}>
                <MarketPriceSummary
                  settlementPrice={settlementPrice}
                  forecastPrice={forecastPrice}
                  matchedRevenue={matchedRevenue}
                  locale={locale}
                  t={t}
                  formatPricePerEnergyUnitLabel={formatPricePerEnergyUnitLabel}
                />
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  color="text.secondary"
                >
                  <IconLabel icon={primaryPowerIcon}>
                    {primaryPowerLabel}
                  </IconLabel>
                </Typography>
                <ProviderTelemetryChart
                  day={day}
                  points={dayWithLiveEntries}
                  measuredUnit={chartMeasuredUnit}
                  energyUnit={energyUnit}
                  revenueCurrency={matchedRevenue?.currency ?? null}
                  yMin={provider?.value_min ?? null}
                  yMax={provider?.value_max ?? null}
                  noDataLabel={t("providers.telemetry.noDayData")}
                  noEntriesLabel={t("providers.telemetry.noEntriesData")}
                />
                <ProviderMetricChart
                  title={t("providers.telemetry.rceSettlementChart")}
                  series={marketSettlementSeries}
                  noDataLabel={t("providers.telemetry.noData")}
                />
                <ProviderMetricChart
                  title={t("providers.telemetry.rceForecastChart")}
                  series={marketForecastSeries}
                  noDataLabel={t("providers.telemetry.noData")}
                />
              </Stack>
            )}
          </LoadingOverlay>

          {shouldShowBatteryChart ? (
            <LoadingOverlay
              loading={loading}
              keepChildrenMounted
              minHeight={180}
            >
              <ProviderMetricChart
                title={
                  <IconLabel icon={<BatteryChargingFullIcon fontSize="small" />}>
                    {t("providers.live.metrics.batterySoc")}
                  </IconLabel>
                }
                series={batterySeriesWithLiveEntries}
                noDataLabel={t("providers.telemetry.noData")}
              />
            </LoadingOverlay>
          ) : null}

          {shouldShowGridChart ? (
            <LoadingOverlay
              loading={loading}
              keepChildrenMounted
              minHeight={180}
            >
              <ProviderMetricChart
                title={
                  <IconLabel icon={<ElectricMeterIcon fontSize="small" />}>
                    {t("providers.live.metrics.gridPower")}
                  </IconLabel>
                }
                series={gridSeriesWithLiveEntries}
                noDataLabel={t("providers.telemetry.noData")}
              />
            </LoadingOverlay>
          ) : null}
        </Stack>
      </TelemetryPanel>
    </Stack>
  );
}

type MarketPriceSummaryProps = {
  settlementPrice: ProviderMarketPrice | null;
  forecastPrice: ProviderMarketPrice | null;
  matchedRevenue: ProviderMatchedRevenue | null;
  locale: string;
  t: (key: string, options?: Record<string, unknown>) => string;
  formatPricePerEnergyUnitLabel: (
    price: number,
    currency: string,
    unit: string
  ) => string;
};

function MarketPriceSummary({
  settlementPrice,
  forecastPrice,
  matchedRevenue,
  locale,
  t,
  formatPricePerEnergyUnitLabel,
}: MarketPriceSummaryProps) {
  if (!settlementPrice && !forecastPrice && !matchedRevenue) {
    return null;
  }

  const formatInterval = (price: ProviderMarketPrice | null) => {
    if (!price) return t("common.notAvailable");
    return `${new Date(price.interval_start).toLocaleTimeString(
      locale,
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    )} - ${new Date(price.interval_end).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const settlementIntervalLabel = formatInterval(settlementPrice);
  const forecastIntervalLabel = formatInterval(forecastPrice);
  const forecastUpdatedAtLabel = forecastPrice?.source_updated_at
    ? new Date(forecastPrice.source_updated_at).toLocaleString(locale)
    : null;
  const settlementLabel =
    settlementPrice != null
      ? formatPricePerEnergyUnitLabel(
          convertMarketPriceToKwh(settlementPrice.price, settlementPrice.unit),
          settlementPrice.currency,
          "kWh"
        )
      : t("common.notAvailable");
  const forecastLabel =
    forecastPrice != null
      ? formatPricePerEnergyUnitLabel(
          convertMarketPriceToKwh(forecastPrice.price, forecastPrice.unit),
          forecastPrice.currency,
          "kWh"
        )
      : t("common.notAvailable");
  const compactFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  const matchedRevenueLabel =
    matchedRevenue != null
      ? `${compactFormatter.format(matchedRevenue.total_revenue)} ${
          matchedRevenue.currency
        }`
      : t("common.notAvailable");
  const matchedEnergyLabel =
    matchedRevenue?.energy_unit
      ? `${compactFormatter.format(matchedRevenue.total_export_energy)} ${
          matchedRevenue.energy_unit
        }`
      : t("common.notAvailable");

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        p: 1.25,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        useFlexGap
        flexWrap="wrap"
      >
        <MarketPriceStat
          label={t("providers.telemetry.rceSettlementPrice")}
          value={settlementLabel}
          caption={`${t("providers.telemetry.rceValidInterval")}: ${settlementIntervalLabel}`}
        />
        <MarketPriceStat
          label={t("providers.telemetry.rceForecastPrice")}
          value={forecastLabel}
          caption={
            forecastUpdatedAtLabel
              ? `${t("providers.telemetry.rceForecastUpdatedAt", {
                  value: forecastUpdatedAtLabel,
                })} · ${t("providers.telemetry.rceValidInterval")}: ${forecastIntervalLabel}`
              : `${t("providers.telemetry.rceValidInterval")}: ${forecastIntervalLabel}`
          }
        />
        <MarketPriceStat
          label={t("providers.telemetry.rceMatchedRevenue")}
          value={matchedRevenueLabel}
          caption={
            matchedRevenue != null
              ? t("providers.telemetry.rceMatchedRevenueHint", {
                  energy: matchedEnergyLabel,
                  count: matchedRevenue.matched_intervals,
                })
              : t("common.notAvailable")
          }
        />
      </Stack>
    </Box>
  );
}

type MarketPriceStatProps = {
  label: string;
  value: string;
  caption: string;
};

function MarketPriceStat({ label, value, caption }: MarketPriceStatProps) {
  return (
    <Box sx={{ minWidth: { xs: "100%", md: 150 }, flex: "1 1 0" }}>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 0.25, lineHeight: 1.2 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        fontWeight={700}
        color="text.primary"
        sx={{ lineHeight: 1.2 }}
      >
        {value}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mt: 0.25, lineHeight: 1.2 }}
      >
        {caption}
      </Typography>
    </Box>
  );
}
