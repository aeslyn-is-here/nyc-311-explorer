import { useState } from "react";

import SearchForm from "../Components/SearchForm";
import StatsCard from "../Components/StatsCard";
import TrendChart from "../Components/TrendChart";
import ComplaintList from "../Components/ComplaintList";

import { useAuth } from "../context/AuthContext";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import { useComplaints } from "../hooks/useComplaints";
import { useTrend } from "../hooks/useTrend";
import { useAlerts } from "../hooks/useAlerts";

function ExplorePage() {
  const { user, token } = useAuth();
  const complaintTypes = useComplaintTypes();
  const { complaints, searchComplaints } = useComplaints();
  const { stats, trendData, analyzeTrend, clearTrend } = useTrend();
  const { saveAlert } = useAlerts();

  const [zip, setZip] = useState("");
  const [complaintType, setComplaintType] = useState("");
  const [threshold, setThreshold] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  return (
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
  );
}

export default ExplorePage;
