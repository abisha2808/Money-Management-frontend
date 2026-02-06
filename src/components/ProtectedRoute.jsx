import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const raw = localStorage.getItem("authUser");
  const isLoggedIn = !!raw;

  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
}