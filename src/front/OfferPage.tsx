import { keyframes } from "@emotion/react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import BoltIcon from "@mui/icons-material/Bolt";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import DeviceHubIcon from "@mui/icons-material/DeviceHub";
import InsightsIcon from "@mui/icons-material/Insights";
import MemoryIcon from "@mui/icons-material/Memory";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import TuneIcon from "@mui/icons-material/Tune";
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import PublicAppShowcase from "@/front/components/PublicAppShowcase";

type OfferDevice = {
  id: number;
  name: string;
  mode: "AUTO" | "SCHEDULE" | "MANUAL";
  isOn: boolean;
  threshold: number;
};

const shimmer = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`;

const ring = keyframes`
  0% { transform: scale(0.96); opacity: 0.55; }
  70% { transform: scale(1.08); opacity: 0; }
  100% { transform: scale(1.08); opacity: 0; }
`;

const initialOfferDevices: OfferDevice[] = [
  { id: 1, name: "Buffer heater", mode: "AUTO", isOn: true, threshold: 3.8 },
  { id: 2, name: "Line pump", mode: "SCHEDULE", isOn: true, threshold: 0 },
  { id: 3, name: "Ventilation", mode: "AUTO", isOn: false, threshold: 5.2 },
];

const LIGHT_TEXT = "#e8f1f8";
const LIGHT_MUTED = "rgba(232,241,248,0.84)";
const LIGHT_BORDER = "rgba(232,241,248,0.32)";

export default function OfferPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isPl = i18n.language.startsWith("pl");
  const locale = isPl ? "pl-PL" : "en-US";

  const [providerPower, setProviderPower] = useState(7.7);
  const [devices, setDevices] = useState<OfferDevice[]>(initialOfferDevices);
  const [stream, setStream] = useState<string[]>([]);
  const [history, setHistory] = useState<number[]>([6.8, 7.2, 7.6, 7.4, 7.9, 8.1, 7.7]);

  useEffect(() => {
    setStream([
      isPl ? "13:48:10 PROVIDER 7.70 kW" : "13:48:10 PROVIDER 7.70 kW",
      isPl ? "13:48:11 DEVICE Buffer heater ON" : "13:48:11 DEVICE Buffer heater ON",
      isPl ? "13:48:12 EVENT AUTO_TRIGGER" : "13:48:12 EVENT AUTO_TRIGGER",
    ]);

    let tick = 0;
    const timer = window.setInterval(() => {
      tick += 1;

      setProviderPower((prev) => {
        const next = prev + Math.sin(tick / 2.1) * 0.42 + (tick % 2 === 0 ? 0.22 : -0.18);
        const normalized = Math.max(1.4, Math.min(11.8, Number(next.toFixed(2))));

        setHistory((prevHistory) => [...prevHistory.slice(-11), normalized]);
        return normalized;
      });

      setDevices((prevDevices) => {
        const idx = tick % prevDevices.length;
        const nextDevices = prevDevices.map((entry, entryIdx) =>
          entryIdx === idx ? { ...entry, isOn: !entry.isOn } : entry
        );

        const changed = nextDevices[idx];
        const stamp = new Date().toLocaleTimeString(locale, { hour12: false });
        const reason =
          changed.mode === "AUTO"
            ? changed.isOn
              ? "POWER_ABOVE_THRESHOLD"
              : "POWER_DROP"
            : "SCHEDULE_WINDOW";

        setStream((prevStream) => {
          const line = `${stamp} ${changed.name} -> ${changed.isOn ? "ON" : "OFF"} (${reason})`;
          return [line, ...prevStream].slice(0, 8);
        });

        return nextDevices;
      });
    }, 2100);

    return () => clearInterval(timer);
  }, [isPl, locale]);

  const activeLoad = useMemo(
    () =>
      devices
        .filter((entry) => entry.isOn)
        .reduce((sum, entry) => sum + (entry.mode === "AUTO" ? 2.2 : 1.1), 0),
    [devices]
  );

  const surplus = Number((providerPower - activeLoad).toFixed(2));

  const copy = isPl
    ? {
        heroTitle: "Oferta: od odczytu produkcji PV do inteligentnego sterowania odbiornikami.",
        heroSubtitle:
          "To nie jest tylko dashboard. To pelny workflow: provider power -> reguly -> decyzja ON/OFF -> eventy i telemetry live.",
        whoTitle: "Dla kogo jest ta aplikacja",
        whoItems: [
          "Instalacje prosumenckie i domy energooszczedne",
          "Warsztaty i male zaklady z niestabilnym profilem poboru",
          "Obiekty uslugowe, ktore chca wykorzystac nadwyzke energii",
        ],
        modulesTitle: "Co dostajesz w systemie",
        phasesTitle: "Jak wdrazamy",
        ctaTitle: "Chcesz pokazac klientowi realny przeplyw decyzji, a nie statyczne mockupy?",
      }
    : {
        heroTitle: "Offer: from PV production reading to intelligent device control.",
        heroSubtitle:
          "Not just a dashboard. Full workflow: provider power -> rules -> ON/OFF decisions -> live events and telemetry.",
        whoTitle: "Who this app is for",
        whoItems: [
          "Prosumer installations and energy-efficient homes",
          "Workshops and small plants with unstable power demand",
          "Commercial spaces that want to use energy surplus efficiently",
        ],
        modulesTitle: "What you get",
        phasesTitle: "Implementation flow",
        ctaTitle: "Need to show real decision flow, not static mockups?",
      };

  const modules = isPl
    ? [
        {
          icon: <InsightsIcon color="secondary" />,
          title: "Provider telemetry",
          desc: "Odczyt mocy z falownika/API i wizualizacja trendu.",
        },
        {
          icon: <MemoryIcon color="info" />,
          title: "Agent / mikrokontroler",
          desc: "Heartbeat, status online, diagnostyka i komendy.",
        },
        {
          icon: <TuneIcon color="success" />,
          title: "Silnik reguł",
          desc: "AUTO, SCHEDULE, MANUAL + progi mocy.",
        },
        {
          icon: <DeviceHubIcon color="primary" />,
          title: "Sterowanie urządzeniami",
          desc: "Precyzyjne ON/OFF dla wielu sektorow i odbiornikow.",
        },
        {
          icon: <BoltIcon color="warning" />,
          title: "Eventy live",
          desc: "Pelna historia decyzji i triggerow automatyki.",
        },
        {
          icon: <BusinessCenterIcon color="secondary" />,
          title: "Panel operacyjny",
          desc: "Dashboard + admin + telemetria dla zespolu i klienta.",
        },
      ]
    : [
        {
          icon: <InsightsIcon color="secondary" />,
          title: "Provider telemetry",
          desc: "Read inverter/API power and visualize trend.",
        },
        {
          icon: <MemoryIcon color="info" />,
          title: "Agent / microcontroller",
          desc: "Heartbeat, online status, diagnostics and commands.",
        },
        {
          icon: <TuneIcon color="success" />,
          title: "Rules engine",
          desc: "AUTO, SCHEDULE, MANUAL + power thresholds.",
        },
        {
          icon: <DeviceHubIcon color="primary" />,
          title: "Device orchestration",
          desc: "Precise ON/OFF control across multiple sectors.",
        },
        {
          icon: <BoltIcon color="warning" />,
          title: "Live events",
          desc: "Full decision history and automation triggers.",
        },
        {
          icon: <BusinessCenterIcon color="secondary" />,
          title: "Operational panel",
          desc: "Dashboard + admin + telemetry for team and clients.",
        },
      ];

  const phases = isPl
    ? [
        "1. Audyt punktow poboru i zrodel produkcji",
        "2. Konfiguracja providerow, progow i trybow pracy",
        "3. Uruchomienie agenta + mapowanie urzadzen",
        "4. Testy live i przekazanie panelu operacyjnego",
      ]
    : [
        "1. Audit consumption points and production sources",
        "2. Configure providers, thresholds and modes",
        "3. Launch agent + map devices",
        "4. Live testing and handover of operations panel",
      ];

  return (
    <Stack spacing={{ xs: 3.5, md: 5 }}>
      <Box
        sx={{
          position: "relative",
          color: LIGHT_TEXT,
          p: { xs: 2.6, md: 3.8 },
          borderRadius: 4,
          background:
            "linear-gradient(135deg, rgba(6,17,27,0.98) 0%, rgba(7,35,49,0.96) 45%, rgba(14,78,68,0.9) 100%)",
          border: "1px solid rgba(117,240,208,0.22)",
          boxShadow: "0 28px 58px rgba(0,0,0,0.33)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: "auto -22% -42% auto",
            width: 520,
            height: 520,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(247,183,51,0.42) 0%, rgba(247,183,51,0.12) 55%, transparent 78%)",
          }}
        />

        <Stack spacing={1.4} sx={{ position: "relative", zIndex: 1 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip icon={<SolarPowerIcon />} label="PV + provider" color="secondary" />
            <Chip icon={<AutoAwesomeIcon />} label="AUTO decisions" variant="outlined" sx={{ color: LIGHT_TEXT, borderColor: LIGHT_BORDER }} />
            <Chip icon={<DeviceHubIcon />} label="device orchestration" variant="outlined" sx={{ color: LIGHT_TEXT, borderColor: LIGHT_BORDER }} />
          </Stack>

          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Sora","Manrope","Inter","Roboto",sans-serif',
              fontWeight: 900,
              lineHeight: 1.08,
              color: LIGHT_TEXT,
            }}
          >
            {copy.heroTitle}
          </Typography>

          <Typography color={LIGHT_MUTED}>{copy.heroSubtitle}</Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.1}>
            <Button variant="contained" onClick={() => navigate("/register")}> 
              {isPl ? "Zaloz konto" : "Create account"}
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => navigate("/contact")}> 
              {isPl ? "Umow demo" : "Book demo"}
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box
        sx={{
          p: { xs: 2.2, md: 2.8 },
          borderRadius: 3.4,
          background: "linear-gradient(152deg, rgba(255,255,255,0.98), #f4faf7)",
          color: "#0d1b2a",
          border: "1px solid rgba(15,139,111,0.16)",
        }}
      >
        <Stack spacing={1.1}>
          <Typography variant="h5" fontWeight={800}>
            {copy.whoTitle}
          </Typography>
          {copy.whoItems.map((item) => (
            <Typography key={item} variant="body2" color="text.secondary">
              - {item}
            </Typography>
          ))}
        </Stack>
      </Box>

      <Stack spacing={1.3}>
        <Typography variant="h4" fontWeight={800} sx={{ color: LIGHT_TEXT }}>
          {copy.modulesTitle}
        </Typography>
        <Grid2 container spacing={2}>
          {modules.map((module) => (
            <Grid2 key={module.title} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Box
                sx={{
                  color: LIGHT_TEXT,
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "linear-gradient(160deg, rgba(9,24,36,0.92), rgba(8,18,29,0.9))",
                  height: "100%",
                }}
              >
                <Stack spacing={1}>
                  {module.icon}
                  <Typography variant="h6" fontWeight={700}>
                    {module.title}
                  </Typography>
                  <Typography variant="body2" color={LIGHT_MUTED}>
                    {module.desc}
                  </Typography>
                </Stack>
              </Box>
            </Grid2>
          ))}
        </Grid2>
      </Stack>

      <Box
        sx={{
          color: LIGHT_TEXT,
          p: { xs: 2.2, md: 3 },
          borderRadius: 3.4,
          border: "1px solid rgba(117,240,208,0.2)",
          background: "linear-gradient(145deg, rgba(8,24,36,0.96), rgba(10,38,49,0.92))",
        }}
      >
        <Grid2 container spacing={2.2}>
          <Grid2 size={{ xs: 12, lg: 5 }}>
            <Stack spacing={1.1}>
              <Typography variant="h6" fontWeight={800}>
                {isPl ? "Symulacja: provider + decyzje ON/OFF" : "Simulation: provider + ON/OFF decisions"}
              </Typography>

              <Box
                sx={{
                  p: 1.4,
                  borderRadius: 2,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background:
                    "linear-gradient(110deg, rgba(117,240,208,0.12) 0%, rgba(247,183,51,0.2) 46%, rgba(117,240,208,0.12) 100%)",
                  backgroundSize: "220% 100%",
                  animation: `${shimmer} 5.4s linear infinite`,
                }}
              >
                <Typography variant="caption" color="rgba(232,241,248,0.74)">
                  {isPl ? "Moc providera" : "Provider power"}
                </Typography>
                <Typography variant="h4" fontWeight={900}>
                  {providerPower.toFixed(2)} kW
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={surplus >= 0 ? "#66fcd1" : "#ffb4b4"}
                >
                  {isPl ? "Nadwyzka" : "Surplus"}: {surplus.toFixed(2)} kW
                </Typography>
              </Box>

              <Stack direction="row" spacing={0.5} alignItems="flex-end" sx={{ height: 72 }}>
                {history.map((point, idx) => (
                  <Box
                    key={`${idx}-${point}`}
                    sx={{
                      flex: 1,
                      borderRadius: 1,
                      minHeight: 8,
                      height: `${Math.max(8, point * 8)}px`,
                      bgcolor: "rgba(117,240,208,0.65)",
                    }}
                  />
                ))}
              </Stack>
            </Stack>
          </Grid2>

          <Grid2 size={{ xs: 12, lg: 7 }}>
            <Stack spacing={1}>
              {devices.map((device) => (
                <Stack
                  key={device.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Stack spacing={0.1}>
                    <Typography variant="body2" fontWeight={700}>
                      {device.name}
                    </Typography>
                    <Typography variant="caption" color="rgba(232,241,248,0.72)">
                      mode: {device.mode}
                      {device.mode === "AUTO" ? ` | threshold: ${device.threshold} kW` : ""}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: device.isOn ? "#66fcd1" : "#95a2af",
                        position: "relative",
                        "&::after": device.isOn
                          ? {
                              content: '""',
                              position: "absolute",
                              inset: -4,
                              borderRadius: "50%",
                              border: "1px solid rgba(102,252,209,0.5)",
                              animation: `${ring} 1.8s ease-out infinite`,
                            }
                          : {},
                      }}
                    />
                    <Chip
                      size="small"
                      label={device.isOn ? "ON" : "OFF"}
                      color={device.isOn ? "success" : "default"}
                      variant={device.isOn ? "filled" : "outlined"}
                      sx={
                        device.isOn
                          ? undefined
                          : { color: LIGHT_TEXT, borderColor: LIGHT_BORDER }
                      }
                    />
                  </Stack>
                </Stack>
              ))}

              <Box sx={{ mt: 0.6, pt: 0.8, borderTop: "1px solid rgba(255,255,255,0.12)" }}>
                <Typography variant="caption" color="rgba(232,241,248,0.74)">
                  {isPl ? "Strumien eventow live" : "Live event stream"}
                </Typography>
                <Stack spacing={0.4} mt={0.5}>
                  {stream.map((line) => (
                    <Typography
                      key={line}
                      variant="caption"
                      sx={{ fontFamily: '"JetBrains Mono","Consolas",monospace', color: "rgba(232,241,248,0.9)" }}
                    >
                      {line}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Grid2>
        </Grid2>
      </Box>

      <Box
        sx={{
          p: { xs: 2.3, md: 3 },
          borderRadius: 3.4,
          background: "linear-gradient(145deg, rgba(255,255,255,0.97), #f4faf7)",
          color: "#0d1b2a",
          border: "1px solid rgba(15,139,111,0.18)",
        }}
      >
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight={800}>
            {copy.phasesTitle}
          </Typography>
          {phases.map((phase) => (
            <Typography key={phase} variant="body2" color="text.secondary">
              {phase}
            </Typography>
          ))}
        </Stack>
      </Box>

      <Stack spacing={1.1}>
        <Typography variant="h4" fontWeight={900} sx={{ color: LIGHT_TEXT }}>
          {isPl ? "Widoki aplikacji (demo funkcjonalne)" : "Application views (functional demo)"}
        </Typography>
        <Typography color={LIGHT_MUTED}>
          {isPl
            ? "Ponizej widzisz przekroj paneli: dashboard, harmonogramy, mikrokontrolery, telemetria i eventy device."
            : "Below you can explore dashboard, schedules, microcontrollers, telemetry and device events."}
        </Typography>
      </Stack>

      <PublicAppShowcase />

      <Box
        sx={{
          color: LIGHT_TEXT,
          p: { xs: 2.5, md: 3 },
          borderRadius: 3.4,
          border: "1px solid rgba(117,240,208,0.22)",
          background:
            "linear-gradient(140deg, rgba(8,28,40,0.96), rgba(10,44,58,0.92) 48%, rgba(14,83,73,0.9) 100%)",
        }}
      >
        <Stack spacing={1.1}>
          <Typography variant="h5" fontWeight={900}>
            {copy.ctaTitle}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button variant="contained" onClick={() => navigate("/contact")}> 
              {isPl ? "Umow rozmowe" : "Book a call"}
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => navigate("/register")}> 
              {isPl ? "Przetestuj aplikacje" : "Try the app"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
