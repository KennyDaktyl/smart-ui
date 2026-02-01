import {
  Box,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import type { Device } from "@/features/devices/types/devicesType";
import { MicrocontrollerLiveStatus } from "@/features/microcontrollers/live/MicrocontrollerLiveStatus";
import { ProviderLiveEnergy } from "@/features/providers/live/ProviderLiveEnergy";
import { CardShell } from "@/features/common/components/CardShell";
import { FixedHeightStack } from "@/features/common/components/FixedHeightStack";
import { StatusBadge } from "@/features/common/components/atoms/StatusBadge";
import { microcontrollersApi } from "@/api/microcontrollerApi";
import { DeviceList } from "@/features/devices/components/DeviceList";
import { DeviceForm } from "@/features/devices/components/DeviceForm";
import { devicesApi } from "@/api/devicesApi";

const CARD_MIN_HEIGHT = 420;

type Props = {
  microcontroller: MicrocontrollerResponse;
  layout?: "stack" | "split";
};

export function MicrocontrollerCard({
  microcontroller,
  layout = "stack",
}: Props) {
  const { t } = useTranslation();

  const availableProviders = microcontroller.available_api_providers ?? [];
  const powerProvider = microcontroller.power_provider ?? null;
  const [devices, setDevices] = useState(microcontroller.devices ?? []);

  const initialProviderUuid =
    powerProvider?.uuid ?? microcontroller.config?.provider?.uuid ?? "";
  const [currentProviderUuid, setCurrentProviderUuid] = useState(initialProviderUuid);
  const [pendingProviderUuid, setPendingProviderUuid] = useState(initialProviderUuid);
  const [isEditingProvider, setIsEditingProvider] = useState(false);
  const [providerSaving, setProviderSaving] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [isAddingDevice, setIsAddingDevice] = useState(false);

  useEffect(() => {
    setCurrentProviderUuid(initialProviderUuid);
    setPendingProviderUuid(initialProviderUuid);
    setIsEditingProvider(false);
    setProviderError(null);
  }, [initialProviderUuid]);

  useEffect(() => {
    setDevices(microcontroller.devices ?? []);
  }, [microcontroller.devices]);

  const currentProvider = useMemo(() => {
    if (powerProvider && powerProvider.uuid === currentProviderUuid) {
      return powerProvider;
    }
    return availableProviders.find((p) => p.uuid === currentProviderUuid);
  }, [availableProviders, currentProviderUuid, powerProvider]);

  const getProviderName = (uuid: string) => {
    if (!uuid) return t("common.none");
    if (powerProvider && powerProvider.uuid === uuid) return powerProvider.name;
    return availableProviders.find((p) => p.uuid === uuid)?.name ?? uuid;
  };

  return (
    <MicrocontrollerLiveStatus uuid={microcontroller.uuid}>
      {(live) => {
        const isOnlineLive = live.status === "online";
        const showLastSeen = live.status !== "pending" && Boolean(live.lastSeen);
        const isMaxReached = devices.length >= microcontroller.max_devices;
        const disableActions = !isOnlineLive || isMaxReached;
        const disableSensors = !isOnlineLive;
        const canAddDevice = isOnlineLive && Boolean(currentProvider);
        const reloadDevices = async () => {
          try {
            const res = await devicesApi.listForMicrocontroller(microcontroller.uuid);
            setDevices(res.data);
          } catch {
            // keep current list on error
          }
        };
        const updateDevice = (updated: Partial<Device> & { id: number }) => {
          setDevices((prev) =>
            prev.map((device) => (device.id === updated.id ? { ...device, ...updated } : device))
          );
        };

        const cardSection = (
          <CardShell
            minHeight={CARD_MIN_HEIGHT}
            title={microcontroller.name}
            subtitle={t(`microcontroller.types.${microcontroller.type}`)}
            actions={<MicrocontrollerLiveStatus uuid={microcontroller.uuid} state={live} />}
            sx={
              layout === "split"
                ? {
                    borderWidth: 2,
                    borderColor: "rgba(15,139,111,0.45)",
                    boxShadow: "0 18px 36px rgba(15,139,111,0.12)",
                    "& .MuiTypography-h6": { fontSize: "1.2rem" },
                  }
                : undefined
            }
          >
            <FixedHeightStack minHeight={CARD_MIN_HEIGHT - 60}>
              <Stack spacing={2}>
                  {/* STATUS / META */}
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <StatusBadge
                        status={microcontroller.enabled ? "online" : "disabled"}
                        label={microcontroller.enabled ? t("common.enabled") : t("common.disabled")}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {t("microcontroller.maxDevices")}: {microcontroller.max_devices}
                      </Typography>
                    </Stack>

                    {microcontroller.software_version && (
                      <Typography variant="body2" color="text.secondary">
                        {t("microcontroller.software")}: {microcontroller.software_version}
                      </Typography>
                    )}

                    {showLastSeen && (
                      <Typography variant="caption" color="text.secondary">
                        {t("providers.live.updatedAt")} {new Date(live.lastSeen as string).toLocaleString()}
                      </Typography>
                    )}
                  </Stack>

                  <Divider />

                  {/* ENERGY SECTION */}
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
                          renderValue={(value) => getProviderName(String(value))}
                          disabled={!availableProviders || availableProviders.length === 0}
                        >
                          <MenuItem value="">{t("common.none")}</MenuItem>
                          {(availableProviders ?? []).map((provider) => (
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
                        <ProviderLiveEnergy key={currentProviderUuid} provider={currentProvider} />
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
                              disabled={providerSaving || pendingProviderUuid === currentProviderUuid}
                              onClick={async () => {
                                setProviderSaving(true);
                                setProviderError(null);
                                try {
                                  const res = await microcontrollersApi.setProvider(
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

                  <Divider />
                  
                    {/* SENSORS SECTION */}
                    {/* <Stack spacing={1}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {t("microcontroller.sensorsLabel")}
                      </Typography>

                      {microcontroller.assigned_sensors &&
                      microcontroller.assigned_sensors.length > 0 ? (
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {microcontroller.assigned_sensors.map((sensor) => (
                            <Chip
                              key={sensor}
                              label={sensor}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          {t("microcontroller.form.noSensors")}
                        </Typography>
                      )}

                      {!isOnlineLive && (
                        <Typography variant="caption" color="text.secondary">
                          {t("microcontroller.offlineWarning")}
                        </Typography>
                      )}
                    </Stack> */}
                  {/* <Divider /> */}

                {/* DEVICE ACTIONS */}
                <Stack spacing={1}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {t("common.actions")}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1}>
                    <Button
                      variant="contained"
                      disabled={disableActions || !canAddDevice}
                      onClick={() => setIsAddingDevice(true)}
                    >
                      {t("common.add")}
                    </Button>

                    {disableActions && (
                      <Typography variant="caption" color="text.secondary">
                        {!isOnlineLive
                          ? t("microcontroller.offlineWarning")
                          : t("microcontroller.maxDevices")}
                      </Typography>
                    )}
                    {!disableActions && !currentProvider && (
                      <Typography variant="caption" color="text.secondary">
                        {t("providers.empty.description")}
                      </Typography>
                    )}
                  </Box>
                </Stack>
                </Stack>
            </FixedHeightStack>
          </CardShell>
        );

        const deviceSection = (
          <Box>
            <Stack mb={1}>
              <Typography variant="subtitle1" fontWeight={600}>
                {t("devices.sectionTitle", {
                  name: microcontroller.name,
                })}
              </Typography>
            </Stack>

            <DeviceList
              devices={devices}
              liveInitialized={live.status !== "pending"}
              isOnline={isOnlineLive}
              microcontrollerUuid={microcontroller.uuid}
              provider={currentProvider}
              onReload={reloadDevices}
              onDeviceUpdate={updateDevice}
            />
          </Box>
        );

        const addDeviceDialog = (
          <Dialog
            open={isAddingDevice}
            onClose={() => setIsAddingDevice(false)}
            fullWidth
            maxWidth="sm"
            PaperProps={{
              sx: {
                borderRadius: 3,
              },
            }}
          >
            <DialogTitle>{t("common.add")}</DialogTitle>
            <DialogContent dividers>
              {canAddDevice ? (
                <DeviceForm
                  provider={currentProvider}
                  microcontrollerOnline={isOnlineLive}
                  microcontrollerUuid={microcontroller.uuid}
                  existingDevices={devices}
                  maxDevices={microcontroller.max_devices}
                  onSubmit={async () => {
                    setIsAddingDevice(false);
                    await reloadDevices();
                  }}
                  onCancel={() => setIsAddingDevice(false)}
                  variant="modal"
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {!isOnlineLive
                    ? t("microcontroller.offlineWarning")
                    : t("providers.empty.description")}
                </Typography>
              )}
            </DialogContent>
          </Dialog>
        );

        if (layout === "split") {
          return (
            <>
              <Grid container spacing={3}>
                <Grid xs={12} md={5}>
                  {cardSection}
                </Grid>
                <Grid xs={12} md={7}>
                  {deviceSection}
                </Grid>
              </Grid>
              {addDeviceDialog}
            </>
          );
        }

        return (
          <Stack spacing={2}>
            {cardSection}
            {deviceSection}
            {addDeviceDialog}
          </Stack>
        );
      }}
    </MicrocontrollerLiveStatus>
  );
}
