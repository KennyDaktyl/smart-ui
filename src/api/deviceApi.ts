import axiosClient from "./axiosClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const microcontrollerDevicesPath = (microcontrollerUuid: string) =>
  `${API_URL}/microcontrollers/${microcontrollerUuid}/devices`;

const devicePath = (microcontrollerUuid: string, deviceId: number | string) =>
  `${microcontrollerDevicesPath(microcontrollerUuid)}/${deviceId}`;

export const deviceApi = {
  listDevices: (
    token: string,
    microcontrollerUuid: string,
    params?: Record<string, any>
  ) =>
    axiosClient.get(microcontrollerDevicesPath(microcontrollerUuid), {
      ...authHeaders(token),
      params,
    }),

  getDevice: (
    token: string,
    deviceId: number,
    microcontrollerUuid?: string,
    params?: Record<string, any>
  ) => {
    if (microcontrollerUuid) {
      return axiosClient.get(devicePath(microcontrollerUuid, deviceId), {
        ...authHeaders(token),
        params,
      });
    }
    return axiosClient.get(`${API_URL}/devices/${deviceId}`, authHeaders(token));
  },

  createDevice: (token: string, microcontrollerUuid: string, payload: any) =>
    axiosClient.post(microcontrollerDevicesPath(microcontrollerUuid), payload, {
      ...authHeaders(token),
    }),

  updateDevice: (
    token: string,
    microcontrollerUuid: string,
    deviceId: number,
    payload: any
  ) =>
    axiosClient.put(devicePath(microcontrollerUuid, deviceId), payload, {
      ...authHeaders(token),
    }),

  deleteDevice: (token: string, microcontrollerUuid: string, deviceId: number) =>
    axiosClient.delete(devicePath(microcontrollerUuid, deviceId), {
      ...authHeaders(token),
    }),

  setManualState: (
    token: string,
    deviceId: number,
    state: boolean,
    microcontrollerUuid?: string
  ) => {
    if (microcontrollerUuid) {
      return axiosClient.patch(
        `${devicePath(microcontrollerUuid, deviceId)}/manual_state`,
        { state },
        authHeaders(token)
      );
    }
    return axiosClient.patch(
      `${API_URL}/devices/${deviceId}/manual_state`,
      { state },
      authHeaders(token)
    );
  },
};
