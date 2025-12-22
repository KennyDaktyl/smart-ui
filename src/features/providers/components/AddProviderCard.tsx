import { Card, CardActionArea, CardContent, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";

type AddProviderCardProps = {
  onClick: () => void;
  disabled?: boolean;
};

export default function AddProviderCard({ onClick, disabled }: AddProviderCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      sx={{
        borderRadius: 2.5,
        border: "2px dashed rgba(15,139,111,0.7)",
        opacity: disabled ? 0.55 : 1,
        backgroundColor: "#f8fbfa",
        boxShadow: "0 10px 24px rgba(8,24,36,0.08)",
      }}
    >
      <CardActionArea onClick={onClick} disabled={disabled}>
        <CardContent>
          <Stack spacing={1} alignItems="center" textAlign="center">
            <AddIcon sx={{ fontSize: 32, color: "#0f8b6f" }} />
            <Typography variant="subtitle1" sx={{ color: "#0b1f2a" }}>
              {t("providers.addCardTitle")}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.75)" }}>
              {t("providers.addCardSubtitle")}
            </Typography>
            {disabled && (
              <Typography variant="caption" sx={{ color: "rgba(11,31,42,0.6)" }}>
                {t("providers.addCardHintSelectMicrocontroller")}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
