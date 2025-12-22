import axiosClient from "./axiosClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const authApi = {
  login: async (data: { email: string; password: string }) => {
    return axiosClient.post(`${API_URL}/auth/login`, data);
  },

  register: async (data: { email: string; password: string }) => {
    return axiosClient.post(`${API_URL}/auth/register`, data);
  },

  confirmRegistration: async (body: Record<string, any>) => {
    return axiosClient.post(`${API_URL}/auth/confirm`, body);
  },

  refreshToken: async (refreshToken: string) => {
    return axiosClient.post(`${API_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
  },

  getMe: async (token: string) => {
    return axiosClient.get(`${API_URL}/auth/me`, authHeaders(token));
  },

  requestPasswordReset: async (email: string) => {
    return axiosClient.post(`${API_URL}/auth/password-reset/request`, { email });
  },

  confirmPasswordReset: async (body: Record<string, any>) => {
    return axiosClient.post(`${API_URL}/auth/password-reset/confirm`, body);
  },
};
