import axios, { AxiosError, AxiosRequestConfig } from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

/**
 * Endpointy, których NIE wolno obsługiwać przez refresh
 */
const AUTH_EXCLUDED_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/confirm",
  "/auth/password-reset/request",
  "/auth/password-reset/confirm",
  "/auth/refresh", // ⛔ bardzo ważne
  "/public/contact-lead",
];

declare module "axios" {
  export interface AxiosRequestConfig {
    _retry?: boolean;
    _retryCount?: number;
  }
}

const redirectToLogin = () => {
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

const axiosClient = axios.create({
  baseURL: API_URL,
});

let isRefreshing = false;

let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token as string);
  });
  failedQueue = [];
};

/* ======================
   REQUEST INTERCEPTOR
====================== */
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  Promise.reject
);

/* ======================
   RESPONSE INTERCEPTOR
====================== */
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig;
    const url = originalRequest?.url ?? "";

    const isAuthRoute = AUTH_EXCLUDED_ROUTES.some((route) =>
      url.includes(route)
    );

    if (isAuthRoute) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // 🔁 max 2 próby
    originalRequest._retryCount = originalRequest._retryCount ?? 0;
    if (originalRequest._retryCount >= 2) {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest._retryCount += 1;

    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      localStorage.removeItem("token");
      redirectToLogin();
      return Promise.reject(error);
    }

    // 🔁 kolejka gdy refresh już trwa
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosClient(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      // ✅ KLUCZOWE: zgodne z FastAPI (embed=True)
      const res = await axios.post(`${API_URL}/auth/refresh`, {
        refresh_token_body: refreshToken,
      });

      const { access_token, refresh_token } = res.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("refresh_token", refresh_token);

      processQueue(null, access_token);

      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${access_token}`;

      return axiosClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosClient;
