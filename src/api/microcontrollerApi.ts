import axiosClient from "./axiosClient";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

const basePath = `${API_URL}/microcontrollers`;
const microcontrollerPath = (uuid: string) => `${basePath}/${uuid}`;

export const microcontrollerApi = {
  /* =========================
   * LIST / GET
   * ========================= */
  getMicrocontrollers: (
    token: string,
    params?: { limit?: number; offset?: number; admin_list?: boolean }
  ) =>
    axiosClient.get(basePath, {
      ...authHeaders(token),
      params,
    }),

  getMicrocontrollerByUuid: (token: string, uuid: string) =>
    axiosClient.get(microcontrollerPath(uuid), authHeaders(token)),

  /* =========================
   * CREATE / UPDATE / DELETE
   * ========================= */
  createMicrocontroller: (token: string, payload: any) =>
    axiosClient.post(basePath, payload, authHeaders(token)),

  updateMicrocontroller: (
    token: string,
    uuid: string,
    payload: any
  ) =>
    axiosClient.put(microcontrollerPath(uuid), payload, authHeaders(token)),

  patchMicrocontroller: (token: string, uuid: string, payload: any) =>
    axiosClient.patch(microcontrollerPath(uuid), payload, authHeaders(token)),

  deleteMicrocontroller: (token: string, uuid: string) =>
    axiosClient.delete(microcontrollerPath(uuid), authHeaders(token)),

  updateMicrocontrollerStatus: (
    token: string,
    uuid: string,
    payload: { enabled: boolean }
  ) =>
    axiosClient.patch(
      `${microcontrollerPath(uuid)}/status`,
      payload,
      authHeaders(token)
    ),

  /* =========================
   * SENSORS
   * ========================= */
  getMicrocontrollerSensors: (token: string, uuid: string) =>
    axiosClient.get(`${microcontrollerPath(uuid)}/sensors`, authHeaders(token)),

  updateMicrocontrollerSensors: (
    token: string,
    uuid: string,
    payload: { assigned_sensors: string[] }
  ) =>
    axiosClient.patch(
      `${microcontrollerPath(uuid)}/sensors`,
      payload,
      authHeaders(token)
    ),

  /* =========================
   * PROVIDERS
   * ========================= */
  updateMicrocontrollerPowerProvider: (
    token: string,
    uuid: string,
    payload: any
  ) =>
    axiosClient.patch(
      `${microcontrollerPath(uuid)}/power-provider`,
      payload,
      authHeaders(token)
    ),

  attachProvider: (
    token: string,
    uuid: string,
    payload: { provider_id: string | null }
  ) =>
    axiosClient.post(
      `${microcontrollerPath(uuid)}/attach-provider`,
      payload,
      authHeaders(token)
    ),

  /* =========================
   * DEVICES
   * ========================= */
  createDevice: (
    token: string,
    microcontrollerUuid: string,
    payload: any
  ) =>
    axiosClient.post(
      `${microcontrollerPath(microcontrollerUuid)}/devices`,
      payload,
      authHeaders(token)
    ),

  createDeviceAutoConfig: (
    token: string,
    microcontrollerUuid: string,
    deviceId: number,
    payload: any
  ) =>
    axiosClient.post(
      `${microcontrollerPath(microcontrollerUuid)}/devices/${deviceId}/auto-config`,
      payload,
      authHeaders(token)
    ),
};
