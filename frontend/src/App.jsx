import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { io } from "socket.io-client";
import "./styles/animations.css";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProtectedRoute from "./components/ProtectedRoute";
import ProjectDetail from "./pages/ProjectDetail";
import Search from "./pages/Search";
import NotificationDropdown from "./components/NotificationDropdown";

function App() {
  const { token, setToken, setUser, user } = useContext(AuthContext);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

  const logout = () => {
    setToken(null);
    setUser(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // Initialize Socket.IO connection
  useEffect(() => {
    if (token && user) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      const newSocket = io(socketUrl);
      setSocket(newSocket);

      // Join user-specific room for notifications
      newSocket.emit('joinUser', user._id);

      // Listen for real-time notifications
      newSocket.on('notification', (data) => {
        console.log('Received notification:', data);
        // Refresh unread count
        fetchUnreadCount();
        // Show notification toast (optional)
        if (data.type === 'invitation') {
          // You can add a toast notification here
          console.log('New invitation received!');
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [token, user]);

  // Fetch unread notification count
  useEffect(() => {
    if (token) {
      fetchUnreadCount();
    }
  }, [token]);

  const fetchUnreadCount = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const res = await fetch(
        `${apiUrl}/notifications/unread-count`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  return (
    <ToastProvider>
    <Router>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-800 text-white px-8 py-6 flex justify-between items-center shadow-lg">
        <div className="flex gap-8">
          <Link
            to="/dashboard"
            className="hover:text-gray-300 text-lg font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-700"
          >
            Dashboard
          </Link>
          <Link
            to="/projects"
            className="hover:text-gray-300 text-lg font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-700"
          >
            Projects
          </Link>
          <Link
            to="/search"
            className="hover:text-gray-300 text-lg font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-700"
          >
            Search
          </Link>
        </div>
        <div className="flex gap-6 items-center">
          {token ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-3 text-white hover:text-gray-300 transition-colors group"
                >
                  <svg
                    className="w-6 h-6 group-hover:animate-pulse"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.73 21a2 2 0 0 1-3.46 0"
                    />
                  </svg>
                  {/* Notification Badge */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                <NotificationDropdown
                  isOpen={isNotificationOpen}
                  onClose={() => setIsNotificationOpen(false)}
                  onNotificationUpdate={fetchUnreadCount}
                />
              </div>

              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hover:text-gray-300 text-lg font-medium transition-colors px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="hover:text-gray-300 text-lg font-medium transition-colors px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Page Content with top padding so it won't go under navbar */}
      <div className="pt-24">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            }
          />
          <Route path="/search" element={<Search />} />
        </Routes>
      </div>
    </Router>
    </ToastProvider>
  );
}

export default App;
