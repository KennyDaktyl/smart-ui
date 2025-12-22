import { Box, Button, Chip, Grid, Stack, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { useTranslation } from "react-i18next";

export default function PricingPage() {
  const { t } = useTranslation();
  const tiers = [
    {
      name: t("front.pricing.tiers.starter.name"),
      price: t("front.pricing.tiers.starter.price"),
      desc: t("front.pricing.tiers.starter.desc"),
      features: [
        t("front.pricing.tiers.starter.features.installations"),
        t("front.pricing.tiers.starter.features.inverters"),
        t("front.pricing.tiers.starter.features.raspberry"),
        t("front.pricing.tiers.starter.features.telemetry"),
      ],
      highlight: false,
    },
    {
      name: t("front.pricing.tiers.pro.name"),
      price: t("front.pricing.tiers.pro.price"),
      desc: t("front.pricing.tiers.pro.desc"),
      features: [
        t("front.pricing.tiers.pro.features.installations"),
        t("front.pricing.tiers.pro.features.inverters"),
        t("front.pricing.tiers.pro.features.telemetry"),
        t("front.pricing.tiers.pro.features.alerts"),
        t("front.pricing.tiers.pro.features.support"),
      ],
      highlight: true,
    },
    {
      name: t("front.pricing.tiers.enterprise.name"),
      price: t("front.pricing.tiers.enterprise.price"),
      desc: t("front.pricing.tiers.enterprise.desc"),
      features: [
        t("front.pricing.tiers.enterprise.features.unlimited"),
        t("front.pricing.tiers.enterprise.features.integrations"),
        t("front.pricing.tiers.enterprise.features.sla"),
        t("front.pricing.tiers.enterprise.features.onboarding"),
      ],
      highlight: false,
    },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          {t("front.pricing.title")}
        </Typography>
        <Typography variant="subtitle1" color="rgba(232,241,248,0.8)">
          {t("front.pricing.subtitle")}
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
                  {tier.highlight && (
                    <Chip label={t("front.pricing.highlight")} color="secondary" size="small" />
                  )}
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
                {t("front.pricing.select")}
              </Button>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
