import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { USER_ROLE_LABELS, type UserRole } from "@fredericton-grad-jobs/shared";
import { useAuth } from "@/auth/AuthContext";
import AccessDenied from "./AccessDenied";

type RequireRoleProps = {
  role: UserRole;
  children: ReactNode;
};

// Signed-out visitors go to /login?returnTo=<this page>; signed-in users
// with another role see a "not allowed" message. The API enforces the same
// rules; this only avoids showing pages that would fail.
const RequireRole = ({ role, children }: RequireRoleProps) => {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <p role="status" className="text-center text-gray-600 py-24 animate-pulse">
        Checking your account...
      </p>
    );
  }
  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }
  if (user.role !== role) {
    return <AccessDenied message={`This page is for ${USER_ROLE_LABELS[role].toLowerCase()} accounts.`} />;
  }
  return children;
};

export default RequireRole;
