import { createContext, useState, useEffect } from "react";
import { fetchProfile } from "../utils/api";

/**
 * Authentication Context - manages user authentication state
 * Features:
 * - Automatic user profile loading on token availability
 * - Token persistence in localStorage
 * - Error handling for invalid tokens
 * - Loading states for authentication
 */
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // user info
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(false);

  // Save token when it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
      setUser(null); // Clear user when token is removed
    }
  }, [token]);

  // Load user data when token is available
  useEffect(() => {
    async function loadUser() {
      if (token && !user) {
        try {
          setLoading(true);
          const userData = await fetchProfile(token);
          setUser(userData);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // If token is invalid, clear it
          setToken(null);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadUser();
  }, [token, user]);

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
