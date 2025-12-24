import { useEffect, useState } from "react";
import { DeviceForm } from "./DeviceForm";
import { DeviceBox } from "./DeviceBox";
import { useDeviceSlot } from "../hooks/useDeviceSlot";
import { EmptyDeviceSlot } from "../atoms/EmptyDeviceSlot";
import { useTranslation } from "react-i18next";
import type { DeviceFormData } from "../types/device";
import type { Provider } from "@/features/providers/types";

interface DeviceSlotProps {
  raspberryId: number;
  raspberryUuid: string;
  raspberryName: string;
  device?: any;
  slotIndex: number;
  liveInitialized: boolean;
  isOnline: boolean;
  provider: Provider | null;
  onRefresh: () => void;
}

export function DeviceSlot(props: DeviceSlotProps) {
  const {
    editing,
    saving,
    toggling,
    locked,
    effectiveOnline,
    effectiveIsOn,
    waitingForState,
    setEditing,
    handleSave,
    handleDelete,
    handleToggle,
  } = useDeviceSlot(props);

  const { t } = useTranslation();
  const {
    device,
    slotIndex,
    liveInitialized,
    isOnline,
    raspberryName,
    raspberryUuid,
    raspberryId,
    provider,
  } = props;

  /* ===================== FORM STATE ===================== */

  const [formState, setFormState] = useState<DeviceFormData>(() => ({
    name: device?.name ?? "",
    rated_power_w: device?.rated_power_w ?? "",
    mode: device?.mode ?? "MANUAL",
    threshold_value: device?.threshold_value ?? "",
    device_number: slotIndex,
  }));

  useEffect(() => {
    if (!device) return;

    setFormState({
      name: device.name ?? "",
      rated_power_w: device.rated_power_w ?? "",
      mode: device.mode ?? "MANUAL",
      threshold_value: device.threshold_value ?? "",
      device_number: slotIndex,
    });
  }, [device, slotIndex]);

  /* ===================== ADD CONDITIONS ===================== */

  const providerAttached = Boolean(provider);
  const baseCanAdd = liveInitialized && isOnline;
  const canAddDevice = baseCanAdd && providerAttached;
  const addHelperText = !providerAttached
    ? t("devices.addDisabledNoProvider")
    : !baseCanAdd
    ? t(liveInitialized ? "devices.addDisabledOffline" : "devices.addDisabledWaiting")
    : undefined;

  /* ===================== EMPTY SLOT ===================== */

  if (!device && !editing) {
    return (
      <EmptyDeviceSlot
        slotIndex={slotIndex}
        onAdd={() => setEditing(true)}
        disabled={!canAddDevice}
        helperText={addHelperText}
      />
    );
  }

  /* ===================== EDIT MODE ===================== */

  if (editing) {
    return (
        <DeviceForm
          value={formState}
          saving={saving}
          disabled={locked}
          onChange={setFormState}
          onCancel={() => setEditing(false)}
          onSubmit={() => handleSave(formState)}
          provider={provider}
        />
    );
  }

  /* ===================== VIEW MODE ===================== */

  return (
    <DeviceBox
      device={device}
      online={effectiveOnline}
      isOn={effectiveIsOn}
      waitingForState={waitingForState}
      raspberryName={raspberryName}
      raspberryUuid={raspberryUuid}
      raspberryId={raspberryId}
      slotIndex={slotIndex}
      toggling={toggling}
      locked={locked}
      onEdit={() => setEditing(true)}
      onDelete={handleDelete}
      onToggle={handleToggle}
    />
  );
}
