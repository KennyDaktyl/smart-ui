import { useEffect, useState } from "react";
import { providersApi } from "@/api/providersApi";
import type {
  DayEnergy,
  ProviderMeasurement,
  ProviderTelemetryEntry,
} from "@/features/providers/types/userProvider";

type UseProviderTelemetryDayOptions = {
  providerUuid?: string;
  date: string;
  loadErrorMessage: string;
};

type UseProviderTelemetryDayState = {
  day: DayEnergy | null;
  unit: string | null;
  loading: boolean;
  error: string | null;
};

const INITIAL_STATE: UseProviderTelemetryDayState = {
  day: null,
  unit: null,
  loading: false,
  error: null,
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const toNullableNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
};

const toFiniteNumberOrZero = (value: unknown): number => {
  const parsed = toFiniteNumber(value);
  return parsed ?? 0;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeEntry = (entry: unknown): ProviderTelemetryEntry | null => {
  if (!isRecord(entry)) return null;

  const measuredAt = toNullableString(entry.measured_at);
  const measuredValueRaw = entry.measured_value;
  const measuredValue = toFiniteNumber(measuredValueRaw);
  const measuredValueIsNull = measuredValueRaw === null;

  if (measuredAt && (measuredValue != null || measuredValueIsNull)) {
    const normalized: ProviderMeasurement = {
      measured_at: measuredAt,
      measured_value: measuredValue ?? null,
      measured_unit: toNullableString(entry.measured_unit),
    };

    const id = toNullableNumber(entry.id);
    if (id != null) normalized.id = id;

    const providerUuid = toNullableString(entry.provider_uuid);
    if (providerUuid) normalized.provider_uuid = providerUuid;

    const createdAt = toNullableString(entry.created_at);
    if (createdAt) normalized.created_at = createdAt;

    if (entry.metadata_payload == null || isRecord(entry.metadata_payload)) {
      normalized.metadata_payload = entry.metadata_payload ?? null;
    }

    return normalized;
  }

  const timestamp = toNullableString(entry.timestamp);
  const energy = toFiniteNumber(entry.energy);

  if (timestamp && energy != null) {
    return {
      timestamp,
      energy,
    };
  }

  return null;
};

const normalizeEntries = (entries: unknown): ProviderTelemetryEntry[] => {
  if (!Array.isArray(entries)) return [];

  return entries
    .map(normalizeEntry)
    .filter((entry): entry is ProviderTelemetryEntry => entry != null)
    .sort((left, right) => {
      const leftTimestamp =
        "measured_at" in left ? left.measured_at : left.timestamp;
      const rightTimestamp =
        "measured_at" in right ? right.measured_at : right.timestamp;

      return Date.parse(leftTimestamp) - Date.parse(rightTimestamp);
    });
};

const normalizeHours = (hours: unknown) => {
  if (!Array.isArray(hours)) return [];

  return hours
    .map((hourEntry) => {
      if (!isRecord(hourEntry)) return null;
      const hour = toNullableString(hourEntry.hour);
      const energy = toFiniteNumber(hourEntry.energy);
      if (!hour || energy == null) return null;
      return { hour, energy };
    })
    .filter((entry): entry is { hour: string; energy: number } => entry != null)
    .sort((left, right) => Date.parse(left.hour) - Date.parse(right.hour));
};

const resolveResponseUnit = (
  payload: unknown,
  entries: ProviderTelemetryEntry[]
): string | null => {
  if (isRecord(payload)) {
    const unit = toNullableString(payload.unit);
    if (unit) return unit;
  }

  const measuredEntry = entries.find(
    (entry): entry is ProviderMeasurement => "measured_at" in entry
  );
  return measuredEntry?.measured_unit ?? null;
};

const normalizeDayFromPayload = (
  payload: unknown,
  requestedDate: string
): { day: DayEnergy | null; unit: string | null } => {
  if (isRecord(payload) && isRecord(payload.days)) {
    const dayMap = payload.days;
    const candidateFromRequestedDate = dayMap[requestedDate];

    const fallback = Object.entries(dayMap)
      .sort(([left], [right]) => left.localeCompare(right))
      .find(
        (
          candidate
        ): candidate is [string, Record<string, unknown>] =>
          isRecord(candidate[1])
      );

    const candidateTuple = isRecord(candidateFromRequestedDate)
      ? ([requestedDate, candidateFromRequestedDate] as const)
      : fallback;

    if (!candidateTuple) return { day: null, unit: null };

    const [candidateDateKey, candidate] = candidateTuple;

    const date = toNullableString(candidate.date) ?? candidateDateKey ?? requestedDate;
    const entries = normalizeEntries(candidate.entries);

    return {
      day: {
        date,
        total_energy: toFiniteNumberOrZero(candidate.total_energy),
        import_energy: toFiniteNumberOrZero(candidate.import_energy),
        export_energy: toFiniteNumberOrZero(candidate.export_energy),
        hours: normalizeHours(candidate.hours),
        entries,
      },
      unit: resolveResponseUnit(payload, entries),
    };
  }

  const entries = normalizeEntries(isRecord(payload) ? payload.entries : payload);
  if (!entries.length && !isRecord(payload)) return { day: null, unit: null };

  const dateFromPayload = isRecord(payload)
    ? toNullableString(payload.date)
    : null;

  return {
    day: {
      date: dateFromPayload ?? requestedDate,
      total_energy: isRecord(payload) ? toFiniteNumberOrZero(payload.total_energy) : 0,
      import_energy: isRecord(payload) ? toFiniteNumberOrZero(payload.import_energy) : 0,
      export_energy: isRecord(payload) ? toFiniteNumberOrZero(payload.export_energy) : 0,
      hours: isRecord(payload) ? normalizeHours(payload.hours) : [],
      entries,
    },
    unit: resolveResponseUnit(payload, entries),
  };
};

export function useProviderTelemetryDay({
  providerUuid,
  date,
  loadErrorMessage,
}: UseProviderTelemetryDayOptions): UseProviderTelemetryDayState {
  const [state, setState] = useState<UseProviderTelemetryDayState>(
    INITIAL_STATE
  );

  useEffect(() => {
    if (!providerUuid || !date) {
      setState(INITIAL_STATE);
      return;
    }

    let cancelled = false;

    const loadTelemetry = async () => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const res = await providersApi.getProviderEnergy(providerUuid, {
          date,
        });

        if (cancelled) return;
        const { day, unit } = normalizeDayFromPayload(res.data, date);

        setState({
          day,
          unit,
          loading: false,
          error: null,
        });
      } catch {
        if (cancelled) return;
        setState({
          day: null,
          unit: null,
          loading: false,
          error: loadErrorMessage,
        });
      }
    };

    void loadTelemetry();

    return () => {
      cancelled = true;
    };
  }, [date, loadErrorMessage, providerUuid]);

  return state;
}
