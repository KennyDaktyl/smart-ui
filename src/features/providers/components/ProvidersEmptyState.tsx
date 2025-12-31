import { Stack, Typography, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";

type Props = {
  onAdd: () => void;
};

export default function ProvidersEmptyState({ onAdd }: Props) {
  const { t } = useTranslation();

  return (
    <Stack spacing={2} alignItems="center" mt={6}>
      <Typography color="text.secondary">
        {t("providers.empty.description")}
      </Typography>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAdd}
      >
        {t("providers.empty.action")}
      </Button>
    </Stack>
  );
}
