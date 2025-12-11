import { Box, Button, Chip, Grid, Stack, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";

const tiers = [
  {
    name: "Starter",
    price: "0 zł",
    desc: "Do testów i małych instalacji domowych.",
    features: ["1 instalacja", "Do 2 inwerterów", "Live Raspberry", "Podstawowa telemetria"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "79 zł",
    desc: "Najpopularniejszy wariant dla kilku lokalizacji.",
    features: [
      "Do 5 instalacji",
      "10 inwerterów",
      "Pełna telemetria live",
      "Alerty i timeline zdarzeń",
      "Priorytet wsparcia",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "na zapytanie",
    desc: "Dla flot urządzeń, SLA i własnych integracji.",
    features: ["Brak limitu instalacji", "Integracje custom", "SLA i HA", "Dedykowane wdrożenie"],
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Cennik
        </Typography>
        <Typography variant="subtitle1" color="rgba(232,241,248,0.8)">
          Wybierz pakiet dopasowany do skali Twojej sieci energetycznej.
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {tiers.map((tier) => (
          <Grid key={tier.name} item xs={12} md={4}>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                height: "100%",
                background: tier.highlight
                  ? "linear-gradient(150deg, rgba(15,139,111,0.28), rgba(7,17,26,0.92))"
                  : "linear-gradient(150deg, rgba(11,26,38,0.92), rgba(9,22,32,0.9))",
                border: `1px solid ${tier.highlight ? "rgba(124,255,224,0.5)" : "rgba(255,255,255,0.06)"}`,
                boxShadow: tier.highlight ? "0 18px 38px rgba(15,139,111,0.35)" : "none",
              }}
            >
              <Stack spacing={1}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {tier.name}
                  </Typography>
                  {tier.highlight && <Chip label="Najczęściej wybierany" color="secondary" size="small" />}
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                  {tier.price}
                </Typography>
                <Typography variant="body2" color="rgba(232,241,248,0.85)">
                  {tier.desc}
                </Typography>
              </Stack>

              <Stack spacing={1} mt={2} mb={3}>
                {tier.features.map((f) => (
                  <Stack key={f} direction="row" spacing={1} alignItems="center">
                    <CheckIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="rgba(232,241,248,0.85)">
                      {f}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Button variant={tier.highlight ? "contained" : "outlined"} color="primary" fullWidth>
                Wybierz
              </Button>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
