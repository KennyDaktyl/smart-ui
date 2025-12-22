import { Box, Chip, Grid, Stack, Typography } from "@mui/material";
import PrecisionManufacturingIcon from "@mui/icons-material/PrecisionManufacturing";
import DnsIcon from "@mui/icons-material/Dns";
import TimelineIcon from "@mui/icons-material/Timeline";
import LockIcon from "@mui/icons-material/Lock";
import { useTranslation } from "react-i18next";

export default function OfferPage() {
  const { t } = useTranslation();
  const cards = [
    {
      icon: <PrecisionManufacturingIcon color="secondary" />,
      title: t("front.offer.cards.devices.title"),
      desc: t("front.offer.cards.devices.desc"),
    },
    {
      icon: <DnsIcon color="info" />,
      title: t("front.offer.cards.inverters.title"),
      desc: t("front.offer.cards.inverters.desc"),
    },
    {
      icon: <TimelineIcon color="primary" />,
      title: t("front.offer.cards.telemetry.title"),
      desc: t("front.offer.cards.telemetry.desc"),
    },
    {
      icon: <LockIcon color="success" />,
      title: t("front.offer.cards.security.title"),
      desc: t("front.offer.cards.security.desc"),
    },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          {t("front.offer.title")}
        </Typography>
        <Typography variant="subtitle1" color="rgba(232,241,248,0.8)">
          {t("front.offer.subtitle")}
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
                  <Chip label={t("front.offer.live")} size="small" color="secondary" variant="outlined" />
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
