import { Box, Chip, Grid, Stack, Typography } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import ScheduleIcon from "@mui/icons-material/Schedule";
import WifiIcon from "@mui/icons-material/Wifi";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import { keyframes } from "@emotion/react";
import { useTranslation } from "react-i18next";

const glowOrbit = keyframes`
  0% { transform: rotate(0deg) scale(1); opacity: 0.8; }
  50% { transform: rotate(180deg) scale(1.05); opacity: 1; }
  100% { transform: rotate(360deg) scale(1); opacity: 0.8; }
`;

const flowLine = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`;

const floatCard = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

export default function HomePage() {
  const { t } = useTranslation();

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          position: "relative",
          p: { xs: 2.75, md: 4 },
          borderRadius: 4,
          background:
            "linear-gradient(130deg, rgba(15,139,111,0.18) 0%, rgba(124,255,224,0.16) 40%, rgba(12,24,36,0.78) 100%)",
          border: "1px solid rgba(124,255,224,0.2)",
          boxShadow: "0 30px 60px rgba(0,0,0,0.32)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: "-40% 40% auto auto",
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #ffe680 0%, #ffb300 55%, rgba(255,179,0,0.2) 80%)",
            filter: "blur(8px)",
            opacity: 0.7,
            animation: `${glowOrbit} 16s linear infinite`,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: "40% -60% -40% auto",
            width: "80%",
            background:
              "linear-gradient(120deg, rgba(124,255,224,0.14) 0%, rgba(15,139,111,0.4) 40%, rgba(124,255,224,0.14) 80%)",
            height: 12,
            filter: "blur(18px)",
          }}
        />

        <Stack spacing={1.5} sx={{ position: "relative", zIndex: 1 }}>
          <Chip
            icon={<BoltIcon />}
            label={t("front.home.heroChip")}
            color="secondary"
            variant="filled"
            sx={{ fontWeight: 700, alignSelf: "flex-start" }}
          />
          <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
            {t("front.home.heroTitle")}
          </Typography>
          <Typography variant="h6" sx={{ color: "rgba(232,241,248,0.8)", maxWidth: 800 }}>
            {t("front.home.heroSubtitle")}
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Chip label={t("front.home.heroTags.manage")} variant="outlined" color="secondary" />
            <Chip label={t("front.home.heroTags.schedule")} variant="outlined" color="primary" />
            <Chip label={t("front.home.heroTags.surplus")} variant="outlined" color="success" />
          </Stack>
        </Stack>

        <Box
          sx={{
            position: "absolute",
            bottom: 14,
            left: "6%",
            right: "6%",
            height: 3,
            background:
              "linear-gradient(90deg, rgba(124,255,224,0.1) 0%, rgba(124,255,224,0.6) 50%, rgba(124,255,224,0.1) 100%)",
            backgroundSize: "200% 100%",
            animation: `${flowLine} 8s linear infinite`,
            borderRadius: 999,
            opacity: 0.7,
          }}
        />
      </Box>

      <Grid container spacing={2.5}>
        {[
          {
            icon: <ElectricBoltIcon color="secondary" />,
            title: t("front.home.cards.flow.title"),
            desc: t("front.home.cards.flow.desc"),
          },
          {
            icon: <WifiIcon color="info" />,
            title: t("front.home.cards.heartbeat.title"),
            desc: t("front.home.cards.heartbeat.desc"),
          },
          {
            icon: <ScheduleIcon color="primary" />,
            title: t("front.home.cards.schedule.title"),
            desc: t("front.home.cards.schedule.desc"),
          },
        ].map((item, idx) => (
          <Grid key={item.title} item xs={12} md={4}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: "linear-gradient(160deg, rgba(10,24,36,0.92), rgba(7,18,28,0.9))",
                border: "1px solid rgba(255,255,255,0.06)",
                minHeight: 190,
                animation: `${floatCard} 6s ease-in-out ${idx * 0.6}s infinite`,
              }}
            >
              <Stack spacing={1}>
                {item.icon}
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="rgba(232,241,248,0.8)">
                  {item.desc}
                </Typography>
              </Stack>
            </Box>
          </Grid>
        ))}
      </Grid>

      <Box
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 3,
          background: "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, #f3fbf7 100%)",
          color: "#0d1b2a",
          boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
        }}
      >
        <Stack spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <WbSunnyIcon color="warning" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {t("front.home.bottom.title")}
            </Typography>
          </Stack>
          <Typography variant="body1">
            {t("front.home.bottom.desc")}
          </Typography>
        </Stack>
      </Box>
    </Stack>
  );
}
