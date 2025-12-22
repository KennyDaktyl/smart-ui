import { IconButton, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/i18n/config";

interface LanguageSwitcherProps {
  direction?: "row" | "column";
}

export function LanguageSwitcher({ direction = "row" }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();

  const handleChange = (lng: "pl" | "en") => {
    changeLanguage(lng);
  };

  const isActive = (lng: string) => i18n.language === lng;

  return (
    <Stack direction={direction} spacing={1} alignItems="center">
      <IconButton
        aria-label={t("common.language.polish")}
        onClick={() => handleChange("pl")}
        sx={{
          bgcolor: isActive("pl") ? "primary.light" : "transparent",
          borderRadius: 2,
        }}
        size="small"
      >
        <span role="img" aria-label={t("common.language.polishFlag")}>
          🇵🇱
        </span>
      </IconButton>

      <IconButton
        aria-label={t("common.language.english")}
        onClick={() => handleChange("en")}
        sx={{
          bgcolor: isActive("en") ? "primary.light" : "transparent",
          borderRadius: 2,
        }}
        size="small"
      >
        <span role="img" aria-label={t("common.language.englishFlag")}>
          🇬🇧
        </span>
      </IconButton>
    </Stack>
  );
}
