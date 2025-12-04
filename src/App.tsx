import { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import MyInstallationsPage from "./pages/inverters/Inverters";
import UsersListPage from "./pages/admin/UsersListPage";
import AppHeader from "./components/Layout/AppHeader";
import HuaweiPage from "./pages/user/HuaweiPage";
import AccountPage from "./pages/user/AccountPage";
import RaspberriesPage from "./pages/raspberries/RaspberriesPage";

export default function App() {
  const auth = useContext(AuthContext);

  if (auth?.loading) {
    return <div>Ładowanie danych użytkownika...</div>;
  }

  const isPublic = !auth?.token;

  return (
    <>
      {!isPublic && <AppHeader />}

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

        {/* dashboard użytkownika */}
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
    </>
  );
}
