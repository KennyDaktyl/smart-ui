const DEFAULT_EXPECTED_INTERVAL_SEC = 60;
const HEARTBEAT_TIMEOUT_BUFFER_SEC = 5;
const MIN_EXPECTED_INTERVAL_SEC = 1;

const EXPECTED_INTERVAL_KEYS = [
  "expected_interval_sec",
  "heartbeat_interval_sec",
  "heartbeat_interval",
  "interval_sec",
  "expectedIntervalSec",
  "heartbeatIntervalSec",
  "heartbeatInterval",
  "interval",
] as const;

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const parseTimestampMs = (rawTimestamp: unknown): number | null => {
  if (typeof rawTimestamp === "number") {
    return rawTimestamp > 1_000_000_000_000
      ? rawTimestamp
      : rawTimestamp * 1000;
  }

  if (typeof rawTimestamp === "string") {
    const asNumber = Number(rawTimestamp);
    if (Number.isFinite(asNumber)) {
      return asNumber > 1_000_000_000_000
        ? asNumber
        : asNumber * 1000;
    }

    const parsed = Date.parse(rawTimestamp);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return null;
};

const extractExpectedIntervalSecFromRecord = (
  record: Record<string, unknown>
): number | null => {
  for (const key of EXPECTED_INTERVAL_KEYS) {
    const parsed = toFiniteNumber(record[key]);
    if (parsed == null) continue;
    if (parsed <= 0) continue;
    return parsed;
  }

  return null;
};

const extractExpectedIntervalSec = (event: unknown): number | null => {
  const root = asRecord(event);
  if (!root) return null;

  const payload = asRecord(root.payload);
  const data = asRecord(root.data);
  const payloadData = payload ? asRecord(payload.data) : null;

  const records = [payload, payloadData, data, root].filter(
    (record): record is Record<string, unknown> => record != null
  );

  for (const record of records) {
    const expectedSec = extractExpectedIntervalSecFromRecord(record);
    if (expectedSec != null) return expectedSec;
  }

  return null;
};

export const DEFAULT_HEARTBEAT_TIMEOUT_MS =
  (DEFAULT_EXPECTED_INTERVAL_SEC + HEARTBEAT_TIMEOUT_BUFFER_SEC) * 1000;

export const resolveHeartbeatTimestampMs = (event: unknown): number => {
  const root = asRecord(event);
  if (!root) return Date.now();

  const payload = asRecord(root.payload);
  const data = asRecord(root.data);

  const candidates = [
    payload?.timestamp,
    payload?.sent_at,
    data?.timestamp,
    data?.sent_at,
    root.timestamp,
    root.sent_at,
  ];

  for (const candidate of candidates) {
    const parsed = parseTimestampMs(candidate);
    if (parsed != null) return parsed;
  }

  return Date.now();
};

export const resolveHeartbeatTimeoutMs = (
  event: unknown,
  fallbackTimeoutMs = DEFAULT_HEARTBEAT_TIMEOUT_MS
): number => {
  const expectedIntervalSec = extractExpectedIntervalSec(event);
  if (expectedIntervalSec == null) return fallbackTimeoutMs;

  const normalizedExpectedSec = Math.max(
    MIN_EXPECTED_INTERVAL_SEC,
    expectedIntervalSec
  );

  return (normalizedExpectedSec + HEARTBEAT_TIMEOUT_BUFFER_SEC) * 1000;
};
