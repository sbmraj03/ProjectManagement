/**
 * PROTECTED ROUTE COMPONENT
 * Guards routes requiring authentication
 * Features: Token validation, redirect to login
 */
import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { token } = useContext(AuthContext);

  if (!token) {
    return <Navigate to="/login" />;
  }

  return children;
}
