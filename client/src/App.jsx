import { useEffect, useState } from "react";
import "./App.css";

import SearchForm from "./Components/SearchForm";
import StatsCard from "./Components/StatsCard";
import TrendChart from "./Components/TrendChart";
import ComplaintList from "./Components/ComplaintList";
import SavedAlerts from "./Components/SavedAlerts";
import AuthForm from "./Components/AuthForm";
import NotificationSettings from "./Components/NotificationSettings";

import { useAuth } from "./context/AuthContext";
import { useComplaintTypes } from "./hooks/useComplaintTypes";
import { useComplaints } from "./hooks/useComplaints";
import { useTrend } from "./hooks/useTrend";
import { useAlerts } from "./hooks/useAlerts";

function App() {
  const { user, token, registerUser, loginUser, logoutUser, updateNotificationSettings } =
    useAuth();
  const complaintTypes = useComplaintTypes();
  const { complaints, searchComplaints, clearComplaints } = useComplaints();
  const { stats, trendData, analyzeTrend, clearTrend } = useTrend();
  const { savedAlerts, fetchSavedAlerts, saveAlert, deleteAlert, toggleAlertStatus, clearAlerts } =
    useAlerts();

  const [zip, setZip] = useState("");
  const [complaintType, setComplaintType] = useState("");
  const [threshold, setThreshold] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("explore");

  // Loads saved alerts whenever a user becomes logged in (page load with a
  // stored session, or a fresh login/register), and clears them on logout.
  useEffect(() => {
    if (user) {
      fetchSavedAlerts();
    } else {
      clearAlerts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRegister = async (formData) => {
    try {
      setError("");
      await registerUser(formData);
    } catch (err) {
      console.error(err);
      setError("Could not register.");
    }
  };

  const handleLogin = async (formData) => {
    try {
      setError("");
      await loginUser(formData);
      setView("explore");
    } catch (err) {
      console.error(err);
      setError("Could not log in.");
    }
  };

  const handleLogout = () => {
    logoutUser();
    setError("");
    setView("login");
  };

  const handleSearchComplaints = async () => {
    if (!zip) {
      setError("Please enter a ZIP code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      clearTrend();

      await searchComplaints(zip, complaintType);
    } catch (err) {
      console.error(err);
      setError("Could not fetch complaints.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeTrend = async () => {
    if (!zip || !complaintType) {
      setError("Please enter a ZIP code and select a complaint type.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await analyzeTrend(zip, complaintType);
    } catch (err) {
      console.error(err);
      setError("Could not analyze trend.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAlert = async () => {
    if (!user || !token) {
      setError("Please log in before saving an alert.");
      return;
    }

    if (!zip || !complaintType || threshold === "") {
      setError(
        "Please enter a ZIP code, complaint type, and threshold before saving an alert."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      await saveAlert({ zip, complaintType, threshold });
    } catch (err) {
      console.error(err);
      setError("Could not save alert.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (id) => {
    try {
      setLoading(true);
      setError("");

      await deleteAlert(id);
    } catch (err) {
      console.error(err);
      setError("Could not delete alert.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAlertStatus = async (id, currentStatus) => {
    try {
      setLoading(true);
      setError("");

      await toggleAlertStatus(id, currentStatus);
    } catch (err) {
      console.error(err);
      setError("Could not update alert.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotificationSettings = async (settings) => {
    try {
      setError("");
      await updateNotificationSettings(settings);
    } catch (err) {
      console.error(err);
      setError("Could not update notification settings.");
    }
  };

  const goHome = () => {
    setView("explore");
    setZip("");
    setComplaintType("");
    setThreshold("");
    clearComplaints();
    clearTrend();
    setError("");
  };

  return (
    <main className="app">
      <h1 onClick={goHome} className="site-title">
        NYC 311 Complaint Explorer
      </h1>

      <nav className="app-nav">
        <div className="nav-left">
          {view !== "explore" && (
            <button onClick={() => setView("explore")}>Explore</button>
          )}

          {user && view !== "alerts" && (
            <button onClick={() => setView("alerts")}>My Alerts</button>
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
            <button onClick={() => setView("login")}>Log In</button>
          )}
        </div>
      </nav>

      {view === "explore" && (
        <>
          <p>Search recent 311 complaints by ZIP code and complaint type.</p>

          <SearchForm
            zip={zip}
            setZip={setZip}
            complaintType={complaintType}
            setComplaintType={setComplaintType}
            complaintTypes={complaintTypes}
            threshold={threshold}
            setThreshold={setThreshold}
            searchComplaints={handleSearchComplaints}
            analyzeTrend={handleAnalyzeTrend}
          />

          {loading && <p>Loading complaints...</p>}

          {error && <p className="error">{error}</p>}

          {stats && (
            <StatsCard stats={stats} threshold={threshold} saveAlert={handleSaveAlert} />
          )}

          {trendData.length > 0 && <TrendChart trendData={trendData} />}

          <ComplaintList complaints={complaints} />
        </>
      )}

      {view === "alerts" && user && (
        <>
          <NotificationSettings
            user={user}
            updateNotificationSettings={handleUpdateNotificationSettings}
          />

          <SavedAlerts
            savedAlerts={savedAlerts}
            deleteAlert={handleDeleteAlert}
            toggleAlertStatus={handleToggleAlertStatus}
          />
        </>
      )}

      {view === "login" && !user && (
        <section className="login-page">
          <AuthForm registerUser={handleRegister} loginUser={handleLogin} />
        </section>
      )}
    </main>
  );
}

export default App;
