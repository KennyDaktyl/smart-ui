import { Suspense, lazy, useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import ProtectedRoute from "./features/common/ProtectedRoute";
import { useTranslation } from "react-i18next";

import AppShell from "./layout/AppShell";
import CenteredSpinner from "./features/common/components/CenteredSpinner";
import { AdminShell } from "./features/admin/components/layout/AdminShell";
import ProvidersPage from "./pages/providers/ProvidersPage";
import ProviderTelemetryPage from "./pages/providers/ProviderTelemetryPage";
import DeviceDetailsPage from "./pages/devices/DeviceDetailsPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminUserDetailsPage } from "./pages/admin/AdminUserDetailsPage";
import { AdminMicrocontrollersPage } from "./pages/admin/AdminMicrocontrollersPage";
import AdminMicrocontrollerDetailsPage from "./pages/admin/AdminMicrocontrollerDetialsPage";
import MicrocontrollersPage from "./pages/microcontollers/microcontrollersPage";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ActivateAccountPage = lazy(() => import("./pages/auth/ActivateAccountPage"));
const AccountPage = lazy(() => import("./pages/user/AccountPage"));
const HomePage = lazy(() => import("./front/HomePage"));
const OfferPage = lazy(() => import("./front/OfferPage"));
const PricingPage = lazy(() => import("./front/PricingPage"));
const ContactPage = lazy(() => import("./front/ContactPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ConfirmEmailPage = lazy(() => import("./pages/auth/ConfirmEmailPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));
const NotFoundPage = lazy(() => import("./pages/common/NotFoundPage"));

export default function App() {
  const auth = useContext(AuthContext);
  const { t } = useTranslation();

  if (!auth || auth.initializing) {
    return <CenteredSpinner fullscreen />;
  }

  const isPublic = !auth?.token;
  const mode = isPublic ? "public" : "app";
  const authedHome = "/dashboard";

  return (
    <AppShell mode={mode}>
      <Suspense fallback={<CenteredSpinner fullscreen overlay />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/activate-account" element={<ActivateAccountPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/confirm-email" element={<ConfirmEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route
            path="/"
            element={
              isPublic ? (
                <HomePage />
              ) : (
                <Navigate to={authedHome} replace />
              )
            }
          />
          <Route
            path="/offer"
            element={
              isPublic ? (
                <OfferPage />
              ) : (
                <Navigate to={authedHome} replace />
              )
            }
          />
          <Route
            path="/pricing"
            element={
              isPublic ? (
                <PricingPage />
              ) : (
                <Navigate to={authedHome} replace />
              )
            }
          />
          <Route
            path="/contact"
            element={
              isPublic ? (
                <ContactPage />
              ) : (
                <Navigate to={authedHome} replace />
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
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
            path="/providers"
            element={
              <ProtectedRoute>
                <ProvidersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/providers/:providerUuid/telemetry"
            element={
              <ProtectedRoute>
                <ProviderTelemetryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/microcontrollers"
            element={
              <ProtectedRoute>
                <MicrocontrollersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/devices/:deviceId"
            element={
              <ProtectedRoute>
                <DeviceDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminShell />
              </ProtectedRoute>
            }
          >
            <Route element={<AdminPage />}>
              <Route index element={<Navigate to="users" replace />} />

              {/* USERS */}
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/:userId" element={<AdminUserDetailsPage />} />

              {/* MICROCONTROLLERS */}
              <Route
                path="microcontrollers"
                element={<AdminMicrocontrollersPage />}
              />
              <Route
                path="microcontrollers/:microcontrollerId"
                element={<AdminMicrocontrollerDetailsPage />}
              />
            </Route>
          </Route>
                    
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
