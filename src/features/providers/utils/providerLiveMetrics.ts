import type { ProviderResponse } from "@/features/providers/types/userProvider";

export const PRIMARY_POWER_METRIC_KEY = "primary_power";
export const BATTERY_SOC_METRIC_KEY = "battery_soc";
export const GRID_POWER_METRIC_KEY = "grid_power";

type MetricLike = {
  value?: unknown;
  unit?: unknown;
};

type ExtraMetricLike = MetricLike & {
  key?: unknown;
  metric_key?: unknown;
};

type ProviderCurrentEnergyPayloadLike = {
  value?: unknown;
  unit?: unknown;
  measured_value?: unknown;
  measured_unit?: unknown;
  measured_at?: unknown;
  timestamp?: unknown;
  battery_soc?: MetricLike | null;
  grid_power?: MetricLike | null;
  extra_metrics?: ExtraMetricLike[] | null;
  data?: {
    value?: unknown;
    unit?: unknown;
    measured_value?: unknown;
    measured_unit?: unknown;
    measured_at?: unknown;
    battery_soc?: MetricLike | null;
    grid_power?: MetricLike | null;
    extra_metrics?: ExtraMetricLike[] | null;
  } | null;
};

export type ProviderMetricSnapshot = {
  value: number | null;
  unit: string | null;
};

export type ProviderLiveMetricMap = Record<string, ProviderMetricSnapshot>;

export type ParsedProviderCurrentEnergy = {
  measuredAt: string | null;
  value: number | null;
  unit: string | null;
  metrics: ProviderLiveMetricMap;
};

export type ProviderDisplayMetric = {
  key: string;
  label: string;
  value: number | null;
  unit: string | null;
  isPrimary: boolean;
};

type BootstrapMetricInput = {
  metric_key?: string | null;
  value?: number | null;
  unit?: string | null;
};

type Translate = (key: string, options?: Record<string, unknown>) => string;

export const getPrimaryProviderMetricLabel = (
  provider: Pick<ProviderResponse, "power_source">,
  t: Translate
) => {
  if (provider.power_source === "meter") {
    return t("providers.live.metrics.meterPower");
  }

  if (provider.power_source === "inverter") {
    return t("providers.live.metrics.inverterPower");
  }

  return t("providers.live.metrics.providerPower");
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const normalizeMetricSnapshot = (
  metric: MetricLike | null | undefined
): ProviderMetricSnapshot | null => {
  if (!metric || typeof metric !== "object") return null;

  const value = toFiniteNumber(metric.value);
  const unit = toNullableString(metric.unit);

  if (value == null && unit == null) {
    return null;
  }

  return { value, unit };
};

const upsertMetric = (
  metrics: ProviderLiveMetricMap,
  key: string,
  snapshot: ProviderMetricSnapshot | null
) => {
  if (!key || !snapshot) return;
  metrics[key] = snapshot;
};

const humanizeMetricKey = (metricKey: string) =>
  metricKey
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const createInitialProviderMetrics = (
  power: number | null | undefined,
  unit: string | null | undefined,
  initialMetrics?: BootstrapMetricInput[] | null
): ProviderLiveMetricMap => {
  const metrics: ProviderLiveMetricMap = {};
  const value = toFiniteNumber(power);
  const normalizedUnit = toNullableString(unit);

  if (value != null || normalizedUnit != null) {
    metrics[PRIMARY_POWER_METRIC_KEY] = {
      value,
      unit: normalizedUnit,
    };
  }

  initialMetrics?.forEach((metric) => {
    const metricKey = toNullableString(metric.metric_key);
    if (!metricKey) return;

    const snapshot = normalizeMetricSnapshot({
      value: metric.value,
      unit: metric.unit,
    });
    if (!snapshot) return;

    metrics[metricKey] = snapshot;
  });

  return metrics;
};

const extractPowerflowMetric = (
  provider: ProviderResponse,
  metricKey: string
): BootstrapMetricInput | null => {
  const extraData = provider.last_value?.extra_data;
  if (!extraData || typeof extraData !== "object") {
    return null;
  }

  const powerflow =
    "powerflow" in extraData &&
    extraData.powerflow &&
    typeof extraData.powerflow === "object"
      ? (extraData.powerflow as Record<string, unknown>)
      : null;

  if (!powerflow) {
    return null;
  }

  if (metricKey === BATTERY_SOC_METRIC_KEY) {
    const value = toFiniteNumber(powerflow.soc);
    return value == null
      ? null
      : {
          metric_key: BATTERY_SOC_METRIC_KEY,
          value,
          unit: "%",
        };
  }

  if (metricKey === GRID_POWER_METRIC_KEY) {
    const value = toFiniteNumber(powerflow.grid_w);
    return value == null
      ? null
      : {
          metric_key: GRID_POWER_METRIC_KEY,
          value,
          unit: "W",
        };
  }

  return null;
};

export const getProviderBootstrapMetrics = (
  provider: ProviderResponse
): BootstrapMetricInput[] => {
  const explicitSnapshots = provider.last_metric_snapshots ?? [];
  if (explicitSnapshots.length > 0) {
    return explicitSnapshots;
  }

  const inferredMetrics: BootstrapMetricInput[] = [];

  if (provider.has_energy_storage) {
    const batteryMetric = extractPowerflowMetric(provider, BATTERY_SOC_METRIC_KEY);
    if (batteryMetric) {
      inferredMetrics.push(batteryMetric);
    }
  }

  if (provider.has_power_meter) {
    const gridMetric = extractPowerflowMetric(provider, GRID_POWER_METRIC_KEY);
    if (gridMetric) {
      inferredMetrics.push(gridMetric);
    }
  }

  return inferredMetrics;
};

export const parseProviderCurrentEnergy = (
  event: ProviderCurrentEnergyPayloadLike
): ParsedProviderCurrentEnergy => {
  const measuredAt =
    toNullableString(event.data?.measured_at) ??
    toNullableString(event.measured_at) ??
    toNullableString(event.timestamp);

  const value =
    toFiniteNumber(event.data?.value) ??
    toFiniteNumber(event.data?.measured_value) ??
    toFiniteNumber(event.value) ??
    toFiniteNumber(event.measured_value);

  const unit =
    toNullableString(event.data?.unit) ??
    toNullableString(event.data?.measured_unit) ??
    toNullableString(event.unit) ??
    toNullableString(event.measured_unit);

  const metrics = createInitialProviderMetrics(value, unit);

  upsertMetric(
    metrics,
    BATTERY_SOC_METRIC_KEY,
    normalizeMetricSnapshot(event.data?.battery_soc ?? event.battery_soc)
  );
  upsertMetric(
    metrics,
    GRID_POWER_METRIC_KEY,
    normalizeMetricSnapshot(event.data?.grid_power ?? event.grid_power)
  );

  const extraMetrics = [
    ...(event.data?.extra_metrics ?? []),
    ...(event.extra_metrics ?? []),
  ];

  extraMetrics.forEach((metric) => {
    if (!metric || typeof metric !== "object") return;
    const key =
      toNullableString(metric.metric_key) ?? toNullableString(metric.key);
    if (!key) return;

    upsertMetric(metrics, key, normalizeMetricSnapshot(metric));
  });

  return {
    measuredAt,
    value,
    unit,
    metrics,
  };
};

const getPrimaryMetricSnapshot = (
  provider: ProviderResponse,
  liveMetrics?: ProviderLiveMetricMap | null,
  power?: number | null,
  unit?: string | null
): ProviderMetricSnapshot => {
  const livePrimary = liveMetrics?.[PRIMARY_POWER_METRIC_KEY];
  if (livePrimary) {
    return livePrimary;
  }

  const liveValue = toFiniteNumber(power);
  const liveUnit = toNullableString(unit);
  if (liveValue != null || liveUnit != null) {
    return {
      value: liveValue,
      unit: liveUnit,
    };
  }

  return {
    value: provider.last_value?.measured_value ?? null,
    unit:
      provider.last_value?.measured_unit ??
      provider.unit ??
      null,
  };
};

const getMetricLabel = (
  provider: ProviderResponse,
  metricKey: string,
  t: Translate
) => {
  if (metricKey === PRIMARY_POWER_METRIC_KEY) {
    return getPrimaryProviderMetricLabel(provider, t);
  }

  if (metricKey === BATTERY_SOC_METRIC_KEY) {
    return t("providers.live.metrics.batterySoc");
  }

  if (metricKey === GRID_POWER_METRIC_KEY) {
    return t("providers.live.metrics.gridPower");
  }

  const definition = provider.telemetry_metrics.find(
    (metric) => metric.metric_key === metricKey
  );
  if (definition?.label) {
    return definition.label;
  }

  return humanizeMetricKey(metricKey);
};

export const formatProviderMetricValue = (
  value: number | null,
  unit?: string | null
) => {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }

  const precision = unit === "%" ? 0 : Math.abs(value) >= 100 ? 0 : 2;
  const formatted = Number(value).toLocaleString(undefined, {
    minimumFractionDigits: precision === 0 ? 0 : 1,
    maximumFractionDigits: precision,
  });

  return [formatted, unit ?? ""].filter(Boolean).join(" ");
};

type ResolveDisplayMetricsArgs = {
  provider: ProviderResponse;
  liveMetrics?: ProviderLiveMetricMap | null;
  power?: number | null;
  unit?: string | null;
  t: Translate;
};

export const resolveProviderDisplayMetrics = ({
  provider,
  liveMetrics,
  power,
  unit,
  t,
}: ResolveDisplayMetricsArgs): ProviderDisplayMetric[] => {
  const providerMetricKeys = provider.telemetry_metrics.map(
    (metric) => metric.metric_key
  );
  const candidateKeys = new Set<string>([
    PRIMARY_POWER_METRIC_KEY,
    ...providerMetricKeys,
    ...Object.keys(liveMetrics ?? {}),
  ]);

  if (provider.has_energy_storage) {
    candidateKeys.add(BATTERY_SOC_METRIC_KEY);
  }

  if (provider.has_power_meter) {
    candidateKeys.add(GRID_POWER_METRIC_KEY);
  }

  const primaryMetric = getPrimaryMetricSnapshot(
    provider,
    liveMetrics,
    power,
    unit
  );
  const initialMetrics = getProviderBootstrapMetrics(provider);

  return Array.from(candidateKeys)
    .map((metricKey) => {
      const snapshot =
        metricKey === PRIMARY_POWER_METRIC_KEY
          ? primaryMetric
          : liveMetrics?.[metricKey] ??
            (() => {
              const initialMetric = initialMetrics.find(
                (metric) => metric.metric_key === metricKey
              );
              if (initialMetric) {
                return {
                  value: initialMetric.value ?? null,
                  unit: initialMetric.unit ?? null,
                };
              }

              return {
                value: null,
                unit:
                  provider.telemetry_metrics.find(
                    (metric) => metric.metric_key === metricKey
                  )?.unit ?? null,
              };
            })();

      if (
        metricKey !== PRIMARY_POWER_METRIC_KEY &&
        snapshot.value == null &&
        snapshot.unit == null &&
        !providerMetricKeys.includes(metricKey)
      ) {
        return null;
      }

      return {
        key: metricKey,
        label: getMetricLabel(provider, metricKey, t),
        value: snapshot.value,
        unit: snapshot.unit,
        isPrimary: metricKey === PRIMARY_POWER_METRIC_KEY,
      } satisfies ProviderDisplayMetric;
    })
    .filter((metric): metric is ProviderDisplayMetric => Boolean(metric))
    .sort((left, right) => {
      const leftPriority =
        left.key === PRIMARY_POWER_METRIC_KEY
          ? -20
          : left.key === BATTERY_SOC_METRIC_KEY
            ? -10
            : left.key === GRID_POWER_METRIC_KEY
              ? -5
              : providerMetricKeys.indexOf(left.key) >= 0
                ? providerMetricKeys.indexOf(left.key)
                : 1000;
      const rightPriority =
        right.key === PRIMARY_POWER_METRIC_KEY
          ? -20
          : right.key === BATTERY_SOC_METRIC_KEY
            ? -10
            : right.key === GRID_POWER_METRIC_KEY
              ? -5
              : providerMetricKeys.indexOf(right.key) >= 0
                ? providerMetricKeys.indexOf(right.key)
                : 1000;

      return leftPriority - rightPriority;
    });
};
