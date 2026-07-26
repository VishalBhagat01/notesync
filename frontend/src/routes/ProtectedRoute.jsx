import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/register" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;