import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import MemoryIcon from "@mui/icons-material/Memory";
import HubIcon from "@mui/icons-material/Hub";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import PublicAppShowcase from "@/front/components/PublicAppShowcase";

export default function OfferPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isPl = i18n.language.startsWith("pl");

  return (
    <Stack spacing={3.5}>
      <Box
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          background:
            "linear-gradient(145deg, rgba(15,139,111,0.2), rgba(8,24,38,0.86))",
          border: "1px solid rgba(124,255,224,0.24)",
        }}
      >
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip icon={<ElectricBoltIcon />} label="PV Surplus Control" color="secondary" />
            <Chip icon={<MemoryIcon />} label="Raspberry + 12V contactors" variant="outlined" />
            <Chip icon={<HubIcon />} label="NATS stream" variant="outlined" />
          </Stack>

          <Typography variant="h4" fontWeight={800}>
            {isPl
              ? "Sterowanie nadwyzka energii dla instalacji prosumenckiej"
              : "Surplus-energy control for prosumer installations"}
          </Typography>

          <Typography variant="subtitle1" color="rgba(232,241,248,0.84)">
            {isPl
              ? "Pokazujemy realne widoki po zalogowaniu: dashboard urzadzen, zdarzenia device, telemetrie providera i widok mikrokontrolerow. Dane sa zamockowane pod prezentacje handlowa."
              : "You can preview real post-login screens: device dashboard, device events, provider telemetry, and microcontroller views. Data is mocked for a sales presentation."}
          </Typography>
        </Stack>
      </Box>

      <PublicAppShowcase />

      <Box
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 3,
          background: "linear-gradient(145deg, rgba(255,255,255,0.97), #f5faf7)",
          color: "#0d1b2a",
        }}
      >
        <Grid2 container spacing={2} alignItems="center">
          <Grid2 xs={12} md={8}>
            <Typography variant="h6" fontWeight={800}>
              {isPl
                ? "Sprzedaz: sterownik Raspberry do stycznikow 12V"
                : "Product focus: Raspberry controller for 12V contactors"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isPl
                ? "Na tym etapie skupiamy sie na sterowniku i panelu aplikacji. Cennik oraz klasyczna oferta pakietowa sa tymczasowo wstrzymane."
                : "At this stage we focus on the controller and app panel. Pricing tiers and classic package offers are temporarily disabled."}
            </Typography>
          </Grid2>
          <Grid2 xs={12} md={4}>
            <Stack direction={{ xs: "column", sm: "row", md: "column" }} spacing={1}>
              <Button variant="contained" onClick={() => navigate("/register")}>
                {isPl ? "Zaloz konto" : "Create account"}
              </Button>
              <Button variant="outlined" onClick={() => navigate("/contact")}>
                {isPl ? "Umow demo" : "Book a demo"}
              </Button>
            </Stack>
          </Grid2>
        </Grid2>
      </Box>
    </Stack>
  );
}
