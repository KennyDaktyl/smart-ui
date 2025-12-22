import axiosClient from "./axiosClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const adminApi = {
  getUsers: async (token: string, params?: { limit?: number; offset?: number }) => {
    return axiosClient.get(`${API_URL}/users/list`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
  },

  getUserDetails: async (token: string, userId: number) => {
    return axiosClient.get(`${API_URL}/users/${userId}/details`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  createMicrocontroller: async (token: string, userId: number, payload: any) => {
    return axiosClient.post(`${API_URL}/users/${userId}/microcontrollers`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  updateMicrocontroller: async (
    token: string,
    userId: number,
    microcontrollerUuid: string,
    payload: any
  ) => {
    return axiosClient.patch(
      `${API_URL}/users/${userId}/microcontrollers/${microcontrollerUuid}`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },
  deleteMicrocontroller: async (
    token: string,
    userId: number,
    microcontrollerUuid: string
  ) => {
    return axiosClient.delete(
      `${API_URL}/users/${userId}/microcontrollers/${microcontrollerUuid}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },
  getMicrocontroller: async (
    token: string,
    userId: number,
    microcontrollerUuid: string
  ) => {
    return axiosClient.get(
      `${API_URL}/users/${userId}/microcontrollers/${microcontrollerUuid}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },
  listMicrocontrollers: async (
    token: string,
    params?: { limit?: number; offset?: number }
  ) => {
    return axiosClient.get(`${API_URL}/admin/microcontrollers`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
  },
  getMicrocontrollerByUuid: async (token: string, uuid: string) => {
    return axiosClient.get(`${API_URL}/admin/microcontrollers/${uuid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  updateMicrocontrollerByUuid: async (token: string, uuid: string, payload: any) => {
    return axiosClient.patch(
      `${API_URL}/admin/microcontrollers/${uuid}`,
      payload,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },
  deleteMicrocontrollerByUuid: async (token: string, uuid: string) => {
    return axiosClient.delete(`${API_URL}/admin/microcontrollers/${uuid}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
