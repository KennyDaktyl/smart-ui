import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import Grid2 from "@mui/material/Grid2";
import CheckIcon from "@mui/icons-material/Check";
import { useTranslation } from "react-i18next";

import AuthPanel from "@/front/components/AuthPanel";

export default function PricingPage() {
  const { t } = useTranslation();

  const tiers = [
    {
      name: t("pricing.tiers.starter.name"),
      price: t("pricing.tiers.starter.price"),
      desc: t("pricing.tiers.starter.desc"),
      features: [
        t("pricing.tiers.starter.features.installations"),
        t("pricing.tiers.starter.features.inverters"),
        t("pricing.tiers.starter.features.raspberry"),
        t("pricing.tiers.starter.features.telemetry"),
      ],
      highlight: false,
    },
    {
      name: t("pricing.tiers.pro.name"),
      price: t("pricing.tiers.pro.price"),
      desc: t("pricing.tiers.pro.desc"),
      features: [
        t("pricing.tiers.pro.features.installations"),
        t("pricing.tiers.pro.features.inverters"),
        t("pricing.tiers.pro.features.telemetry"),
        t("pricing.tiers.pro.features.alerts"),
        t("pricing.tiers.pro.features.support"),
      ],
      highlight: true,
    },
    {
      name: t("pricing.tiers.enterprise.name"),
      price: t("pricing.tiers.enterprise.price"),
      desc: t("pricing.tiers.enterprise.desc"),
      features: [
        t("pricing.tiers.enterprise.features.unlimited"),
        t("pricing.tiers.enterprise.features.integrations"),
        t("pricing.tiers.enterprise.features.sla"),
        t("pricing.tiers.enterprise.features.onboarding"),
      ],
      highlight: false,
    },
  ];

  return (
    <Stack
      spacing={{ xs: 3, lg: 4 }}
      direction={{ xs: "column", lg: "row" }}
      alignItems="stretch"
    >
      <Box sx={{ flex: 1 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={800} mb={1}>
              {t("pricing.title")}
            </Typography>
            <Typography variant="subtitle1" color="rgba(232,241,248,0.8)">
              {t("pricing.subtitle")}
            </Typography>
          </Box>

          <Grid2 container spacing={2.5}>
            {tiers.map((tier) => (
              <Grid2 key={tier.name} xs={12} md={4}>
                <Box
                  sx={{
                    p: 3,
                    height: "100%",
                    borderRadius: 3,
                    background: tier.highlight
                      ? "linear-gradient(150deg, rgba(15,139,111,0.28), rgba(7,17,26,0.92))"
                      : "linear-gradient(150deg, rgba(11,26,38,0.92), rgba(9,22,32,0.9))",
                    border: `1px solid ${
                      tier.highlight
                        ? "rgba(124,255,224,0.5)"
                        : "rgba(255,255,255,0.06)"
                    }`,
                    boxShadow: tier.highlight
                      ? "0 18px 38px rgba(15,139,111,0.35)"
                      : "none",
                  }}
                >
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" fontWeight={800}>
                        {tier.name}
                      </Typography>
                      {tier.highlight && (
                        <Chip
                          label={t("pricing.highlight")}
                          color="secondary"
                          size="small"
                        />
                      )}
                    </Box>

                    <Typography variant="h4" fontWeight={800}>
                      {tier.price}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="rgba(232,241,248,0.85)"
                    >
                      {tier.desc}
                    </Typography>
                  </Stack>

                  <Stack spacing={1} mt={2} mb={3}>
                    {tier.features.map((feature) => (
                      <Stack
                        key={feature}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <CheckIcon color="success" fontSize="small" />
                        <Typography
                          variant="body2"
                          color="rgba(232,241,248,0.85)"
                        >
                          {feature}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Button
                    variant={tier.highlight ? "contained" : "outlined"}
                    color="primary"
                    fullWidth
                  >
                    {t("pricing.select")}
                  </Button>
                </Box>
              </Grid2>
            ))}
          </Grid2>
        </Stack>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          width: { xs: "100%", lg: 360 },
        }}
      >
        <AuthPanel />
      </Box>
    </Stack>
  );
}
