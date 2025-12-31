import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import CenteredSpinner from "@/features/common/components/CenteredSpinner";

export function AdminShell() {
  const { user, loading } = useAuth();

  if (loading) {
    return <CenteredSpinner fullscreen />;
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
}
