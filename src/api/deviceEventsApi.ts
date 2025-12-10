import axiosClient from "./axiosClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const deviceEventsApi = {
  getDeviceEvents: (token: string, id: number, start: string, end: string) =>
    axiosClient.get(`${API_URL}/device-events/device/${id}`, {
      params: { start, end },
      headers: { Authorization: `Bearer ${token}` },
    }),
};
