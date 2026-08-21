import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import "./App.css";

import ExplorePage from "./pages/ExplorePage";
import AlertsPage from "./pages/AlertsPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./Components/ProtectedRoute";

import { useAuth } from "./context/AuthContext";

function App() {
  const { user, logoutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <main className="app">
      <h1 onClick={() => navigate("/")} className="site-title">
        NYC 311 Complaint Explorer
      </h1>

      <nav className="app-nav">
        <div className="nav-left">
          {location.pathname !== "/" && (
            <button onClick={() => navigate("/")}>Explore</button>
          )}

          {user && location.pathname !== "/alerts" && (
            <button onClick={() => navigate("/alerts")}>My Alerts</button>
          )}
        </div>

        <div className="nav-right">
          {user ? (
            <>
              <span>
                Logged in as <strong>{user.name}</strong>
              </span>

              <button onClick={handleLogout}>Log Out</button>
            </>
          ) : (
            location.pathname !== "/login" && (
              <button onClick={() => navigate("/login")}>Log In</button>
            )
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<ExplorePage />} />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <AlertsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </main>
  );
}

export default App;
