import axiosClient from "./axiosClient";

export const authApi = {
  login: (data: { email: string; password: string }) =>
    axiosClient.post("/auth/login", data),

  register: (data: { email: string; password: string }) =>
    axiosClient.post("/auth/register", data),

  confirmEmail: (token: string) =>
    axiosClient.post("/auth/confirm", { token }),

  refreshToken: (refreshToken: string) =>
    axiosClient.post("/auth/refresh", {
      refresh_token: refreshToken,
    }),

  requestPasswordReset: (email: string) =>
    axiosClient.post("/auth/password-reset/request", { email }),

  changePassword: (body: {
    current_password: string;
    new_password: string;
  }) =>
    axiosClient.post("/auth/change-password", body),

  confirmPasswordReset: (body: {
    token: string;
    new_password: string;
  }) =>
    axiosClient.post("/auth/password-reset/confirm", body),
};
