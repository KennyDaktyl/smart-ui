import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";

import type { ProviderInstance } from "@/features/providers/types/provider";

type ProviderDetailsDialogProps = {
  open: boolean;
  provider: ProviderInstance | null;
  onClose: () => void;
};

export default function ProviderDetailsDialog({ open, provider, onClose }: ProviderDetailsDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: "linear-gradient(180deg, #ffffff 0%, #f7faf9 100%)",
          color: "#0b1f2a",
        },
      }}
    >
      <DialogTitle>
        {t("providers.detailsTitle")}
        <IconButton
          aria-label={t("common.close")}
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ color: "#0b1f2a" }}>
        {provider && (
          <Stack spacing={1.5}>
            <Typography variant="subtitle1" sx={{ color: "#0b1f2a" }}>
              {provider.name ?? t("providers.unknownProvider")}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.72)" }}>
              {t("providers.details.uuid", {
                uuid: provider.uuid ?? provider.id ?? "-",
              })}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.72)" }}>
              {t("providers.details.type", { type: provider.provider_type ?? "-" })}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.72)" }}>
              {t("providers.details.kind", { kind: provider.kind ?? "-" })}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.72)" }}>
              {t("providers.details.vendor", { vendor: provider.vendor ?? "-" })}
            </Typography>
            <Divider />
            <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.72)" }}>
              {t("providers.details.unit", { unit: provider.unit ?? "-" })}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.72)" }}>
              {t("providers.details.range", {
                min: provider.value_min ?? "-",
                max: provider.value_max ?? "-",
              })}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.72)" }}>
              {t("providers.details.lastValue", {
                value: provider.last_value ?? "-",
              })}
            </Typography>
            <Divider />
            <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.72)" }}>
              {t("providers.details.created", {
                date: provider.created_at ?? "-",
              })}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.72)" }}>
              {t("providers.details.updated", {
                date: provider.updated_at ?? "-",
              })}
            </Typography>
            <Box>
              <Typography variant="subtitle2" sx={{ color: "#0b1f2a" }}>
                {t("providers.details.configuration")}
              </Typography>
              <Box
                component="pre"
                sx={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  backgroundColor: "rgba(11,31,42,0.06)",
                  border: "1px solid rgba(11,31,42,0.08)",
                  padding: 1.5,
                  borderRadius: 1.5,
                  fontSize: "0.8rem",
                  color: "#0b1f2a",
                }}
              >
                {JSON.stringify(provider.config ?? {}, null, 2)}
              </Box>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
