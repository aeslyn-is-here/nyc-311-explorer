import { useEffect, useState } from "react";

import SavedAlerts from "../Components/SavedAlerts";
import NotificationSettings from "../Components/NotificationSettings";

import { useAuth } from "../context/AuthContext";
import { useAlerts } from "../hooks/useAlerts";

function AlertsPage() {
  const { user, updateNotificationSettings } = useAuth();
  const { savedAlerts, fetchSavedAlerts, deleteAlert, toggleAlertStatus } =
    useAlerts();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // This page is only reachable while logged in (see ProtectedRoute), so
  // it's safe to just fetch on mount — no need to watch auth state here.
  useEffect(() => {
    fetchSavedAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <>
      {loading && <p>Loading...</p>}

      {error && <p className="error">{error}</p>}

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
  );
}

export default AlertsPage;
