import { keyframes } from "@emotion/react";
import AutoModeIcon from "@mui/icons-material/AutoMode";
import BoltIcon from "@mui/icons-material/Bolt";
import FactoryIcon from "@mui/icons-material/Factory";
import HubIcon from "@mui/icons-material/Hub";
import MemoryIcon from "@mui/icons-material/Memory";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import {
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

type LiveDevice = {
  id: number;
  name: string;
  useCase: string;
  powerKw: number;
  isOn: boolean;
};

const sweep = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 220% 50%; }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(102, 252, 241, 0.5); }
  70% { box-shadow: 0 0 0 10px rgba(102, 252, 241, 0); }
  100% { box-shadow: 0 0 0 0 rgba(102, 252, 241, 0); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0px); }
`;

const initialDevices: LiveDevice[] = [
  {
    id: 1,
    name: "Heater A",
    useCase: "water buffer",
    powerKw: 2.8,
    isOn: true,
  },
  {
    id: 2,
    name: "Pump B",
    useCase: "circulation",
    powerKw: 1.1,
    isOn: true,
  },
  {
    id: 3,
    name: "Dryer C",
    useCase: "production line",
    powerKw: 3.5,
    isOn: false,
  },
];

const LIGHT_TEXT = "#e8f1f8";
const LIGHT_MUTED = "rgba(232,241,248,0.84)";
const LIGHT_BORDER = "rgba(232,241,248,0.32)";

export default function HomePage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isPl = i18n.language.startsWith("pl");
  const locale = isPl ? "pl-PL" : "en-US";

  const [providerPower, setProviderPower] = useState(8.1);
  const [devices, setDevices] = useState<LiveDevice[]>(initialDevices);
  const [stream, setStream] = useState<string[]>([]);

  useEffect(() => {
    const seed = [
      isPl
        ? "13:48:10 HEARTBEAT mc-core-1 ONLINE"
        : "13:48:10 HEARTBEAT mc-core-1 ONLINE",
      isPl
        ? "13:48:11 PROVIDER power=8.1 kW"
        : "13:48:11 PROVIDER power=8.1 kW",
      isPl
        ? "13:48:12 DEVICE Heater A -> ON"
        : "13:48:12 DEVICE Heater A -> ON",
    ];
    setStream(seed);

    let tick = 0;
    const timer = window.setInterval(() => {
      tick += 1;

      setProviderPower((prev) => {
        const next =
          prev + Math.sin(tick / 2.4) * 0.38 + (tick % 3 === 0 ? -0.22 : 0.15);
        return Math.max(1.8, Math.min(11.6, Number(next.toFixed(2))));
      });

      setDevices((prev) => {
        const idx = tick % prev.length;
        const next = prev.map((entry, entryIdx) =>
          entryIdx === idx ? { ...entry, isOn: !entry.isOn } : entry
        );

        const target = next[idx];
        const stamp = new Date().toLocaleTimeString(locale, {
          hour12: false,
        });

        setStream((history) => {
          const line = `${stamp} DEVICE ${target.name} -> ${target.isOn ? "ON" : "OFF"}`;
          return [line, ...history].slice(0, 6);
        });

        return next;
      });
    }, 2200);

    return () => {
      clearInterval(timer);
    };
  }, [isPl, locale]);

  const currentLoad = useMemo(
    () =>
      devices
        .filter((entry) => entry.isOn)
        .reduce((sum, entry) => sum + entry.powerKw, 0),
    [devices]
  );

  const surplus = Number((providerPower - currentLoad).toFixed(2));

  const copy = isPl
    ? {
        eyebrow: "SMART ENERGY CONTROL",
        title: "Czytamy produkcje PV i automatycznie sterujemy odbiornikami energii.",
        subtitle:
          "To platforma do odczytu mocy z providerow (falownik/API), analizy nadwyzki oraz decyzji, ktore urzadzenia wlaczyc lub wylaczyc w czasie rzeczywistym.",
        ctaPrimary: "Zobacz oferte i scenariusze",
        ctaSecondary: "Umow demo",
        whyTitle: "Po co to jest?",
        whySubtitle:
          "Aplikacja redukuje straty energii i eliminuje reczne sterowanie, gdy moc PV skacze co kilka sekund.",
        valueCards: [
          {
            title: "Realtime z produkcji",
            desc: "Caly czas widzisz aktualna moc z providera i trend godzinowy.",
          },
          {
            title: "Automatyczne decyzje",
            desc: "Silnik reguł uruchamia urzadzenia przy nadwyzce i zatrzymuje je przy spadku mocy.",
          },
          {
            title: "Sterowanie wielosektorowe",
            desc: "Dom, warsztat, male zaklady produkcyjne, obiekty uslugowe.",
          },
        ],
        flowTitle: "Jak to dziala",
        flow: [
          "Provider wysyla moc: kW i timestamp.",
          "Agent (Raspberry/mikrokontroler) raportuje heartbeat i stan pinow.",
          "Aplikacja laczy dane i ocenia warunki AUTO/SCHEDULE/MANUAL.",
          "Device eventy i telemetry sa widoczne live na dashboardzie.",
        ],
      }
    : {
        eyebrow: "SMART ENERGY CONTROL",
        title: "We read PV production and auto-control energy-consuming devices.",
        subtitle:
          "The platform reads provider power data (inverter/API), computes surplus, and decides in real time which devices should be turned on or off.",
        ctaPrimary: "See offer and scenarios",
        ctaSecondary: "Book a demo",
        whyTitle: "Why it matters",
        whySubtitle:
          "The app reduces wasted energy and removes manual switching when PV output changes every few seconds.",
        valueCards: [
          {
            title: "Production in real time",
            desc: "You always see current provider power and hourly trend.",
          },
          {
            title: "Automatic decisions",
            desc: "Rules engine starts devices on surplus and stops them when power drops.",
          },
          {
            title: "Multi-sector control",
            desc: "Homes, workshops, small factories, commercial spaces.",
          },
        ],
        flowTitle: "How it works",
        flow: [
          "Provider sends power: kW + timestamp.",
          "Agent (Raspberry/microcontroller) sends heartbeat and pin states.",
          "App evaluates AUTO/SCHEDULE/MANUAL conditions.",
          "Device events and telemetry are visible live on dashboard.",
        ],
      };

  return (
    <Stack spacing={{ xs: 3, md: 4.5 }}>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          color: LIGHT_TEXT,
          borderRadius: 4,
          p: { xs: 2.6, md: 4 },
          border: "1px solid rgba(117, 240, 208, 0.24)",
          background:
            "linear-gradient(128deg, rgba(6,17,28,0.98) 0%, rgba(9,31,43,0.95) 40%, rgba(14,82,72,0.92) 100%)",
          boxShadow: "0 32px 66px rgba(0,0,0,0.34)",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 360,
            height: 360,
            right: -130,
            top: -140,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(247,183,51,0.72) 0%, rgba(247,183,51,0.18) 60%, transparent 80%)",
            filter: "blur(6px)",
          }}
        />

        <Grid2 container spacing={{ xs: 2.5, md: 3.5 }}>
          <Grid2 size={{ xs: 12, lg: 7 }}>
            <Stack spacing={1.5} sx={{ position: "relative", zIndex: 1 }}>
              <Chip
                icon={<SolarPowerIcon />}
                label={copy.eyebrow}
                color="secondary"
                sx={{ fontWeight: 800, alignSelf: "flex-start" }}
              />

              <Typography
                variant="h3"
                sx={{
                  fontFamily: '"Sora","Manrope","Inter","Roboto",sans-serif',
                  fontWeight: 900,
                  lineHeight: 1.08,
                  color: LIGHT_TEXT,
                }}
              >
                {copy.title}
              </Typography>

              <Typography sx={{ color: LIGHT_MUTED, maxWidth: 840 }}>
                {copy.subtitle}
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <Button variant="contained" onClick={() => navigate("/offer")}>
                  {copy.ctaPrimary}
                </Button>
                <Button variant="outlined" color="secondary" onClick={() => navigate("/contact")}> 
                  {copy.ctaSecondary}
                </Button>
              </Stack>

              <Stack direction="row" flexWrap="wrap" gap={1} pt={0.5}>
                <Chip label={isPl ? "Provider API" : "Provider API"} variant="outlined" sx={{ color: LIGHT_TEXT, borderColor: LIGHT_BORDER }} />
                <Chip label="NATS live" variant="outlined" sx={{ color: LIGHT_TEXT, borderColor: LIGHT_BORDER }} />
                <Chip label={isPl ? "Device events" : "Device events"} variant="outlined" sx={{ color: LIGHT_TEXT, borderColor: LIGHT_BORDER }} />
                <Chip label="AUTO / SCHEDULE / MANUAL" variant="outlined" sx={{ color: LIGHT_TEXT, borderColor: LIGHT_BORDER }} />
              </Stack>
            </Stack>
          </Grid2>

          <Grid2 size={{ xs: 12, lg: 5 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "linear-gradient(145deg, rgba(8,23,36,0.94), rgba(8,33,45,0.9))",
              }}
            >
              <Stack spacing={1.4}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography fontWeight={700} sx={{ color: LIGHT_TEXT }}>
                    {isPl ? "Live preview" : "Live preview"}
                  </Typography>
                  <Chip
                    label={isPl ? "stream online" : "stream online"}
                    size="small"
                    color="success"
                    sx={{ animation: `${pulse} 2.1s infinite` }}
                  />
                </Stack>

                <Box
                  sx={{
                    p: 1.6,
                    borderRadius: 2,
                    border: "1px solid rgba(117,240,208,0.2)",
                    background:
                      "linear-gradient(100deg, rgba(117,240,208,0.1) 0%, rgba(247,183,51,0.16) 46%, rgba(117,240,208,0.1) 100%)",
                    backgroundSize: "220% 100%",
                    animation: `${sweep} 5s linear infinite`,
                  }}
                >
                  <Stack spacing={0.35}>
                    <Typography variant="caption" color="rgba(232,241,248,0.76)">
                      {isPl ? "Moc providera" : "Provider power"}
                    </Typography>
                    <Typography variant="h4" fontWeight={800}>
                      {providerPower.toFixed(2)} kW
                    </Typography>
                    <Typography
                      variant="body2"
                      color={surplus >= 0 ? "#66fcd1" : "#ffb4b4"}
                      fontWeight={700}
                    >
                      {isPl ? "Nadwyzka" : "Surplus"}: {surplus.toFixed(2)} kW
                    </Typography>
                  </Stack>
                </Box>

                <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

                <Stack spacing={0.8}>
                  {devices.map((device) => (
                    <Stack
                      key={device.id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        bgcolor: "rgba(255,255,255,0.03)",
                        animation: `${float} 5.6s ease-in-out ${device.id * 0.24}s infinite`,
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {device.name}
                        </Typography>
                        <Typography variant="caption" color="rgba(232,241,248,0.74)">
                          {device.useCase}
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption">{device.powerKw.toFixed(1)} kW</Typography>
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
                </Stack>

                <Box sx={{ borderTop: "1px solid rgba(255,255,255,0.12)", pt: 1 }}>
                  <Typography variant="caption" color="rgba(232,241,248,0.7)">
                    {isPl ? "Strumien eventow" : "Event stream"}
                  </Typography>
                  <Stack spacing={0.35} mt={0.5}>
                    {stream.map((line) => (
                      <Typography
                        key={line}
                        variant="caption"
                        sx={{ fontFamily: '"JetBrains Mono","Consolas",monospace', color: "rgba(232,241,248,0.86)" }}
                      >
                        {line}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Grid2>
        </Grid2>
      </Box>

      <Stack spacing={1}>
        <Typography variant="h4" fontWeight={800} sx={{ color: LIGHT_TEXT }}>
          {copy.whyTitle}
        </Typography>
        <Typography color={LIGHT_MUTED}>{copy.whySubtitle}</Typography>
      </Stack>

      <Grid2 container spacing={2}>
        {copy.valueCards.map((card, idx) => (
          <Grid2 key={card.title} size={{ xs: 12, md: 4 }}>
            <Box
              sx={{
                height: "100%",
                color: LIGHT_TEXT,
                p: 2.2,
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "linear-gradient(150deg, rgba(9,24,36,0.92), rgba(9,18,28,0.9))",
                animation: `${float} 6.3s ease-in-out ${idx * 0.34}s infinite`,
              }}
            >
              <Stack spacing={1}>
                {idx === 0 && <TrendingUpIcon color="secondary" />}
                {idx === 1 && <AutoModeIcon color="success" />}
                {idx === 2 && <FactoryIcon color="info" />}
                <Typography variant="h6" fontWeight={700}>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="rgba(232,241,248,0.78)">
                  {card.desc}
                </Typography>
              </Stack>
            </Box>
          </Grid2>
        ))}
      </Grid2>

      <Box
        sx={{
          p: { xs: 2.3, md: 3 },
          borderRadius: 3,
          background: "linear-gradient(145deg, rgba(255,255,255,0.97), #f4faf7)",
          color: "#0d1b2a",
          border: "1px solid rgba(15,139,111,0.18)",
        }}
      >
        <Stack spacing={1.2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <HubIcon color="primary" />
            <Typography variant="h6" fontWeight={800}>
              {copy.flowTitle}
            </Typography>
          </Stack>
          <Stack spacing={0.55}>
            {copy.flow.map((item) => (
              <Typography key={item} variant="body2" color="text.secondary">
                - {item}
              </Typography>
            ))}
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} pt={0.5}>
            <Button variant="contained" startIcon={<BoltIcon />} onClick={() => navigate("/offer")}>
              {isPl ? "Przejdz do oferty" : "Go to offer"}
            </Button>
            <Button variant="outlined" onClick={() => navigate("/register")}> 
              {isPl ? "Zaloz konto" : "Create account"}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}
