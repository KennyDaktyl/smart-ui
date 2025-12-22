import axiosClient from "./axiosClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const userApi = {
  getUserDetails: async (token: string) => {
    return axiosClient.get(`${API_URL}/users/me/details`, authHeaders(token));
  },

  getUserInstallations: async (token: string) => {
    return axiosClient.get(`${API_URL}/users/me/installations`, authHeaders(token));
  },

  getHuaweiCredentials: async (token: string) => {
    return axiosClient.get(`${API_URL}/users/me/huawei-credentials`, authHeaders(token));
  },

  getProfile: async (token: string) => {
    return axiosClient.get(`${API_URL}/users/me`, authHeaders(token));
  },

  updateProfile: async (token: string, payload: Record<string, any>) => {
    return axiosClient.patch(`${API_URL}/users/me`, payload, authHeaders(token));
  },

  getProfileDetails: async (token: string) => {
    return axiosClient.get(`${API_URL}/users/me/profile`, authHeaders(token));
  },

  updateProfileDetails: async (token: string, payload: Record<string, any>) => {
    return axiosClient.patch(`${API_URL}/users/me/profile`, payload, authHeaders(token));
  },
};
