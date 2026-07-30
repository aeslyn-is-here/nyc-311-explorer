import { useState } from "react";
import apiClient from "../api/client";

export function useTrend() {
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);

  const fetchTrendData = async (zip, complaintType) => {
    const response = await apiClient.get("/api/trend", {
      params: { zip, complaintType },
    });

    setTrendData(response.data.trendData);
  };

  const analyzeTrend = async (zip, complaintType) => {
    const response = await apiClient.get("/api/stats", {
      params: { zip, complaintType },
    });

    setStats(response.data);
    await fetchTrendData(zip, complaintType);
  };

  const clearTrend = () => {
    setStats(null);
    setTrendData([]);
  };

  return { stats, trendData, analyzeTrend, clearTrend };
}
