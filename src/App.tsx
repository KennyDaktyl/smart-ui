import { Suspense, lazy, useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import ProtectedRoute from "./features/common/ProtectedRoute";
import { Box, CircularProgress, Toolbar } from "@mui/material";
import { useTranslation } from "react-i18next";

import AppHeader from "./layout/AppHeader";
import SmartEnergyFooter from "./components/SmartEnergyFooter";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const MyInstallationsPage = lazy(() => import("./pages/installations/InstallationsPage"));
const UsersListPage = lazy(() => import("./pages/admin/UsersListPage"));
const UserDetailsPage = lazy(() => import("./pages/admin/UserInstallationsPage"));
const HuaweiPage = lazy(() => import("./pages/user/HuaweiPage"));
const AccountPage = lazy(() => import("./pages/user/AccountPage"));
const RaspberriesPage = lazy(() => import("./pages/raspberries/RaspberriesPage"));
const DeviceDetailsPage = lazy(() => import("./pages/devices/DeviceDetailsPage"));
const LandingLayout = lazy(() => import("./front/LandingLayout"));
const HomePage = lazy(() => import("./front/HomePage"));
const OfferPage = lazy(() => import("./front/OfferPage"));
const PricingPage = lazy(() => import("./front/PricingPage"));
const ContactPage = lazy(() => import("./front/ContactPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));

export default function App() {
  const auth = useContext(AuthContext);
  const { t } = useTranslation();

  if (auth?.loading) {
    return <div>{t("common.loadingUser")}</div>;
  }

  const isPublic = !auth?.token;
  const authedHome = auth?.user?.role === "admin" ? "/admin" : "/dashboard";

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
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {!isPublic && <AppHeader />}
      {!isPublic && <Toolbar />}

      <Box sx={{ flex: 1, width: "100%" }}>
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
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              <Route
                path="/"
              element={
                auth?.token ? (
                  <Navigate to={authedHome} replace />
                ) : (
                  <LandingLayout showAuthPanel={false}>
                    <HomePage />
                  </LandingLayout>
                )
              }
            />

              <Route
                path="/offer"
                element={
                  auth?.token ? (
                    <Navigate to={authedHome} replace />
                  ) : (
                    <LandingLayout>
                      <OfferPage />
                    </LandingLayout>
                  )
                }
              />

              <Route
                path="/pricing"
                element={
                  auth?.token ? (
                    <Navigate to={authedHome} replace />
                  ) : (
                    <LandingLayout>
                      <PricingPage />
                    </LandingLayout>
                  )
                }
              />

              <Route
                path="/contact"
                element={
                  auth?.token ? (
                    <Navigate to={authedHome} replace />
                  ) : (
                    <LandingLayout>
                      <ContactPage />
                    </LandingLayout>
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
              <Route
                path="/admin/users/:userId"
                element={
                  <ProtectedRoute adminOnly>
                    <UserDetailsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Box>
      </Box>

      {!isPublic && (
        <Box
          sx={{
            px: { xs: 0.75, sm: 2, md: 3 },
            pb: 3,
            maxWidth: { xs: "100%", lg: 1320 },
            mx: "auto",
            width: "100%",
          }}
        >
          <SmartEnergyFooter />
        </Box>
      )}
    </Box>
  );
}
