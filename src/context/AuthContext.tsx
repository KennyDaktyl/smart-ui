import { createContext, useEffect, ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { authApi } from "../api/authApi";

export interface AuthContextProps {
  user: any;
  token: string | null;
  login: (token: string, refreshToken?: string) => void;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const [authState, setAuthState] = useState({
    user: null,
    token: localStorage.getItem("token"),
    loading: true,
  });

  const login = (jwt: string, refreshToken?: string) => {
    localStorage.setItem("token", jwt);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    setAuthState((prev) => ({ ...prev, token: jwt }));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    setAuthState({ user: null, token: null, loading: false });
  };

  const refreshUser = async () => {
    if (!authState.token) return;
  
    try {
      const res = await authApi.getMe(authState.token);
      setAuthState((prev) => ({
        ...prev,
        user: res.data,
      }));
    } catch (err) {
      console.error("Failed to refresh user", err);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      if (!authState.token) {
        setAuthState((prev) => ({ ...prev, loading: false }));
        return;
      }

      try {
        const res = await authApi.getMe(authState.token);
        if (!cancelled) {
          setAuthState({
            user: res.data,
            token: authState.token,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) logout();
      }
    };

    loadUser();
    return () => {
      cancelled = true;
    };
  }, [authState.token]);

  if (authState.loading) {
    return <div>{t("common.loadingUser")}</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        token: authState.token,
        login,
        logout,
        loading: authState.loading,
        isAuthenticated: !!authState.token,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
