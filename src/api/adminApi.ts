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
    return axiosClient.get(`${API_URL}/users/details/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
