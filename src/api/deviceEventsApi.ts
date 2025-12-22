import axiosClient from "./axiosClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const eventPath = (microcontrollerUuid: string, deviceId: number) =>
  `${API_URL}/microcontrollers/${microcontrollerUuid}/devices/${deviceId}/events`;

export const deviceEventsApi = {
  getDeviceEvents: (
    token: string,
    deviceId: number,
    dateStart: string,
    dateEnd: string,
    microcontrollerUuid?: string
  ) => {
    const params = { date_start: dateStart, date_end: dateEnd };
    if (microcontrollerUuid) {
      return axiosClient.get(eventPath(microcontrollerUuid, deviceId), {
        ...authHeaders(token),
        params,
      });
    }
    return axiosClient.get(`${API_URL}/device-events/device/${deviceId}`, {
      ...authHeaders(token),
      params,
    });
  },
};
