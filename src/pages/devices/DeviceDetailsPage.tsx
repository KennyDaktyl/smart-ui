import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type SyntheticEvent,
} from "react";
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
import Grid from "@mui/material/Grid2";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { devicesApi } from "@/api/devicesApi";
import { microcontrollersApi } from "@/api/microcontrollerApi";

import type { Device } from "@/features/devices/types/devicesType";
import type {
  DeviceEvent,
  DeviceEventsResponse,
} from "@/features/devices/types/deviceEvents";
import type { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import type { ProviderResponse } from "@/features/providers/types/userProvider";

import { DeviceDetailsInfo } from "@/features/devices/components/DeviceDetailsInfo";
import { DeviceTelemetryTimeline } from "@/features/devices/components/DeviceTelemetryTimeline";
import { useDeviceLiveState } from "@/features/devices/live/useDeviceLiveState";
import { useMicrocontrollerLive } from "@/features/microcontrollers/hooks/useMicrocontrollerLive";
import { DeviceInfoTile } from "@/features/devices/components/DeviceInfoTile";
import { DeviceLiveStatus } from "@/features/devices/live/DeviceLiveStatus";
import { MicrocontrollerLiveStatus } from "@/features/microcontrollers/live/MicrocontrollerLiveStatus";
import { ProviderLiveEnergy } from "@/features/providers/live/ProviderLiveEnergy";
import { DeviceEventLiveWidget } from "@/features/live/widgets/DeviceEventLiveWidget";
import { TelemetryDateNavigator } from "@/features/providers/telemetry/components/TelemetryDateNavigator";
import {
  addDays,
  formatDateForInput,
  isFutureDate,
} from "@/features/providers/telemetry/utils/date";

type DeviceLocationState = {
  device?: Device;
};

const ELECTRICITY_RATE = 0.62; // zł / kWh

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

function resolvePowerProvider(
  microcontroller: MicrocontrollerResponse
): ProviderResponse | null {
  const availableProviders = microcontroller.available_api_providers ?? [];
  const powerProvider = microcontroller.power_provider ?? null;

  const configuredProviderUuid =
    powerProvider?.uuid ?? microcontroller.config?.provider?.uuid ?? "";

  if (
    powerProvider &&
    (!configuredProviderUuid || powerProvider.uuid === configuredProviderUuid)
  ) {
    return powerProvider;
  }

  return (
    availableProviders.find(
      (provider) => provider.uuid === configuredProviderUuid
    ) ??
    powerProvider ??
    null
  );
}

export default function DeviceDetailsPage() {
  const navigate = useNavigate();
  const { deviceId } = useParams<{ deviceId: string }>();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const locationState =
    (location.state as DeviceLocationState | undefined) || {};

  const [device, setDevice] = useState<Device | null>(
    locationState.device ?? null
  );
  const [loading, setLoading] = useState(!locationState.device);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<"details" | "telemetry">("details");

  const [eventsResponse, setEventsResponse] =
    useState<DeviceEventsResponse | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [microcontroller, setMicrocontroller] =
    useState<MicrocontrollerResponse | null>(null);
  const [powerProvider, setPowerProvider] = useState<ProviderResponse | null>(
    null
  );

  const [liveDeviceEvents, setLiveDeviceEvents] = useState<DeviceEvent[]>(
    []
  );

  const locale = i18n.language === "pl" ? "pl-PL" : "en-US";

  const today = formatDateForInput(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  const deviceSubscriptions = useMemo(
    () =>
      device?.id && device.uuid
        ? [{ id: device.id, uuid: device.uuid }]
        : [],
    [device?.id, device?.uuid]
  );

  const deviceLiveMap = useDeviceLiveState(
    microcontroller?.uuid,
    deviceSubscriptions
  );
  const deviceLive = device?.id ? deviceLiveMap[device.id] : undefined;

  const microLive = useMicrocontrollerLive(microcontroller?.uuid);

  useEffect(() => {
    if (!deviceId || device) return;

    let cancelled = false;

    const fetchDevice = async () => {
      setLoading(true);
      try {
        const response = await devicesApi.getDeviceById(Number(deviceId));
        if (cancelled) return;
        setDevice(response.data);
      } catch {
        if (cancelled) return;
        setError(t("devices.details.loadError"));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchDevice();

    return () => {
      cancelled = true;
    };
  }, [device, deviceId, t]);

  useEffect(() => {
    if (!device?.microcontroller_id) {
      setMicrocontroller(null);
      setPowerProvider(null);
      return;
    }

    let cancelled = false;

    const fetchMicrocontroller = async () => {
      try {
        const response = await microcontrollersApi.getUserMicrocontrollers();
        if (cancelled) return;

        const found =
          response.data.find(
            (entry) => entry.id === device.microcontroller_id
          ) ?? null;

        setMicrocontroller(found);
        setPowerProvider(found ? resolvePowerProvider(found) : null);
      } catch {
        if (cancelled) return;
        setMicrocontroller(null);
        setPowerProvider(null);
      }
    };

    void fetchMicrocontroller();

    return () => {
      cancelled = true;
    };
  }, [device?.microcontroller_id]);

  useEffect(() => {
    if (tab !== "telemetry") return;
    if (!device?.id) return;

    let cancelled = false;

    const fetchTelemetry = async () => {
      setLoadingEvents(true);
      setEventsError(null);
      setEventsResponse(null);

      try {
        const response = await devicesApi.getDeviceEvents(device.id, {
          limit: 1000,
          date: selectedDate,
        });

        if (cancelled) return;
        setEventsResponse(response.data);
      } catch {
        if (cancelled) return;
        setEventsError(t("devices.details.eventsError"));
      } finally {
        if (!cancelled) {
          setLoadingEvents(false);
        }
      }
    };

    void fetchTelemetry();

    return () => {
      cancelled = true;
    };
  }, [device?.id, selectedDate, tab, t]);

  useEffect(() => {
    setLiveDeviceEvents([]);
  }, [device?.id]);

  const handleLiveDeviceEvent = useCallback(
    (incomingEvent: DeviceEvent) => {
      if (!device?.id) return;
      if (incomingEvent.device_id !== device.id) return;

      const normalizedLiveEvent: DeviceEvent = {
        ...incomingEvent,
        source: "LIVE_DEVICE_EVENT",
      };

      setLiveDeviceEvents((prev) => {
        const duplicate = prev.some(
          (event) =>
            event.id === normalizedLiveEvent.id ||
            (event.created_at === normalizedLiveEvent.created_at &&
              event.event_name === normalizedLiveEvent.event_name &&
              event.pin_state === normalizedLiveEvent.pin_state)
        );

        if (duplicate) return prev;

        const next = [...prev, normalizedLiveEvent];
        return next.length > 500 ? next.slice(next.length - 500) : next;
      });
    },
    [device?.id]
  );

  const telemetryEvents = useMemo(() => {
    const historicalEvents = eventsResponse?.events ?? [];
    const merged = [...historicalEvents, ...liveDeviceEvents];
    const uniqueEvents = new Map<string, DeviceEvent>();

    merged.forEach((event) => {
      const key =
        event.id > 0
          ? `id:${event.id}`
          : `${event.created_at}:${event.pin_state}:${event.event_type}:${event.source ?? ""}`;
      uniqueEvents.set(key, event);
    });

    return [...uniqueEvents.values()].sort(
      (left, right) =>
        new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    );
  }, [eventsResponse, liveDeviceEvents]);

  const liveEventsCountForSelectedDay = useMemo(
    () =>
      liveDeviceEvents.filter((event) => {
        const eventDay = formatDateForInput(new Date(event.created_at));
        return eventDay === selectedDate;
      }).length,
    [liveDeviceEvents, selectedDate]
  );

  const formattedLastUpdate = useMemo(() => {
    if (deviceLive?.seenAt) {
      return new Date(deviceLive.seenAt).toLocaleString(locale);
    }

    if (!device?.last_state_change_at) return t("common.notAvailable");
    return new Date(device.last_state_change_at).toLocaleString(locale);
  }, [device?.last_state_change_at, deviceLive?.seenAt, locale, t]);

  const modeLabel = useMemo(() => {
    const mode = device?.mode ?? deviceLive?.mode;
    if (!mode) return t("common.notAvailable");
    if (mode === "AUTO") return t("devices.details.modes.auto");
    if (mode === "SCHEDULE") return t("devices.details.modes.schedule");
    return t("devices.details.modes.manual");
  }, [device?.mode, deviceLive?.mode, t]);

  const resolvedMode = device?.mode ?? deviceLive?.mode;

  const isOn =
    resolvedMode === "MANUAL"
      ? device?.manual_state ?? deviceLive?.isOn ?? false
      : deviceLive?.isOn ?? false;

  const stateLabel = isOn
    ? t("devices.details.stateOn")
    : t("devices.details.stateOff");

  const deviceStatusLabel =
    microLive.status === "online"
      ? t("common.online")
      : microLive.status === "offline"
        ? t("common.offline")
        : t("common.waitingForStatus");

  const microcontrollerStatusLabel =
    microLive.status === "online"
      ? t("common.online")
      : microLive.status === "offline"
        ? t("common.offline")
        : t("common.waitingForStatus");

  const microcontrollerLastSeen = microLive.lastSeen
    ? new Date(microLive.lastSeen).toLocaleString(locale)
    : t("common.notAvailable");

  const nextDayDisabled = selectedDate >= today;

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

  const handleTabChange = (
    _: SyntheticEvent,
    nextTab: "details" | "telemetry"
  ) => {
    setTab(nextTab);

    if (nextTab === "telemetry") {
      setSelectedDate(formatDateForInput(new Date()));
    }
  };

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
          <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
            GPIO {device.device_number}
          </Typography>

          <Tabs value={tab} onChange={handleTabChange} sx={{ mt: 2 }}>
            <Tab value="details" label={t("devices.details.tabs.details")} />
            <Tab value="telemetry" label={t("devices.details.tabs.telemetry")} />
          </Tabs>
        </Box>

        <Box sx={{ background: "#f6fbf8", p: 3 }}>
          {tab === "details" && (
            <Stack spacing={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <DeviceInfoTile
                    label={String(t("devices.details.live.deviceHeartbeat"))}
                    value={
                      <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <DeviceLiveStatus
                            loading={!deviceLive}
                            isOnline={Boolean(deviceLive?.isOn)}
                          />
                          <Typography variant="body2" fontWeight={600} color="#0f172a">
                            {!deviceLive
                              ? t("common.waitingForStatus")
                              : deviceLive.isOn
                                ? t("devices.details.stateOn")
                                : t("devices.details.stateOff")}
                          </Typography>
                        </Stack>

                        <Typography variant="caption" color="text.secondary">
                          {t("devices.details.live.lastHeartbeat")}: {formattedLastUpdate}
                        </Typography>
                      </Stack>
                    }
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <DeviceInfoTile
                    label={String(t("devices.details.live.microcontroller"))}
                    value={
                      <Stack spacing={0.5}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <MicrocontrollerLiveStatus
                            uuid={microcontroller?.uuid}
                            state={microLive}
                          />
                          <Typography variant="body2" fontWeight={600} color="#0f172a">
                            {microcontrollerStatusLabel}
                          </Typography>
                        </Stack>

                        <Typography variant="caption" color="text.secondary">
                          {t("providers.live.updatedAt")}: {microcontrollerLastSeen}
                        </Typography>
                      </Stack>
                    }
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <DeviceInfoTile
                    label={String(t("devices.details.live.providerPower"))}
                    value={
                      powerProvider ? (
                        <Stack spacing={0.5}>
                          <ProviderLiveEnergy
                            key={powerProvider.uuid}
                            provider={powerProvider}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {powerProvider.name}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {t("devices.details.live.noProvider")}
                        </Typography>
                      )
                    }
                  />
                </Grid>
              </Grid>

              <DeviceDetailsInfo
                device={device}
                isAutoMode={resolvedMode === "AUTO"}
                modeLabel={modeLabel}
                stateLabel={stateLabel}
                onlineLabel={deviceStatusLabel}
                formattedLastUpdate={formattedLastUpdate}
                t={t}
              />
            </Stack>
          )}

          {tab === "telemetry" && (
            <Stack spacing={2}>
              <DeviceEventLiveWidget
                deviceUuid={device.uuid}
                enabled={tab === "telemetry"}
                onEvent={handleLiveDeviceEvent}
              />

              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                    lg: "repeat(5, minmax(0, 1fr))",
                  },
                }}
              >
                <Box>
                  <DeviceInfoTile
                    label={String(t("devices.details.live.providerPower"))}
                    value={
                      powerProvider ? (
                        <Stack spacing={0.5}>
                          <ProviderLiveEnergy
                            key={powerProvider.uuid}
                            provider={powerProvider}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {powerProvider.name}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {t("devices.details.live.noProvider")}
                        </Typography>
                      )
                    }
                  />
                </Box>

                <Box>
                  <DeviceInfoTile
                    label={String(t("devices.details.fields.energy"))}
                    value={
                      eventsResponse?.energy != null && eventsResponse.energy_unit
                        ? `${eventsResponse.energy.toFixed(2)} ${eventsResponse.energy_unit}`
                        : t("common.notAvailable")
                    }
                  />
                </Box>

                <Box>
                  <DeviceInfoTile
                    label={String(
                      t("devices.details.fields.energyCost", {
                        rate: "0.62 zł/kWh",
                      })
                    )}
                    value={
                      eventsResponse?.energy != null
                        ? formatEnergyCost(eventsResponse.energy)
                        : t("common.notAvailable")
                    }
                  />
                </Box>

                <Box>
                  <DeviceInfoTile
                    label={String(t("devices.details.fields.totalMinutes"))}
                    value={
                      eventsResponse?.total_minutes_on != null
                        ? formatMinutesAsHours(eventsResponse.total_minutes_on)
                        : t("common.notAvailable")
                    }
                  />
                </Box>

                <Box>
                  <DeviceInfoTile
                    label={String(t("devices.details.fields.ratedPower"))}
                    value={
                      eventsResponse?.rated_power != null && eventsResponse.power_unit
                        ? `${eventsResponse.rated_power} ${eventsResponse.power_unit}`
                        : t("common.notAvailable")
                    }
                  />
                </Box>
              </Box>

              <TelemetryDateNavigator
                dateLabel={t("devices.details.dayLabel")}
                previousDayLabel={t("devices.details.previousDay")}
                nextDayLabel={t("devices.details.nextDay")}
                selectedDate={selectedDate}
                maxDate={today}
                nextDisabled={nextDayDisabled}
                onDateChange={handleDateChange}
                onPreviousDay={goPreviousDay}
                onNextDay={goNextDay}
              />

              <Typography variant="caption" color="text.secondary">
                {t("devices.details.live.eventsMerged", {
                  count: liveEventsCountForSelectedDay,
                })}
              </Typography>

              <DeviceTelemetryTimeline
                events={telemetryEvents}
                loading={loadingEvents}
                error={eventsError}
                tNoData={t("devices.details.noEvents")}
                selectedDate={selectedDate}
              />
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
