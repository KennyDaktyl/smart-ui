import axiosClient from "./axiosClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const deviceEventsApi = {
  getDeviceEvents: (token: string, id: number, dateStart: string, dateEnd: string) =>
    axiosClient.get(`${API_URL}/device-events/device/${id}`, {
      params: { date_start: dateStart, date_end: dateEnd },
      headers: { Authorization: `Bearer ${token}` },
    }),
};
