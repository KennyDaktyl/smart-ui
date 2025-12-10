import { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import ProtectedRoute from "./features/common/ProtectedRoute";
import { Box, Toolbar } from "@mui/material";
import { useTranslation } from "react-i18next";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import MyInstallationsPage from "./pages/installations/InstallationsPage";
import UsersListPage from "./pages/admin/UsersListPage";
import AppHeader from "./layout/AppHeader";
import HuaweiPage from "./pages/user/HuaweiPage";
import AccountPage from "./pages/user/AccountPage";
import RaspberriesPage from "./pages/raspberries/RaspberriesPage";
import DeviceDetailsPage from "./pages/devices/DeviceDetailsPage";

export default function App() {
  const auth = useContext(AuthContext);
  const { t } = useTranslation();

  if (auth?.loading) {
    return <div>{t("common.loadingUser")}</div>;
  }

  const isPublic = !auth?.token;

  return (
    <>
      {!isPublic && <AppHeader />}
      {!isPublic && <Toolbar />}

      <Box
        sx={{
          px: { xs: 1.5, sm: 3 },
          pb: 5,
          maxWidth: 1280,
          mx: "auto",
          width: "100%",
        }}
      >
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              auth?.token ? (
                <Navigate
                  to={auth?.user?.role === "admin" ? "/admin" : "/dashboard"}
                  replace
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MyInstallationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/raspberries"
            element={
              <ProtectedRoute>
                <RaspberriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/raspberries/:raspberryId/devices/:id"
            element={
              <ProtectedRoute>
                <DeviceDetailsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/huawei"
            element={
              <ProtectedRoute>
                <HuaweiPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <UsersListPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </>
  );
}
