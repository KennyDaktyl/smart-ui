import axiosClient from "@/api/axiosClient";
import type { DeviceEventsResponse } from "@/features/devices/types/deviceEvents";


export const deviceEventsApi = {
 
  getDeviceEvents: (
    deviceId: number,
    params?: {
      limit?: number;
      date?: string;
      event_type?: string;
    }
  ) => {
    return axiosClient.get<DeviceEventsResponse>(
      `/device-events/device/${deviceId}`,
      { params }
    );
  },
};
