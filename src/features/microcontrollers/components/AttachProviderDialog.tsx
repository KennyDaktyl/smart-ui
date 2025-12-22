import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MANUAL_PROVIDER_OPTION } from "./types";

interface AttachProviderDialogProps {
  open: boolean;
  microcontroller: any | null;
  selectedProviderUuid: string;
  onSelectProvider: (uuid: string) => void;
  onClose: () => void;
  onSave: () => void;
  loading?: boolean;
  error?: string | null;
  onGoToProviders?: () => void;
}

const humanizeProviderType = (type?: string) => {
  if (!type) return "";
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export function AttachProviderDialog({
  open,
  microcontroller,
  selectedProviderUuid,
  onSelectProvider,
  onClose,
  onSave,
  loading = false,
  error,
  onGoToProviders,
}: AttachProviderDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("microcontrollers.attachDialogTitle")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          {error && <Alert severity="error">{error}</Alert>}
          <Typography variant="subtitle1">
            {t("microcontrollers.attachDialogSubtitle", {
              name: microcontroller?.name ?? microcontroller?.uuid ?? "",
            })}
          </Typography>

          <Stack spacing={1}>
            <Typography variant="subtitle2">
              {t("microcontrollers.attachSensorSection")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("microcontrollers.attachSensorHint")}
            </Typography>
            {microcontroller?.available_sensor_providers?.length ? (
              <List disablePadding>
                {microcontroller.available_sensor_providers.map((provider: any) => (
                  <ListItem key={provider.uuid} disablePadding>
                    <ListItemButton
                      selected={selectedProviderUuid === provider.uuid}
                      onClick={() => onSelectProvider(provider.uuid)}
                    >
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography fontWeight={600}>
                              {provider.name ?? provider.vendor}
                            </Typography>
                            {humanizeProviderType(provider.provider_type) && (
                              <Chip size="small" label={humanizeProviderType(provider.provider_type)} />
                            )}
                          </Stack>
                        }
                        secondary={t("microcontrollers.providerDetails", {
                          type: provider.provider_type,
                          vendor: provider.vendor ?? t("microcontrollers.providerUnknown"),
                        })}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {t("microcontrollers.attachSensorUnavailable")}
              </Typography>
            )}
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">
              {t("microcontrollers.attachApiSection")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("microcontrollers.attachApiHint")}
            </Typography>
            {microcontroller?.available_api_providers?.length ? (
              <List disablePadding>
                {microcontroller.available_api_providers.map((provider: any) => (
                  <ListItem key={provider.uuid} disablePadding>
                    <ListItemButton
                      selected={selectedProviderUuid === provider.uuid}
                      onClick={() => onSelectProvider(provider.uuid)}
                    >
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography fontWeight={600}>
                              {provider.name ?? provider.vendor}
                            </Typography>
                            {humanizeProviderType(provider.provider_type) && (
                              <Chip size="small" label={humanizeProviderType(provider.provider_type)} />
                            )}
                          </Stack>
                        }
                        secondary={t("microcontrollers.providerDetails", {
                          type: provider.provider_type,
                          vendor: provider.vendor ?? t("microcontrollers.providerUnknown"),
                        })}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="body2" color="text.secondary">
                  {t("microcontrollers.attachNoProviders")}
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    onClose();
                    onGoToProviders?.();
                  }}
                >
                  {t("microcontrollers.goToProviders")}
                </Button>
              </Stack>
            )}
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">
              {t("microcontrollers.attachManualSection")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("microcontrollers.attachManualHint")}
            </Typography>
            <List disablePadding>
              <ListItem disablePadding>
                <ListItemButton
                  selected={selectedProviderUuid === MANUAL_PROVIDER_OPTION}
                  onClick={() => onSelectProvider(MANUAL_PROVIDER_OPTION)}
                >
                  <ListItemText primary={t("microcontrollers.attachManualTitle")} />
                </ListItemButton>
              </ListItem>
            </List>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("common.cancel")}</Button>
        <Button variant="contained" onClick={onSave} disabled={loading}>
          {loading ? <CircularProgress size={20} /> : t("common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
