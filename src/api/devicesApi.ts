import axiosClient from "@/api/axiosClient";
import type { Device } from "@/features/devices/types/devicesType";
import type { DeviceEventsResponse } from "@/features/devices/types/deviceEvents";
import type { DeviceMode } from "@/features/devices/enums/deviceMode";

export type DeviceCreatePayload = {
  name: string;
  device_number: number;
  mode: DeviceMode;
  rated_power?: number | null;
  threshold_value?: number | null;
  scheduler_id?: number | null;
};

export const devicesApi = {
  createDevice: (microcontrollerUuid: string, payload: DeviceCreatePayload) => {
    return axiosClient.post<Device>(
      `/devices/microcontroller/${microcontrollerUuid}`,
      payload,
    );
  },
  updateDevice: (deviceId: number, payload: Partial<DeviceCreatePayload>) => {
    return axiosClient.put<Device>(`/devices/${deviceId}`, payload);
  },
  deleteDevice: (deviceId: number) => {
    return axiosClient.delete(`/devices/${deviceId}`);
  },
  listForMicrocontroller: (microcontrollerUuid: string) => {
    return axiosClient.get<Device[]>(
      `/devices/microcontroller/${microcontrollerUuid}`,
    );
  },
  getDeviceById: (deviceId: number) => {
    return axiosClient.get<Device>(`/devices/${deviceId}`);
  },
  setManualState: (deviceId: number, state: boolean) => {
    return axiosClient.put(`/devices/${deviceId}/manual_state`, { state });
  },
  getDeviceEvents: (
    deviceId: number,
    params?: {
      limit?: number;
      date?: string;
      event_type?: string;
    },
  ) => {
    return axiosClient.get<DeviceEventsResponse>(
      `/device-events/device/${deviceId}`,
      { params },
    );
  },
};
