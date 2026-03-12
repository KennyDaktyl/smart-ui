import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import { microcontrollersApi } from "@/api/microcontrollerApi";
import { ProviderLiveEnergy } from "@/features/providers/live/ProviderLiveEnergy";
import { ProviderLiveMetricsPanel } from "@/features/providers/components/ProviderLiveMetricsPanel";

type Props = {
  microcontroller: MicrocontrollerResponse;
};

export function MicrocontrollerProvider({
  microcontroller,
}: Props) {
  const { t } = useTranslation();

  const availableProviders = microcontroller.available_api_providers ?? [];
  const powerProvider = microcontroller.power_provider ?? null;

  const initialProviderUuid =
    powerProvider?.uuid ?? microcontroller.config?.provider?.uuid ?? "";

  const [currentProviderUuid, setCurrentProviderUuid] =
    useState(initialProviderUuid);
  const [pendingProviderUuid, setPendingProviderUuid] =
    useState(initialProviderUuid);
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  const [providerSaving, setProviderSaving] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);

  useEffect(() => {
    setCurrentProviderUuid(initialProviderUuid);
    setPendingProviderUuid(initialProviderUuid);
    setIsEditingProvider(false);
    setProviderError(null);
  }, [initialProviderUuid]);

  const currentProvider = useMemo(() => {
    if (powerProvider && powerProvider.uuid === currentProviderUuid) {
      return powerProvider;
    }
    return availableProviders.find(
      (p) => p.uuid === currentProviderUuid
    );
  }, [availableProviders, currentProviderUuid, powerProvider]);

  const getProviderName = (uuid: string) => {
    if (!uuid) return t("common.none");
    if (powerProvider && powerProvider.uuid === uuid) {
      return powerProvider.name;
    }
    return (
      availableProviders.find((p) => p.uuid === uuid)?.name ?? uuid
    );
  };

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2" fontWeight={600}>
        {t("providers.live.title")}
      </Typography>

      {isEditingProvider || !currentProviderUuid ? (
        <FormControl fullWidth size="small">
          <InputLabel shrink>{t("providers.title")}</InputLabel>
          <Select
            label={t("providers.title")}
            value={pendingProviderUuid}
            onChange={(event) =>
              setPendingProviderUuid(String(event.target.value))
            }
            displayEmpty
            renderValue={(value) =>
              getProviderName(String(value))
            }
            disabled={availableProviders.length === 0}
          >
            <MenuItem value="">{t("common.none")}</MenuItem>
            {availableProviders.map((provider) => (
              <MenuItem key={provider.uuid} value={provider.uuid}>
                {provider.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {t("providers.title")}:
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {getProviderName(currentProviderUuid)}
          </Typography>
        </Stack>
      )}

      {currentProvider && (
        <>
          <ProviderLiveEnergy key={currentProviderUuid} provider={currentProvider}>
            {(live) => (
              <ProviderLiveMetricsPanel
                provider={currentProvider}
                live={live}
                compact
                emptyLabel={String(t("providers.live.noMetrics"))}
              />
            )}
          </ProviderLiveEnergy>
          <Typography variant="caption" color="text.secondary">
            {t("providers.title")}: {currentProvider.name}
          </Typography>
        </>
      )}

      {!currentProvider && availableProviders.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          {t("providers.empty.description")}
        </Typography>
      )}

      {availableProviders.length > 0 && (
        <Stack direction="row" spacing={1} alignItems="center">
          {isEditingProvider || !currentProviderUuid ? (
            <>
              <Button
                size="small"
                variant="contained"
                disabled={
                  providerSaving ||
                  pendingProviderUuid === currentProviderUuid
                }
                onClick={async () => {
                  setProviderSaving(true);
                  setProviderError(null);
                  try {
                    const res =
                      await microcontrollersApi.setProvider(
                        microcontroller.uuid,
                        pendingProviderUuid || null
                      );

                    const nextUuid =
                      res.data.power_provider?.uuid ??
                      res.data.config?.provider?.uuid ??
                      pendingProviderUuid ??
                      "";

                    setCurrentProviderUuid(nextUuid);
                    setPendingProviderUuid(nextUuid);
                    setIsEditingProvider(false);
                  } catch {
                    setProviderError(t("common.error.generic"));
                  } finally {
                    setProviderSaving(false);
                  }
                }}
              >
                {t("common.save")}
              </Button>

              {currentProviderUuid && (
                <Button
                  size="small"
                  variant="outlined"
                  disabled={providerSaving}
                  onClick={() => {
                    setPendingProviderUuid(currentProviderUuid);
                    setIsEditingProvider(false);
                    setProviderError(null);
                  }}
                >
                  {t("common.cancel")}
                </Button>
              )}
            </>
          ) : (
            <Button
              size="small"
              variant="text"
              onClick={() => setIsEditingProvider(true)}
            >
              {t("common.edit")}
            </Button>
          )}

          {providerError && (
            <Typography variant="caption" color="error">
              {providerError}
            </Typography>
          )}
        </Stack>
      )}
    </Stack>
  );
}
