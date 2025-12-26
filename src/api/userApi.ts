import { get } from "node_modules/axios/index.cjs";
import axiosClient from "./axiosClient";

export const userApi = {
  getMe: () => {
    return axiosClient.get("/users/me");
  },

  getUserDetails: () => {
    return axiosClient.get("/users/me/details");
  },

  updateProfile: (payload: Record<string, any>) => {
    return axiosClient.patch("/users/me", payload);
  },

  getProfileDetails: () => {
    return axiosClient.get("/users/me/profile");
  },

  updateProfileDetails: (payload: Record<string, any>) => {
    return axiosClient.patch("/users/me/profile", payload);
  },
};
