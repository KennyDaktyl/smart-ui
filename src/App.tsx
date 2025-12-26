import { Suspense, lazy, useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import ProtectedRoute from "./features/common/ProtectedRoute";
import { useTranslation } from "react-i18next";

import AppShell from "./layout/AppShell";
import { UserRole } from "./features/users/types/role";
import CenteredSpinner from "./features/common/components/CenteredSpinner";
import { AdminUserDetails } from "./pages/admin/AdminUserDetails";
import { AdminUsersTab } from "./features/admin/tabs/AdminUsersTab";
import { AdminMicrocontrollersTab } from "./features/admin/tabs/AdminMicrocontrollersList";
import AdminMicrocontrollerDetailsPage from "./pages/admin/AdminMicrocontrollerDetailsPage";

const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
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
  const isAdmin = auth?.user?.role === UserRole.ADMIN;

  if (auth?.loading) {
    return <CenteredSpinner fullscreen />;
  }

  const isPublic = !auth?.token;
  const mode = isPublic ? "public" : "app";
  const authedHome = "/account";

  return (
    <AppShell mode={mode}>
      <Suspense fallback={<CenteredSpinner fullscreen overlay />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
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
              <ProtectedRoute>
                {isAdmin ? <AdminPage /> : <Navigate to="/account" replace />}
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="users" replace />} />
            <Route path="users" element={<AdminUsersTab />} />
            <Route path="microcontrollers" element={<AdminMicrocontrollersTab />} />
            <Route
              path="microcontrollers/:microcontrollerId"
              element={<AdminMicrocontrollerDetailsPage />}
            />
            <Route
              path="/admin/users/:userId"
              element={<AdminUserDetails />}
            />
          </Route>
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}
