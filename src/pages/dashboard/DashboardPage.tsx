import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Stack,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { StickyDialog } from "@/components/dialogs/StickyDialog";
import { microcontrollersApi } from "@/api/microcontrollerApi";
import { DeviceForm } from "@/features/devices/components/DeviceForm";
import { DashboardDeviceList, type DashboardDeviceItem } from "@/features/dashboard/components/DashboardDeviceList";
import { useDeviceLiveState, type DeviceHeartbeatSubscription } from "@/features/devices/live/useDeviceLiveState";
import { useMicrocontrollersOnlineStatus } from "@/features/microcontrollers/hooks/useMicrocontrollersOnlineStatus";
import type { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import { useProvidersLive } from "@/features/providers/hooks/useProvidersLive";
import type { ProviderResponse } from "@/features/providers/types/userProvider";
import LoadingOverlay from "@/features/common/components/LoadingOverlay";

function resolvePowerProvider(
  microcontroller: MicrocontrollerResponse
): ProviderResponse | null {
  const availableProviders = microcontroller.available_api_providers ?? [];
  const powerProvider = microcontroller.power_provider ?? null;

  const configuredProviderUuid =
    powerProvider?.uuid ?? microcontroller.config?.provider?.uuid ?? "";

  if (
    powerProvider &&
    (!configuredProviderUuid || powerProvider.uuid === configuredProviderUuid)
  ) {
    return powerProvider;
  }

  return (
    availableProviders.find(
      (provider) => provider.uuid === configuredProviderUuid
    ) ??
    powerProvider ??
    null
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();

  const [microcontrollers, setMicrocontrollers] = useState<MicrocontrollerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingDeviceId, setEditingDeviceId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await microcontrollersApi.getUserMicrocontrollers();
        if (cancelled) return;
        setMicrocontrollers(response.data);
      } catch {
        if (cancelled) return;
        setError(t("dashboard.fetchError"));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const dashboardDevices = useMemo<DashboardDeviceItem[]>(
    () =>
      microcontrollers.flatMap((microcontroller) => {
        const provider = resolvePowerProvider(microcontroller);

        return (microcontroller.devices ?? []).map((device) => ({
          device,
          microcontroller,
          provider,
        }));
      }),
    [microcontrollers]
  );

  const microcontrollerUuids = useMemo(
    () => [...new Set(microcontrollers.map((micro) => micro.uuid))],
    [microcontrollers]
  );

  const heartbeatSubscriptions = useMemo<DeviceHeartbeatSubscription[]>(() => {
    const microcontrollerSubjects = microcontrollerUuids.map((uuid) => ({ uuid }));
    const deviceSubjects = dashboardDevices.map((item) => ({
      id: item.device.id,
      uuid: item.device.uuid,
    }));

    return [...microcontrollerSubjects, ...deviceSubjects];
  }, [dashboardDevices, microcontrollerUuids]);

  const providers = useMemo<ProviderResponse[]>(() => {
    const providerMap = new Map<string, ProviderResponse>();

    dashboardDevices.forEach((item) => {
      if (!item.provider) return;
      providerMap.set(item.provider.uuid, item.provider);
    });

    return [...providerMap.values()];
  }, [dashboardDevices]);

  const deviceLiveMap = useDeviceLiveState(undefined, heartbeatSubscriptions);
  const microcontrollerLiveMap = useMicrocontrollersOnlineStatus(microcontrollerUuids);
  const providerLiveMap = useProvidersLive(providers);
  const sortedDashboardDevices = useMemo(() => {
    if (!dashboardDevices.length) return dashboardDevices;

    return [...dashboardDevices].sort((left, right) => {
      const leftOffline =
        microcontrollerLiveMap[left.microcontroller.uuid]?.isOnline === false ? 1 : 0;
      const rightOffline =
        microcontrollerLiveMap[right.microcontroller.uuid]?.isOnline === false ? 1 : 0;

      if (leftOffline !== rightOffline) {
        return leftOffline - rightOffline;
      }

      return 0;
    });
  }, [dashboardDevices, microcontrollerLiveMap]);
  const editingItem = useMemo(
    () =>
      dashboardDevices.find((item) => item.device.id === editingDeviceId) ?? null,
    [dashboardDevices, editingDeviceId]
  );

  const reloadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await microcontrollersApi.getUserMicrocontrollers();
      setMicrocontrollers(response.data);
    } catch {
      setError(t("dashboard.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack spacing={2} sx={{ width: "100%", minWidth: 0 }}>
        <Stack spacing={0.75} mb={2.5}>
          <Typography variant="h4">{t("dashboard.title")}</Typography>
          <Typography color="text.secondary">{t("dashboard.subtitle")}</Typography>
          <Typography variant="caption" color="text.secondary">
            {t("dashboard.itemsCount", { count: dashboardDevices.length })}
          </Typography>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <LoadingOverlay
          loading={loading}
          keepChildrenMounted={dashboardDevices.length > 0}
          sx={{ minHeight: { xs: 280, sm: 340, md: 420 } }}
        >
          {dashboardDevices.length === 0 ? (
            <Typography color="text.secondary">{t("dashboard.empty")}</Typography>
          ) : (
            <DashboardDeviceList
              items={sortedDashboardDevices}
              deviceLiveMap={deviceLiveMap}
              microcontrollerLiveMap={microcontrollerLiveMap}
              providerLiveMap={providerLiveMap}
              onEditDevice={setEditingDeviceId}
            />
          )}
        </LoadingOverlay>
      </Stack>

      <StickyDialog
        open={Boolean(editingItem)}
        onClose={() => setEditingDeviceId(null)}
        maxWidth="sm"
        title={t("common.edit")}
        actions={
          <>
            <Button variant="outlined" onClick={() => setEditingDeviceId(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="dashboard-edit-device-form" variant="contained">
              {t("common.save")}
            </Button>
          </>
        }
      >
        {editingItem && (
          <DeviceForm
            device={editingItem.device}
            provider={editingItem.provider}
            microcontrollerOnline={
              Boolean(
                microcontrollerLiveMap[editingItem.microcontroller.uuid]?.isOnline
              )
            }
            assignedSensors={editingItem.microcontroller.assigned_sensors}
            existingDevices={editingItem.microcontroller.devices}
            formId="dashboard-edit-device-form"
            hideActions
            onSubmit={async () => {
              setEditingDeviceId(null);
              await reloadDashboardData();
            }}
            onCancel={() => setEditingDeviceId(null)}
            variant="modal"
          />
        )}
      </StickyDialog>
    </>
  );
}
