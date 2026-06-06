import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";

interface ProtectedRouteProps {
  role?: "student" | "owner" | "admin";
  children?: React.ReactNode;
}

export function ProtectedRoute({ role, children }: ProtectedRouteProps) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (role && profile.role !== role) {
    // Redirect based on the actual role of the user
    if (profile.role === "admin") return <Navigate to="/admin" replace />;
    if (profile.role === "owner") return <Navigate to="/owner" replace />;
    return <Navigate to="/home" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
