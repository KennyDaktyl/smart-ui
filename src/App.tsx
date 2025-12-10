import { Suspense, lazy, useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import ProtectedRoute from "./features/common/ProtectedRoute";
import { Box, CircularProgress, Toolbar } from "@mui/material";
import { useTranslation } from "react-i18next";

import AppHeader from "./layout/AppHeader";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const MyInstallationsPage = lazy(() => import("./pages/installations/InstallationsPage"));
const UsersListPage = lazy(() => import("./pages/admin/UsersListPage"));
const HuaweiPage = lazy(() => import("./pages/user/HuaweiPage"));
const AccountPage = lazy(() => import("./pages/user/AccountPage"));
const RaspberriesPage = lazy(() => import("./pages/raspberries/RaspberriesPage"));
const DeviceDetailsPage = lazy(() => import("./pages/devices/DeviceDetailsPage"));

export default function App() {
  const auth = useContext(AuthContext);
  const { t } = useTranslation();

  if (auth?.loading) {
    return <div>{t("common.loadingUser")}</div>;
  }

  const isPublic = !auth?.token;

  const renderSpinner = (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.75)",
        zIndex: 1200,
      }}
    >
      <CircularProgress />
    </Box>
  );

  return (
    <>
      {!isPublic && <AppHeader />}
      {!isPublic && <Toolbar />}

      <Box
        sx={{
          px: { xs: 0.75, sm: 2, md: 3 },
          pb: 5,
          maxWidth: { xs: "100%", lg: 1320 },
          mx: "auto",
          width: "100%",
        }}
      >
        <Suspense fallback={renderSpinner}>
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
        </Suspense>
      </Box>
    </>
  );
}
