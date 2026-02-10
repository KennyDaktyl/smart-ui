import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { devicesApi } from "@/api/devicesApi";
import { microcontrollersApi } from "@/api/microcontrollerApi";

import type { Device } from "@/features/devices/types/devicesType";
import type { DeviceEventsResponse } from "@/features/devices/types/deviceEvents";

import { DeviceDetailsInfo } from "@/features/devices/components/DeviceDetailsInfo";
import { DeviceTelemetryTimeline } from "@/features/devices/components/DeviceTelemetryTimeline";
import { DateRangeFields } from "@/features/common/components/DateRangeFields";
import { useDeviceLiveState } from "@/features/devices/live/useDeviceLiveState";
import { useMicrocontrollerLive } from "@/features/microcontrollers/hooks/useMicrocontrollerLive";
import { DeviceInfoTile } from "@/features/devices/components/DeviceInfoTile";

/* ===================== TYPES ===================== */

type DeviceLocationState = {
  device?: Device;
};

const ELECTRICITY_RATE = 0.62; // zł / kWh

/* ===================== HELPERS ===================== */

function formatMinutesAsHours(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

function formatEnergyCost(energyKwh: number): string {
  return `${(energyKwh * ELECTRICITY_RATE).toFixed(2)} zł`;
}

function formatLocalDateTime(date: Date): string {
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/* ===================== COMPONENT ===================== */

export default function DeviceDetailsPage() {
  const navigate = useNavigate();
  const { deviceId } = useParams<{ deviceId: string }>();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const locationState = (location.state as DeviceLocationState | undefined) || {};

  const [device, setDevice] = useState<Device | null>(locationState.device ?? null);
  const [loading, setLoading] = useState(!locationState.device);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<"details" | "telemetry">("details");
  const [microcontrollerUuid, setMicrocontrollerUuid] = useState<string>("");

  const [eventsResponse, setEventsResponse] =
    useState<DeviceEventsResponse | null>(null);

  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const locale = i18n.language === "pl" ? "pl-PL" : "en-US";

  /* ===================== DATE RANGE ===================== */

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

  /* ===================== FETCH DEVICE ===================== */

  useEffect(() => {
    if (!deviceId || device) return;

    const fetchDevice = async () => {
      setLoading(true);
      try {
        const res = await devicesApi.getDeviceById(Number(deviceId));
        setDevice(res.data);
      } catch {
        setError(t("devices.details.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchDevice();
  }, [deviceId, device, t]);

  /* ===================== MICROCONTROLLER ===================== */

  useEffect(() => {
    if (!device?.microcontroller_id || microcontrollerUuid) return;

    const fetchMicrocontroller = async () => {
      try {
        const res = await microcontrollersApi.getUserMicrocontrollers();
        const found = res.data.find((mc) => mc.id === device.microcontroller_id);
        if (found?.uuid) setMicrocontrollerUuid(found.uuid);
      } catch {
        /* intentionally empty */
      }
    };

    fetchMicrocontroller();
  }, [device?.microcontroller_id, microcontrollerUuid]);

  /* ===================== LIVE STATES ===================== */

  const deviceLiveMap = useDeviceLiveState(microcontrollerUuid || undefined);
  const deviceLive = device?.id ? deviceLiveMap[device.id] : undefined;

  const microLive = useMicrocontrollerLive(microcontrollerUuid || undefined);

  /* ===================== DERIVED DATA ===================== */

  const formattedLastUpdate = useMemo(() => {
    if (!device?.last_state_change_at) return t("common.notAvailable");
    return new Date(device.last_state_change_at).toLocaleString(locale);
  }, [device?.last_state_change_at, locale, t]);

  const modeLabel = useMemo(() => {
    const mode = deviceLive?.mode ?? device?.mode;
    if (!mode) return t("common.notAvailable");
    if (mode === "AUTO") return t("devices.details.modes.auto");
    if (mode === "SCHEDULE") return t("devices.details.modes.schedule");
    return t("devices.details.modes.manual");
  }, [device?.mode, deviceLive?.mode, t]);

  const isOn = deviceLive?.isOn ?? device?.manual_state ?? false;
  const stateLabel = isOn
    ? t("devices.details.stateOn")
    : t("devices.details.stateOff");

  // ✅ TO JEST KLUCZOWA ZMIANA
  const deviceStatusLabel = useMemo(() => {
    if (!deviceLive) {
      return t("common.waitingForStatus");
    }

    return deviceLive.isOn
      ? t("devices.details.stateOn")
      : t("devices.details.stateOff");
  }, [deviceLive, t]);

  /* ===================== FETCH TELEMETRY ===================== */

  useEffect(() => {
    if (tab !== "telemetry") return;
    if (!device?.id) return;

    const fetchEvents = async () => {
      setLoadingEvents(true);
      setEventsError(null);

      try {
        const res = await devicesApi.getDeviceEvents(device.id, {
          limit: 1000,
          date_start: range.start,
          date_end: range.end,
        });

        setEventsResponse(res.data);
      } catch {
        setEventsError(t("devices.details.loadEventsError"));
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [tab, device?.id, range.start, range.end, t]);
  /* ===================== RENDER ===================== */

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!device) {
    return (
      <Box p={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          {t("common.back")}
        </Button>
        <Alert severity="error">{error || t("devices.details.missing")}</Alert>
      </Box>
    );
  }

  return (
    <Box p={{ xs: 1.5, sm: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
        {t("common.back")}
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
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            {device.name}
          </Typography>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mt: 2 }}>
            <Tab value="details" label={t("devices.details.tabs.details")} />
            <Tab value="telemetry" label={t("devices.details.tabs.telemetry")} />
          </Tabs>
        </Box>

        <Box sx={{ background: "#f6fbf8", p: 3 }}>
          {tab === "details" && (
            <DeviceDetailsInfo
              device={device}
              modeLabel={modeLabel}
              stateLabel={stateLabel}
              onlineLabel={deviceStatusLabel}
              formattedLastUpdate={formattedLastUpdate}
              t={t}
            />
          )}

          {tab === "telemetry" && (
            <Stack spacing={2}>
              <DateRangeFields
                startLabel={t("devices.details.rangeStart")}
                endLabel={t("devices.details.rangeEnd")}
                startValue={range.start}
                endValue={range.end}
                onChangeStart={(v) => setRange((r) => ({ ...r, start: v }))}
                onChangeEnd={(v) => setRange((r) => ({ ...r, end: v }))}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <DeviceInfoTile
                  label={t("devices.details.fields.energy")}
                  value={
                    eventsResponse?.energy_kwh != null
                      ? `${eventsResponse.energy_kwh.toFixed(2)} kWh`
                      : t("common.notAvailable")
                  }
                />
                <DeviceInfoTile
                  label={t("devices.details.fields.energyCost", {
                    rate: "0.62 zł/kWh",
                  })}
                  value={
                    eventsResponse?.energy_kwh != null
                      ? formatEnergyCost(eventsResponse.energy_kwh)
                      : t("common.notAvailable")
                  }
                />
                <DeviceInfoTile
                  label={t("devices.details.fields.totalMinutes")}
                  value={
                    eventsResponse?.total_minutes_on != null
                      ? formatMinutesAsHours(eventsResponse.total_minutes_on)
                      : t("common.notAvailable")
                  }
                />
                <DeviceInfoTile
                  label={t("devices.details.fields.ratedPower")}
                  value={
                    eventsResponse?.rated_power_kw != null
                      ? `${eventsResponse.rated_power_kw} kW`
                      : t("common.notAvailable")
                  }
                />
              </Stack>

              {eventsError && <Alert severity="error">{eventsError}</Alert>}

              <DeviceTelemetryTimeline
                events={eventsResponse?.events ?? []}
                loading={loadingEvents}
                error={eventsError}
                tNoData={t("devices.details.noEvents")}
                start={range.start}
                end={range.end}
              />
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
