import { createContext, useEffect, ReactNode, useState, useCallback } from "react";
import { UserResponse } from "@/features/users/types/user";
import { userApi } from "@/api/userApi";
import CenteredSpinner from "@/features/common/components/CenteredSpinner";

export interface AuthContextProps {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  initializing: boolean;
  authLoading: boolean;
  login: (token: string, refreshToken?: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const [initializing, setInitializing] = useState(true);

  const [authLoading, setAuthLoading] = useState(false);

  const isAuthenticated = !!token;

  const login = useCallback((jwt: string, refreshToken?: string) => {
    localStorage.setItem("token", jwt);
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }

    setToken(jwt);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");

    setUser(null);
    setToken(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;

    setAuthLoading(true);
    try {
      const res = await userApi.getMe();
      setUser(res.data);
    } catch {
      logout();
    } finally {
      setAuthLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!token) {
        setInitializing(false);
        return;
      }

      try {
        const res = await userApi.getMe();
        if (!cancelled) {
          setUser(res.data);
        }
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        initializing,
        authLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}

      {(initializing || authLoading) && (
        <CenteredSpinner fullscreen />
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
