// src/App.js
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation
} from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './components/Login';
import UserDashboard from './pages/UserDashboard';
import AnalystDashboard from './pages/AnalystDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import AdminDashboard from './pages/AdminDashboard'; // <-- Import your AdminDashboard
import NormalUserPassesDashboard from './pages/NormalUserPassesDashboard';
import NormalUserBalanceDashboard from './pages/NormalUserBalanceDashboard';
import axios from 'axios';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await axios.get(
            'http://localhost:3000/api/auth/verify-token',
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (response.data.user) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('authToken');
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          console.error("Token verification failed:", error);
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Normalize user type (e.g. “ADMIN” → “admin”)
  const normalizedUserType = user && user.type ? user.type.toLowerCase().trim() : '';

  return (
    <Router>
      <div className="App">
        <ConditionalHeader setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
        <Routes>
          {/* If already logged in, go to /dashboard. Otherwise, show Login */}
          <Route
            path="/"
            element={
              isAuthenticated
                ? <Navigate to="/dashboard" replace />
                : <Login setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
            }
          />

          {/* ADMIN route (for user.type === “admin”) */}
          {isAuthenticated && user && normalizedUserType === "admin" && (
            <Route
              path="/dashboard"
              element={
                <AdminDashboard
                  user={user}
                  setIsAuthenticated={setIsAuthenticated}
                />
              }
            />
          )}

          {/* NORMAL USER route with nested “passes” & “balance” */}
          {isAuthenticated && user && normalizedUserType === "normal" && (
            <Route
              path="/dashboard/*"
              element={
                <UserDashboard
                  user={user}
                  setIsAuthenticated={setIsAuthenticated}
                  setUser={setUser}
                />
              }
            >
              <Route path="passes" element={<NormalUserPassesDashboard />} />
              <Route path="balance" element={<NormalUserBalanceDashboard />} />
              <Route
                index
                element={<div className="text-center">Select an option above.</div>}
              />
            </Route>
          )}

          {/* ANALYST route */}
          {isAuthenticated && user && normalizedUserType === "analyst" && (
            <Route
              path="/dashboard"
              element={
                <AnalystDashboard
                  user={user}
                  setIsAuthenticated={setIsAuthenticated}
                />
              }
            />
          )}

          {/* OPERATOR route (for type not “normal”, “analyst”, or “admin”) */}
          {isAuthenticated && user &&
            normalizedUserType !== "normal" &&
            normalizedUserType !== "analyst" &&
            normalizedUserType !== "admin" && (
              <Route
                path="/dashboard"
                element={
                  <OperatorDashboard
                    user={user}
                    setIsAuthenticated={setIsAuthenticated}
                  />
                }
              />
            )
          }

          {/* If none of the above match, fallback redirects to login. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

function ConditionalHeader({ setIsAuthenticated, setUser }) {
  const location = useLocation();
  const noHeaderRoutes = ['/'];
  if (noHeaderRoutes.includes(location.pathname)) {
    return null;
  }
  return <Header setIsAuthenticated={setIsAuthenticated} setUser={setUser} />;
}

export default App;
