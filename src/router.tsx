import { Navigate } from "react-router-dom";
import RegisterPage from "./pages/auth/RegisterPage";
import LoginPage from "./pages/auth/LoginPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import MyInstallationsPage from "./pages/inverters/Inverters";
import UsersListPage from "./pages/admin/UsersListPage";
import { AuthContextProps } from "./context/AuthContext";
import RaspberriesPage from "./pages/raspberries/RaspberriesPage";

const routes = (auth: AuthContextProps | null) => [
  {
    path: "/",
    element: <Navigate to={auth?.user?.role === "admin" ? "/admin2" : "/dashboard"} replace />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <MyInstallationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/raspberries",
    element: (
      <ProtectedRoute>
        <RaspberriesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin2",
    element: (
      <ProtectedRoute>
        <UsersListPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
];

export default routes;
