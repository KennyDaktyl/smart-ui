import { DeviceForm } from "./DeviceForm";
import { DeviceBox } from "./DeviceBox";
import { useDeviceSlot } from "../hooks/useDeviceSlot";
import { EmptyDeviceSlot } from "../atoms/EmptyDeviceSlot";

interface DeviceSlotProps {
  raspberryId: number;
  device?: any;
  slotIndex: number;
  liveInitialized: boolean;
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

  const { device, slotIndex } = props;

  if (!device && !editing) {
    return <EmptyDeviceSlot slotIndex={slotIndex} onAdd={() => setEditing(true)} />;
  }

  if (editing) {
    return (
      <DeviceForm
        initialData={{
          name: device?.name ?? "",
          rated_power_kw: device?.rated_power_kw ?? "",
          mode: device?.mode ?? "MANUAL",
          threshold_kw: device?.threshold_kw ?? "",
          device_number: slotIndex,
        }}
        saving={saving}
        locked={locked}
        onCancel={() => setEditing(false)}
        onSubmit={handleSave}
      />
    );
  }

  return (
    <DeviceBox
      device={device}
      online={effectiveOnline}
      isOn={effectiveIsOn}
      waitingForState={waitingForState}
      slotIndex={slotIndex}
      toggling={toggling}
      locked={locked}
      onEdit={() => setEditing(true)}
      onDelete={handleDelete}
      onToggle={handleToggle}
    />
  );
}
