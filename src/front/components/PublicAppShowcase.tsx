import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import HubIcon from "@mui/icons-material/Hub";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ScheduleIcon from "@mui/icons-material/Schedule";
import MemoryIcon from "@mui/icons-material/Memory";
import InsightsIcon from "@mui/icons-material/Insights";
import TimelineIcon from "@mui/icons-material/Timeline";
import BoltIcon from "@mui/icons-material/Bolt";
import DeviceHubIcon from "@mui/icons-material/DeviceHub";
import { useTranslation } from "react-i18next";

import type { Device } from "@/features/devices/types/devicesType";
import type { DeviceEvent } from "@/features/devices/types/deviceEvents";
import type { ProviderResponse, DayEnergy } from "@/features/providers/types/userProvider";
import type { TelemetryChartPoint } from "@/features/providers/components/ProviderTelemetryChart";
import { MicrocontrollerType, type MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import type { LiveState } from "@/features/microcontrollers/hooks/useMicrocontrollerLive";
import { DeviceCard } from "@/features/devices/components/DeviceCard";
import { DeviceTelemetryTimeline } from "@/features/devices/components/DeviceTelemetryTimeline";
import { ProviderTelemetryChart } from "@/features/providers/components/ProviderTelemetryChart";
import { ProviderPowerGauge } from "@/features/dashboard/components/ProviderPowerGauge";
import { TelemetryPanel } from "@/features/providers/telemetry/components/TelemetryPanel";
import { CardShell } from "@/features/common/components/CardShell";
import { StatusBadge } from "@/features/common/components/atoms/StatusBadge";
import { MicrocontrollerMeta } from "@/features/microcontrollers/components/MicrocontrollerMeta";
import FormCard from "@/components/forms/FormCard";
import FormTextField from "@/components/forms/FormTextField";
import FormActions from "@/components/forms/FormActions";
import FormSubmitButton from "@/components/forms/FormSubmitButton";

import natsTopology from "@/assets/landing/nats-topology.svg";
import dashboardHero from "@/assets/landing/dashboard-hero.svg";
import schedulerHero from "@/assets/landing/scheduler-hero.svg";
import microcontrollersHero from "@/assets/landing/microcontrollers-hero.svg";
import telemetryHero from "@/assets/landing/telemetry-hero.svg";
import deviceEventsHero from "@/assets/landing/device-events-hero.svg";

const mockProvider: ProviderResponse = {
  id: 71,
  uuid: "provider-demo-71",
  microcontroller_id: 301,
  name: "Falownik - Dom Zachod",
  provider_type: "power",
  kind: "telemetry",
  vendor: "goodwe",
  unit: "kW",
  value_min: 0,
  value_max: 12,
  default_expected_interval_sec: 10,
  config: {},
  enabled: true,
  created_at: "2026-02-24T07:00:00Z",
  updated_at: "2026-02-24T07:00:00Z",
  last_value: {
    id: 999,
    provider_uuid: "provider-demo-71",
    measured_at: "2026-02-24T13:48:00Z",
    measured_value: 7.46,
    measured_unit: "kW",
    created_at: "2026-02-24T13:48:01Z",
  },
};

const mockDevices: Device[] = [
  {
    id: 11,
    uuid: "device-demo-11",
    name: "Grzalka bojlera 10000L",
    device_number: 1,
    rated_power: 3.5,
    mode: "AUTO",
    threshold_value: 1.6,
    scheduler_id: null,
    provider_id: mockProvider.id,
    microcontroller_id: 301,
    manual_state: false,
    last_state_change_at: "2026-02-24T12:31:00Z",
    created_at: "2026-02-24T07:00:00Z",
    updated_at: "2026-02-24T12:31:00Z",
  },
  {
    id: 12,
    uuid: "device-demo-12",
    name: "Pompa cyrkulacyjna CWU",
    device_number: 2,
    rated_power: 1.2,
    mode: "MANUAL",
    threshold_value: null,
    scheduler_id: null,
    provider_id: mockProvider.id,
    microcontroller_id: 301,
    manual_state: true,
    last_state_change_at: "2026-02-24T12:42:00Z",
    created_at: "2026-02-24T07:00:00Z",
    updated_at: "2026-02-24T12:42:00Z",
  },
  {
    id: 13,
    uuid: "device-demo-13",
    name: "Dogrzewanie magazynu ciepla",
    device_number: 3,
    rated_power: 2.4,
    mode: "SCHEDULE",
    threshold_value: null,
    scheduler_id: 5,
    provider_id: mockProvider.id,
    microcontroller_id: 301,
    manual_state: false,
    last_state_change_at: "2026-02-24T12:11:00Z",
    created_at: "2026-02-24T07:00:00Z",
    updated_at: "2026-02-24T12:11:00Z",
  },
];

const mockLiveState: Record<number, { isOn: boolean; mode?: string | null; threshold?: number | null }> = {
  11: { isOn: true, mode: "AUTO", threshold: 1.6 },
  12: { isOn: true, mode: "MANUAL", threshold: null },
  13: { isOn: false, mode: "SCHEDULE", threshold: null },
};

const demoEvents: DeviceEvent[] = [
  {
    id: 1,
    device_id: 11,
    event_type: "AUTO_TRIGGER",
    event_name: "Wlaczenie grzalki",
    device_state: "ON",
    pin_state: true,
    measured_value: 4.2,
    measured_unit: "kW",
    trigger_reason: "POWER_ABOVE_THRESHOLD",
    source: "LIVE_DEVICE_EVENT",
    created_at: "2026-02-24T09:15:00Z",
  },
  {
    id: 2,
    device_id: 11,
    event_type: "HEARTBEAT",
    event_name: "Heartbeat",
    device_state: "ON",
    pin_state: true,
    measured_value: 4.4,
    measured_unit: "kW",
    trigger_reason: null,
    source: "LIVE_HEARTBEAT",
    created_at: "2026-02-24T10:30:00Z",
  },
  {
    id: 3,
    device_id: 11,
    event_type: "ERROR",
    event_name: "Moc ponizej progu",
    device_state: "OFF",
    pin_state: false,
    measured_value: 1.9,
    measured_unit: "kW",
    trigger_reason: "POWER_DROP",
    source: "LIVE_DEVICE_EVENT",
    created_at: "2026-02-24T11:25:00Z",
  },
  {
    id: 4,
    device_id: 11,
    event_type: "STATE",
    event_name: "Wlaczenie reczne",
    device_state: "ON",
    pin_state: true,
    measured_value: 5.1,
    measured_unit: "kW",
    trigger_reason: "MANUAL_OVERRIDE",
    source: "LIVE_DEVICE_EVENT",
    created_at: "2026-02-24T12:05:00Z",
  },
  {
    id: 5,
    device_id: 11,
    event_type: "AUTO_TRIGGER",
    event_name: "Auto podtrzymanie",
    device_state: "ON",
    pin_state: true,
    measured_value: 6.7,
    measured_unit: "kW",
    trigger_reason: "POWER_ABOVE_THRESHOLD",
    source: "HISTORY",
    created_at: "2026-02-24T13:10:00Z",
  },
];

const telemetryDay: DayEnergy = {
  date: "2026-02-24",
  total_energy: 38.4,
  import_energy: 2.1,
  export_energy: 8.2,
  hours: [
    { hour: "2026-02-24T07:00:00Z", energy: 0.3 },
    { hour: "2026-02-24T08:00:00Z", energy: 0.8 },
    { hour: "2026-02-24T09:00:00Z", energy: 1.7 },
    { hour: "2026-02-24T10:00:00Z", energy: 2.4 },
    { hour: "2026-02-24T11:00:00Z", energy: 3.4 },
    { hour: "2026-02-24T12:00:00Z", energy: 4.1 },
    { hour: "2026-02-24T13:00:00Z", energy: 3.8 },
    { hour: "2026-02-24T14:00:00Z", energy: 2.9 },
    { hour: "2026-02-24T15:00:00Z", energy: 1.9 },
    { hour: "2026-02-24T16:00:00Z", energy: 1.1 },
  ],
  entries: [],
};

const telemetryPoints: TelemetryChartPoint[] = [
  { timestamp: "2026-02-24T07:05:00Z", value: 0.4 },
  { timestamp: "2026-02-24T08:30:00Z", value: 1.6 },
  { timestamp: "2026-02-24T09:15:00Z", value: 3.2 },
  { timestamp: "2026-02-24T10:20:00Z", value: 4.4 },
  { timestamp: "2026-02-24T11:10:00Z", value: 5.1 },
  { timestamp: "2026-02-24T12:05:00Z", value: 6.6 },
  { timestamp: "2026-02-24T12:45:00Z", value: 7.1 },
  { timestamp: "2026-02-24T13:20:00Z", value: 7.8 },
  { timestamp: "2026-02-24T14:00:00Z", value: 6.9 },
  { timestamp: "2026-02-24T15:10:00Z", value: 4.2 },
  { timestamp: "2026-02-24T16:00:00Z", value: 2.3 },
];

const mockMicrocontrollers: Array<{ microcontroller: MicrocontrollerResponse; live: LiveState }> = [
  {
    microcontroller: {
      id: 301,
      uuid: "mc-demo-301",
      name: "Raspberry Pi - Kotlownia",
      description: "Sterowanie stycznikami 12V i odczyt mocy providera",
      software_version: "v1.9.2",
      type: MicrocontrollerType.RASPBERRY_PI_4,
      max_devices: 6,
      devices: mockDevices,
      assigned_sensors: ["temperature", "power"],
      available_api_providers: [mockProvider],
      power_provider_id: mockProvider.id,
      power_provider: mockProvider,
      config: { provider: { uuid: mockProvider.uuid }, active_low: false, pins: [17, 27, 22] },
      enabled: true,
      created_at: "2026-02-01T08:00:00Z",
      updated_at: "2026-02-24T13:48:00Z",
    },
    live: { status: "online", lastSeen: "2026-02-24T13:48:12Z" },
  },
  {
    microcontroller: {
      id: 302,
      uuid: "mc-demo-302",
      name: "Raspberry Pi Zero - Garaz",
      description: "Niezalezny segment odbiornikow",
      software_version: "v1.8.7",
      type: MicrocontrollerType.RASPBERRY_PI_ZERO,
      max_devices: 4,
      devices: [],
      assigned_sensors: ["temperature"],
      available_api_providers: [mockProvider],
      power_provider_id: mockProvider.id,
      power_provider: mockProvider,
      config: { provider: { uuid: mockProvider.uuid }, active_low: true, pins: [5, 6, 13] },
      enabled: true,
      created_at: "2026-01-11T08:00:00Z",
      updated_at: "2026-02-24T13:45:00Z",
    },
    live: { status: "offline", lastSeen: "2026-02-24T13:10:00Z" },
  },
];

type OfferSectionProps = {
  step: string;
  icon: ReactNode;
  title: string;
  description: string;
  hero: string;
  highlights: string[];
  livePanel: ReactNode;
  demoPanel: ReactNode;
};

function OfferSection({
  step,
  icon,
  title,
  description,
  hero,
  highlights,
  livePanel,
  demoPanel,
}: OfferSectionProps) {
  return (
    <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3.5 }}>
      <Stack spacing={{ xs: 2, md: 2.8 }}>
        <Stack spacing={1.2}>
          <Stack direction="row" spacing={1.2} alignItems="center" flexWrap="wrap">
            <Chip label={step} size="small" color="secondary" />
            {icon}
          </Stack>
          <Typography variant="h4" fontWeight={800}>
            {title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {description}
          </Typography>
        </Stack>

        <Box
          component="img"
          src={hero}
          alt={title}
          sx={{ width: "100%", borderRadius: 2.75, border: "1px solid rgba(15,23,42,0.16)" }}
        />

        <Grid2 container spacing={3}>
          <Grid2 size={{ xs: 12, xl: 3 }}>
            <CardShell title="Informacje kluczowe" sx={{ minHeight: "100%" }}>
              <Stack spacing={1.1}>
                {highlights.map((item) => (
                  <Typography key={item} variant="body2" color="text.secondary">
                    - {item}
                  </Typography>
                ))}
              </Stack>
            </CardShell>
          </Grid2>

          <Grid2 size={{ xs: 12, xl: 3 }}>
            <CardShell title="Live / NATS" subtitle="strumienie realtime" sx={{ minHeight: "100%" }}>
              {livePanel}
            </CardShell>
          </Grid2>

          <Grid2 size={{ xs: 12, xl: 6 }}>
            <CardShell title="Demo UI" subtitle="realne komponenty aplikacji" sx={{ minHeight: "100%" }}>
              {demoPanel}
            </CardShell>
          </Grid2>
        </Grid2>
      </Stack>
    </Paper>
  );
}

export default function PublicAppShowcase() {
  const { t, i18n } = useTranslation();
  const isPl = i18n.language.startsWith("pl");
  const [deviceOverride, setDeviceOverride] = useState<Record<number, boolean | undefined>>({});
  const [simulatedPower, setSimulatedPower] = useState(
    mockProvider.last_value?.measured_value ?? 7.46
  );
  const [streamFrames, setStreamFrames] = useState<string[]>([]);

  const copy = useMemo(
    () =>
      isPl
        ? {
            introTitle: "Prezentacja po zalogowaniu: dashboard, live i automatyka",
            introSubtitle:
              "Oferta jest podzielona na sekcje. W kazdej sekcji masz jasny podzial: grafika, informacje kluczowe, nacisk na NATS/live oraz demo realnych komponentow UI.",
          }
        : {
            introTitle: "Post-login showcase: dashboard, live, and automation",
            introSubtitle:
              "The offer is split into clear sections. Each one has: visual hero, key info, NATS/live focus, and real UI component demo.",
          },
    [isPl]
  );

  useEffect(() => {
    setDeviceOverride({
      11: mockLiveState[11].isOn,
      12: mockLiveState[12].isOn,
      13: mockLiveState[13].isOn,
    });

    setStreamFrames([
      "13:48:12 | HEARTBEAT | mc-demo-301 | online",
      "13:48:13 | PROVIDER | provider-demo-71 | 7.46 kW",
      "13:48:14 | DEVICE | device-demo-11 | ON",
      "13:48:15 | EVENT | AUTO_TRIGGER | POWER_ABOVE_THRESHOLD",
    ]);

    let tick = 0;
    const timer = window.setInterval(() => {
      tick += 1;

      setSimulatedPower((prev) => {
        const next = prev + Math.sin(tick / 2.2) * 0.35 + (tick % 2 ? 0.18 : -0.14);
        return Math.max(1.6, Math.min(11.8, Number(next.toFixed(2))));
      });

      setDeviceOverride((prev) => {
        const target = mockDevices[tick % mockDevices.length];
        const current = prev[target.id] ?? mockLiveState[target.id].isOn;
        const nextState = !current;
        const next = { ...prev, [target.id]: nextState };

        const stamp = new Date().toLocaleTimeString(isPl ? "pl-PL" : "en-US", {
          hour12: false,
        });

        setStreamFrames((history) => {
          const row = `${stamp} | DEVICE | ${target.uuid} | ${nextState ? "ON" : "OFF"}`;
          return [row, ...history].slice(0, 5);
        });

        return next;
      });
    }, 2400);

    return () => clearInterval(timer);
  }, [isPl]);

  return (
    <Stack spacing={{ xs: 4, md: 6 }}>
      <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3.5 }}>
        <Stack spacing={1.4}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip label={isPl ? "DEMO OFERTY" : "OFFER DEMO"} color="secondary" />
            <Chip label="NATS + dashboard + device cards" variant="outlined" />
          </Stack>
          <Typography variant="h3" fontWeight={900}>
            {copy.introTitle}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {copy.introSubtitle}
          </Typography>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3.5 }}>
        <Stack spacing={2.2}>
          <Stack direction="row" spacing={1.2} alignItems="center">
            <HubIcon color="info" />
            <Typography variant="h4" fontWeight={800}>
              NATS Live Core
            </Typography>
          </Stack>
          <Box
            component="img"
            src={natsTopology}
            alt="NATS live core"
            sx={{ width: "100%", borderRadius: 2.75, border: "1px solid rgba(15,23,42,0.16)" }}
          />

          <Grid2 container spacing={3}>
            <Grid2 size={{ xs: 12, lg: 4 }}>
              <CardShell title="Tematy realtime">
                <Stack spacing={1}>
                  <Chip size="small" label="microcontroller_heartbeat" variant="outlined" />
                  <Chip size="small" label="device_state_changed" variant="outlined" />
                  <Chip size="small" label="provider_power_update" variant="outlined" />
                </Stack>
              </CardShell>
            </Grid2>
            <Grid2 size={{ xs: 12, lg: 4 }}>
              <CardShell title="Co to daje w UI">
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">- Status ON/OFF kart urzadzen odswieza sie live.</Typography>
                  <Typography variant="body2" color="text.secondary">- Countdown providera i stale data sa widoczne od razu.</Typography>
                  <Typography variant="body2" color="text.secondary">- Eventy pojawiaja sie na osi czasu bez reloadu.</Typography>
                </Stack>
              </CardShell>
            </Grid2>
            <Grid2 size={{ xs: 12, lg: 4 }}>
              <CardShell title="Symulowany strumien" subtitle="ostatnie ramki NATS">
                <Stack spacing={0.9}>
                  {streamFrames.map((row) => (
                    <Typography key={row} variant="caption">
                      {row}
                    </Typography>
                  ))}
                </Stack>
              </CardShell>
            </Grid2>
          </Grid2>
        </Stack>
      </Paper>

      <OfferSection
        step="Sekcja 1"
        icon={<DashboardIcon color="secondary" />}
        title={isPl ? "Dashboard urzadzen" : "Device dashboard"}
        description={
          isPl
            ? "Wyglad dashboardu jest blizej realnemu widokowi: karty device + moc live providera + statusy mikrokontrolerow."
            : "This section mirrors the real dashboard: device cards, provider live power, and microcontroller statuses."
        }
        hero={dashboardHero}
        highlights={
          isPl
            ? [
                "Lista twoich urzadzen w jednym miejscu.",
                "Kolo ON/OFF pokazuje stan i kontekst mocy.",
                "Progi automatyki i aktualna moc sa czytelne.",
              ]
            : [
                "All your devices in one place.",
                "ON/OFF gauge with power context.",
                "Thresholds and current power are clearly visible.",
              ]
        }
        livePanel={
          <ProviderPowerGauge
            power={simulatedPower}
            unit="kW"
            min={0}
            max={12}
            threshold={4.0}
            ratedPower={3.5}
            isOn={true}
            onLabel="ON"
            offLabel="OFF"
            pendingLabel={isPl ? "CZEKA" : "WAIT"}
            noDataLabel={isPl ? "Brak" : "No data"}
            providerPowerLabel={isPl ? "Moc produkcji teraz" : "Current production"}
            ratedPowerLabel={isPl ? "Moc urzadzenia" : "Device power"}
            rangeLabel={isPl ? "Przedzial mocy" : "Power range"}
          />
        }
        demoPanel={
          <Grid2 container spacing={2}>
            {mockDevices.map((device) => (
              <Grid2 key={device.id} size={{ xs: 12, lg: 6 }}>
                <DeviceCard
                  device={device}
                  provider={mockProvider}
                  microcontrollerStatus="online"
                  liveState={{
                    ...mockLiveState[device.id],
                    isOn: deviceOverride[device.id] ?? mockLiveState[device.id].isOn,
                  }}
                  localOverride={deviceOverride[device.id]}
                  onToggle={(current, next) =>
                    setDeviceOverride((prev) => ({ ...prev, [current.id]: next }))
                  }
                  onEdit={() => undefined}
                  onDelete={() => undefined}
                />
              </Grid2>
            ))}
          </Grid2>
        }
      />

      <OfferSection
        step="Sekcja 2"
        icon={<ScheduleIcon color="success" />}
        title={isPl ? "Harmonogramy + warunki mocy" : "Schedules + power conditions"}
        description={
          isPl
            ? "Najwazniejsza opcja automatyki: harmonogram po czasie dnia i jednoczesnie po progu mocy providera."
            : "Core automation feature: schedule by time window and provider power threshold."
        }
        hero={schedulerHero}
        highlights={
          isPl
            ? [
                "Regula: 09:00 + moc > 4.0 kW.",
                "Mozliwy tryb bez progu (samo okno czasowe).",
                "Mniej przypadkowego poboru energii z sieci.",
              ]
            : [
                "Rule: 09:00 + power > 4.0 kW.",
                "Optional no-threshold mode.",
                "Lower chance of unwanted grid import.",
              ]
        }
        livePanel={
          <Stack spacing={1.1}>
            <Chip color="success" variant="outlined" label={isPl ? "09:00 + moc > 4.0 kW -> ON" : "09:00 + power > 4.0 kW -> ON"} />
            <Chip color="warning" variant="outlined" label={isPl ? "09:00 + moc <= 4.0 kW -> CZEKAJ" : "09:00 + power <= 4.0 kW -> WAIT"} />
            <Chip color="info" variant="outlined" label={isPl ? "Tryb bez progu: tylko pora dnia" : "No-threshold mode: time only"} />
          </Stack>
        }
        demoPanel={
          <FormCard maxWidth={2000}>
            <Typography variant="h6" fontWeight={800}>
              {isPl ? "Nowy harmonogram" : "New schedule"}
            </Typography>
            <Grid2 container spacing={1.4}>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <FormTextField label={isPl ? "Nazwa harmonogramu" : "Schedule name"} defaultValue="CWU - poranny start" />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <FormTextField label={isPl ? "Powiazane urzadzenie" : "Linked device"} defaultValue="Grzalka bojlera 10000L" />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 4 }}>
                <FormTextField label="Start" defaultValue="09:00" />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 4 }}>
                <FormTextField label={isPl ? "Koniec" : "End"} defaultValue="16:00" />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 4 }}>
                <FormTextField label={isPl ? "Dni" : "Days"} defaultValue={isPl ? "pn-nd" : "Mon-Sun"} />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <FormTextField select label={isPl ? "Tryb automatyki" : "Automation mode"} defaultValue="WITH_THRESHOLD">
                  <MenuItem value="WITH_THRESHOLD">{isPl ? "Z progiem mocy" : "With power threshold"}</MenuItem>
                  <MenuItem value="WITHOUT_THRESHOLD">{isPl ? "Bez progu mocy" : "Without power threshold"}</MenuItem>
                </FormTextField>
              </Grid2>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <FormTextField label={isPl ? "Prog mocy (kW)" : "Power threshold (kW)"} defaultValue="4.0" />
              </Grid2>
            </Grid2>
            <FormActions align="start">
              <FormSubmitButton startIcon={<BoltIcon />}>
                {isPl ? "Symuluj zapis harmonogramu" : "Simulate schedule save"}
              </FormSubmitButton>
            </FormActions>
          </FormCard>
        }
      />

      <OfferSection
        step="Sekcja 3"
        icon={<MemoryIcon color="primary" />}
        title={isPl ? "Mikrokontrolery i onboard urzadzen" : "Microcontrollers and device onboarding"}
        description={
          isPl
            ? "Sekcja pokazuje realny wyglad kart Raspberry oraz formularz dodawania urzadzenia do konkretnego kontrolera."
            : "This section shows real Raspberry cards and the add-device workflow."
        }
        hero={microcontrollersHero}
        highlights={
          isPl
            ? [
                "Status online/offline dla kazdego Raspberry.",
                "Widoczne GPIO i limity urzadzen.",
                "Szybkie dodanie nowego odbiornika.",
              ]
            : [
                "Online/offline status per Raspberry.",
                "GPIO and device capacity visibility.",
                "Fast add-device workflow.",
              ]
        }
        livePanel={
          <Stack spacing={1.1}>
            {mockMicrocontrollers.map(({ microcontroller, live }) => (
              <Stack key={microcontroller.uuid} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="caption">{microcontroller.name}</Typography>
                <StatusBadge status={live.status} />
              </Stack>
            ))}
          </Stack>
        }
        demoPanel={
          <Grid2 container spacing={2.1}>
            <Grid2 size={{ xs: 12, lg: 6 }}>
              <Stack spacing={1.5}>
                {mockMicrocontrollers.map(({ microcontroller, live }) => (
                  <CardShell
                    key={microcontroller.uuid}
                    title={microcontroller.name}
                    subtitle={microcontroller.type}
                    visualState={live.status === "offline" ? "offline" : "default"}
                    actions={<StatusBadge status={live.status} />}
                  >
                    <MicrocontrollerMeta microcontroller={microcontroller} live={live} />
                    <Divider sx={{ my: 1.4 }} />
                    <Typography variant="body2" color="text.secondary">
                      GPIO: {microcontroller.config?.pins?.join(", ")}
                    </Typography>
                  </CardShell>
                ))}
              </Stack>
            </Grid2>
            <Grid2 size={{ xs: 12, lg: 6 }}>
              <FormCard maxWidth={2200}>
                <Typography variant="h6" fontWeight={800}>
                  {isPl ? "Dodaj nowe urzadzenie" : "Add new device"}
                </Typography>
                <FormTextField label={isPl ? "Nazwa urzadzenia" : "Device name"} defaultValue="Dogrzewanie podlogowe" />
                <FormTextField select label={isPl ? "Tryb pracy" : "Mode"} defaultValue="AUTO">
                  <MenuItem value="AUTO">AUTO</MenuItem>
                  <MenuItem value="MANUAL">MANUAL</MenuItem>
                  <MenuItem value="SCHEDULE">SCHEDULE</MenuItem>
                </FormTextField>
                <FormTextField label={isPl ? "Numer GPIO" : "GPIO number"} defaultValue="4" />
                <FormTextField label={isPl ? "Moc znamionowa (kW)" : "Rated power (kW)"} defaultValue="2.8" />
                <FormActions align="start">
                  <FormSubmitButton startIcon={<DeviceHubIcon />}>
                    {isPl ? "Symuluj dodanie urzadzenia" : "Simulate device add"}
                  </FormSubmitButton>
                </FormActions>
              </FormCard>
            </Grid2>
          </Grid2>
        }
      />

      <OfferSection
        step="Sekcja 4"
        icon={<InsightsIcon color="info" />}
        title={isPl ? "Telemetria providera live" : "Provider telemetry live"}
        description={
          isPl
            ? "Tu pokazujesz klientowi wykresy mocy: portfel godzinowy + linia wpisow realtime + status live providera."
            : "Show clients power charts: hourly portfolio + realtime line entries + live provider status."
        }
        hero={telemetryHero}
        highlights={
          isPl
            ? [
                "Wykres godzinowy produkcji energii.",
                "Wykres liniowy aktualnych wpisow mocy.",
                "Widoczne opoznienia/stale dane (live status).",
              ]
            : [
                "Hourly production portfolio chart.",
                "Line chart of current power entries.",
                "Stale/live status visibility.",
              ]
        }
        livePanel={
          <ProviderPowerGauge
            power={simulatedPower}
            unit="kW"
            min={0}
            max={12}
            threshold={4.0}
            ratedPower={3.5}
            isOn={true}
            onLabel="ON"
            offLabel="OFF"
            pendingLabel={isPl ? "CZEKA" : "WAIT"}
            noDataLabel={isPl ? "Brak" : "No data"}
            providerPowerLabel={isPl ? "Moc providera" : "Provider power"}
            ratedPowerLabel={isPl ? "Moc urzadzenia" : "Device power"}
          />
        }
        demoPanel={
          <TelemetryPanel
            title={isPl ? "Telemetria live" : "Live telemetry"}
            providerName={mockProvider.name}
            contentSx={{ p: { xs: 1.5, md: 2 } }}
          >
            <ProviderTelemetryChart
              day={telemetryDay}
              points={telemetryPoints}
              unit="kW"
              noDataLabel={t("common.notAvailable")}
              noEntriesLabel={isPl ? "Brak punktow" : "No points"}
            />
          </TelemetryPanel>
        }
      />

      <OfferSection
        step="Sekcja 5"
        icon={<TimelineIcon color="warning" />}
        title={isPl ? "Device events - historia decyzji live" : "Device events - live decision history"}
        description={
          isPl
            ? "Ostatnia sekcja pokazuje co i kiedy urzadzenie zrobilo: AUTO, MANUAL, HEARTBEAT oraz sytuacje brakujacej mocy."
            : "Final section: what happened and why - AUTO, MANUAL, HEARTBEAT, and low-power situations."
        }
        hero={deviceEventsHero}
        highlights={
          isPl
            ? [
                "Pelna os czasu eventow urzadzenia.",
                "Filtry typow zdarzen i zoom.",
                "Czytelna analiza triggerow automatyki.",
              ]
            : [
                "Complete device event timeline.",
                "Event filters and zoom.",
                "Clear automation-trigger analysis.",
              ]
        }
        livePanel={
          <Stack spacing={1}>
            <Typography variant="caption">13:48:15 AUTO_TRIGGER POWER_ABOVE_THRESHOLD</Typography>
            <Typography variant="caption">13:47:52 HEARTBEAT device-demo-11</Typography>
            <Typography variant="caption">13:46:08 ERROR POWER_DROP</Typography>
          </Stack>
        }
        demoPanel={
          <DeviceTelemetryTimeline
            events={demoEvents}
            loading={false}
            error={null}
            tNoData={isPl ? "Brak zdarzen" : "No events"}
            selectedDate="2026-02-24"
          />
        }
      />

      <Paper sx={{ p: { xs: 2.6, md: 3.2 }, borderRadius: 3.5 }}>
        <Stack spacing={1.4}>
          <Typography variant="h5" fontWeight={800}>
            {isPl ? "Co jest najwazniejsze w ofercie" : "What matters most in this offer"}
          </Typography>
          <Typography color="text.secondary">
            {isPl
              ? "Klient nie widzi przypadkowej makiety. Widzi strukture aplikacji po logowaniu: realtime z NATS, dashboard z kartami device, automatyke harmonogramow, telemetrie i eventy live."
              : "Users see real post-login structure: NATS realtime, dashboard device cards, schedule automation, telemetry, and live events."}
          </Typography>
          <Button variant="contained" sx={{ alignSelf: "flex-start" }}>
            {isPl ? "To jest serce aplikacji" : "This is the product core"}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
