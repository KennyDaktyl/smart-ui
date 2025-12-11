import { Box, Chip, Grid, Stack, Typography } from "@mui/material";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import DnsIcon from "@mui/icons-material/Dns";
import TimelineIcon from "@mui/icons-material/Timeline";
import LockIcon from "@mui/icons-material/Lock";

const cards = [
  {
    icon: <PrecisionManufacturingIcon color="secondary" />,
    title: "Zarządzanie urządzeniami",
    desc: "Raspberry + urządzenia, tryby pracy (manual, auto, harmonogram), status online i sterowanie.",
  },
  {
    icon: <DnsIcon color="info" />,
    title: "Integracja inwerterów",
    desc: "Moc, modele, heartbeat i przypisanie do instalacji. Współpraca z API Huawei.",
  },
  {
    icon: <TimelineIcon color="primary" />,
    title: "Telemetria",
    desc: "Strumienie websocket, timeline zdarzeń, wykresy mocy, alerty o stanie.",
  },
  {
    icon: <LockIcon color="success" />,
    title: "Bezpieczeństwo",
    desc: "JWT z odświeżaniem, kontrola ról (admin/użytkownik), separacja danych per konto.",
  },
];

export default function OfferPage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Oferta dla energetyki prosumenckiej
        </Typography>
        <Typography variant="subtitle1" color="rgba(232,241,248,0.8)">
          Kompletny stack do monitorowania i automatyzacji urządzeń PV w czasie rzeczywistym.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} key={card.title}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: "linear-gradient(150deg, rgba(11,26,38,0.92), rgba(9,22,32,0.9))",
                border: "1px solid rgba(255,255,255,0.06)",
                minHeight: 180,
              }}
            >
              <Stack spacing={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  {card.icon}
                  <Chip label="live" size="small" color="secondary" variant="outlined" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="rgba(232,241,248,0.8)">
                  {card.desc}
                </Typography>
              </Stack>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
