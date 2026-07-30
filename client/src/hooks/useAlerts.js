import { useState } from "react";
import apiClient from "../api/client";

export function useAlerts() {
  const [savedAlerts, setSavedAlerts] = useState([]);

  const fetchSavedAlerts = async () => {
    const response = await apiClient.get("/api/alerts");
    setSavedAlerts(response.data);
  };

  const saveAlert = async ({ zip, complaintType, threshold }) => {
    await apiClient.post("/api/alerts", { zip, complaintType, threshold });
    await fetchSavedAlerts();
  };

  const deleteAlert = async (id) => {
    await apiClient.delete(`/api/alerts/${id}`);
    await fetchSavedAlerts();
  };

  const toggleAlertStatus = async (id, currentStatus) => {
    await apiClient.patch(`/api/alerts/${id}`, { isActive: !currentStatus });
    await fetchSavedAlerts();
  };

  const clearAlerts = () => setSavedAlerts([]);

  return {
    savedAlerts,
    fetchSavedAlerts,
    saveAlert,
    deleteAlert,
    toggleAlertStatus,
    clearAlerts,
  };
}
