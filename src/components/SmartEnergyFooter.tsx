import { Box, Chip, Stack, Typography } from "@mui/material";
import { keyframes } from "@emotion/react";
import { useTranslation } from "react-i18next";

const solarPulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(255, 200, 70, 0.45); transform: scale(1); }
  60% { box-shadow: 0 0 0 24px rgba(255, 200, 70, 0); transform: scale(1.04); }
  100% { box-shadow: 0 0 0 0 rgba(255, 200, 70, 0); transform: scale(1); }
`;

const flowRibbon = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`;

const sparkDrift = keyframes`
  0% { opacity: 0; transform: translateY(10px) scale(0.8); }
  25% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-22px) scale(1.04); }
`;

export function SmartEnergyFooter() {
  const { t } = useTranslation();

  return (
    <Box
      mt={{ xs: 3, md: 4 }}
      position="relative"
      borderRadius={4}
      overflow="hidden"
      sx={{
        border: "1px solid rgba(15,139,111,0.25)",
        background:
          "linear-gradient(135deg, rgba(9,26,36,0.92) 0%, rgba(6,18,30,0.92) 55%, rgba(5,13,24,0.9) 100%)",
        boxShadow: "0 24px 48px rgba(0,0,0,0.28)",
        color: "#e8f1f8",
        p: { xs: 2.25, md: 3 },
        isolation: "isolate",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: { xs: -40, md: -60 },
          left: { xs: -24, md: -40 },
          width: { xs: 120, md: 160 },
          height: { xs: 120, md: 160 },
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 30% 30%, #ffe680 0%, #ffb300 55%, rgba(255,179,0,0.6) 70%, rgba(255,179,0,0) 100%)",
          animation: `${solarPulse} 7s ease-in-out infinite`,
          filter: "blur(0.3px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: { xs: -30, md: -24 },
          left: { xs: "-30%", md: "-18%" },
          width: { xs: "200%", md: "180%" },
          height: { xs: 120, md: 140 },
          background:
            "linear-gradient(120deg, rgba(15,139,111,0.12) 0%, rgba(15,139,111,0.28) 30%, rgba(5,211,164,0.35) 50%, rgba(15,139,111,0.18) 70%, rgba(15,139,111,0.08) 100%)",
          backgroundSize: "200% 100%",
          animation: `${flowRibbon} 14s linear infinite`,
          transform: "rotate(-4deg)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: { xs: -4, md: 8 },
          left: { xs: "-18%", md: "-10%" },
          width: { xs: "180%", md: "160%" },
          height: { xs: 90, md: 110 },
          background:
            "linear-gradient(120deg, rgba(83,232,191,0.12) 0%, rgba(83,232,191,0.35) 40%, rgba(15,139,111,0.22) 70%, rgba(15,139,111,0.1) 100%)",
          backgroundSize: "220% 100%",
          animation: `${flowRibbon} 18s linear infinite reverse`,
          opacity: 0.9,
          transform: "rotate(-2deg)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {[0, 1, 2, 3].map((idx) => (
        <Box
          key={idx}
          sx={{
            position: "absolute",
            right: `${10 + idx * 10}%`,
            top: { xs: `${34 + idx * 8}%`, md: `${30 + idx * 6}%` },
            width: 6,
            height: { xs: 34, md: 42 },
            borderRadius: 999,
            background: "linear-gradient(180deg, #7cffe0 0%, rgba(124,255,224,0) 90%)",
            opacity: 0.9,
            animation: `${sparkDrift} 4s ease-in-out ${idx * 0.4}s infinite`,
            filter: "drop-shadow(0 0 8px rgba(83,232,191,0.5))",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ))}

      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems="center"
        spacing={1.5}
        sx={{ position: "relative", zIndex: 1 }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 0.4 }}>
            {t("admin.smartEnergyPulse")}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(232,241,248,0.78)", maxWidth: 680 }}>
            {t("admin.smartEnergyTagline")}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
          <Chip label={t("admin.footerSolar")} color="secondary" variant="outlined" />
          <Chip label={t("admin.footerGrid")} variant="filled" color="primary" />
          <Chip label={t("admin.footerRealtime")} variant="outlined" color="success" />
        </Stack>
      </Stack>
    </Box>
  );
}

export default SmartEnergyFooter;
