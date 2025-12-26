import { Box, Chip, Stack, Typography } from "@mui/material";
import Grid2 from "@mui/material/Grid2";

import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import DnsIcon from "@mui/icons-material/Dns";
import TimelineIcon from "@mui/icons-material/Timeline";
import LockIcon from "@mui/icons-material/Lock";

import { useTranslation } from "react-i18next";
import AuthPanel from "@/front/components/AuthPanel";

export default function OfferPage() {
  const { t } = useTranslation();

  const cards = [
    {
      icon: <PrecisionManufacturingIcon color="secondary" />,
      title: t("offer.cards.devices.title"),
      desc: t("offer.cards.devices.desc"),
    },
    {
      icon: <DnsIcon color="info" />,
      title: t("offer.cards.inverters.title"),
      desc: t("offer.cards.inverters.desc"),
    },
    {
      icon: <TimelineIcon color="primary" />,
      title: t("offer.cards.telemetry.title"),
      desc: t("offer.cards.telemetry.desc"),
    },
    {
      icon: <LockIcon color="success" />,
      title: t("offer.cards.security.title"),
      desc: t("offer.cards.security.desc"),
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
              {t("offer.title")}
            </Typography>
            <Typography variant="subtitle1" color="rgba(232,241,248,0.8)">
              {t("offer.subtitle")}
            </Typography>
          </Box>

          <Grid2 container spacing={2.5}>
            {cards.map((card) => (
              <Grid2 key={card.title} xs={12} sm={6}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    minHeight: 180,
                    background:
                      "linear-gradient(150deg, rgba(11,26,38,0.92), rgba(9,22,32,0.9))",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {card.icon}
                      <Chip
                        label={t("offer.live")}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Box>

                    <Typography variant="h6" fontWeight={700}>
                      {card.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="rgba(232,241,248,0.8)"
                    >
                      {card.desc}
                    </Typography>
                  </Stack>
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
