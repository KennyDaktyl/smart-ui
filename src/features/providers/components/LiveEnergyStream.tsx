import { Box, Stack, Typography, Chip } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import { keyframes } from "@mui/system";
import { useTranslation } from "react-i18next";

type Props = {
  unit?: string | null;
};

const pulse = keyframes`
  0% { opacity: 0.4; }
  50% { opacity: 1; }
  100% { opacity: 0.4; }
`;

export default function LiveEnergyStream({ unit }: Props) {
  const { t } = useTranslation();

  return (
    <Box width="100%">
      <Typography variant="subtitle2" fontWeight={500} gutterBottom>
        {t("providers.card.lastValue")}
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center">
        <BoltIcon color="success" />

        <Typography
          variant="h6"
          fontWeight={700}
          sx={{
            animation: `${pulse} 1.4s ease-in-out infinite`,
          }}
        >
          LIVE {unit ?? ""}
        </Typography>

        <Chip
          size="small"
          label="LIVE"
          color="success"
          variant="outlined"
        />
      </Stack>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 0.5, display: "block" }}
      >
        {t("providers.live.streaming")}
      </Typography>
    </Box>
  );
}
