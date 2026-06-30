import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import SearchForm from "./Components/SearchForm";
import StatsCard from "./Components/StatsCard";
import TrendChart from "./Components/TrendChart";
import ComplaintList from "./Components/ComplaintList";
import SavedAlerts from "./Components/SavedAlerts";

function App() {
  const [complaintTypes, setComplaintTypes] = useState([]);
  const [zip, setZip] = useState("");
  const [complaintType, setComplaintType] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [threshold, setThreshold] = useState(50);
  const [trendData, setTrendData] = useState([]);
  const [savedAlerts, setSavedAlerts] = useState([]);

  useEffect(() => {
  const fetchComplaintTypes = async () => {
    const response = await axios.get(
      "http://localhost:5001/api/complaint-types"
    );

    setComplaintTypes(response.data);
  };

  fetchComplaintTypes();
  fetchSavedAlerts();
}, []);

  const searchComplaints = async () => {
    if (!zip) {
      setError("Please enter a ZIP code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setStats(null);
      setTrendData([]);

      const response = await axios.get(
        "http://localhost:5001/api/complaints",
        {
          params: {
            zip,
            complaintType,
          },
        }
      );

      setComplaints(response.data);
    } catch (err) {
      console.error(err);
      setError("Could not fetch complaints.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeTrend = async () => {
    if (!zip || !complaintType) {
      setError("Please enter a ZIP code and select a complaint type.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        "http://localhost:5001/api/stats",
        {
          params: {
            zip,
            complaintType,
          },
        }
      );

      setStats(response.data);

      await fetchTrendData();
    } catch (err) {
      console.error(err);
      setError("Could not analyze trend.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendData = async () => {
    if (!zip || !complaintType) {
      setError("Please enter a ZIP code and select a complaint type.");
      return;
    }

    try {
      const response = await axios.get(
        "http://localhost:5001/api/trend",
        {
          params: {
            zip,
            complaintType,
          },
        }
      );

      setTrendData(response.data.trendData);
    } catch (err) {
      console.error(err);
      setError("Could not load trend data.");
    }
  };

  const fetchSavedAlerts = async () => {
  try {
    const response = await axios.get("http://localhost:5001/api/alerts");
    setSavedAlerts(response.data);
  } catch (err) {
    console.error(err);
    setError("Could not load saved alerts.");
  }
};

const saveAlert = async () => {
  if (!zip || !complaintType) {
    setError("Please enter a ZIP code and select a complaint type before saving an alert.");
    return;
  }

  try {
    setLoading(true);
    setError("");

    await axios.post("http://localhost:5001/api/alerts", {
      zip,
      complaintType,
      threshold,
    });

    await fetchSavedAlerts();
  } catch (err) {
    console.error(err);
    setError("Could not save alert.");
  } finally {
    setLoading(false);
  }
};

const deleteAlert = async (id) => {
  try {
    setLoading(true);
    setError("");

    await axios.delete(`http://localhost:5001/api/alerts/${id}`);

    await fetchSavedAlerts();
  } catch (err) {
    console.error(err);
    setError("Could not delete alert.");
  } finally {
    setLoading(false);
  }
};

const toggleAlertStatus = async (id, currentStatus) => {
  try {
    setLoading(true);
    setError("");

    await axios.patch(`http://localhost:5001/api/alerts/${id}`, {
      isActive: !currentStatus,
    });

    await fetchSavedAlerts();
  } catch (err) {
    console.error(err);
    setError("Could not update alert.");
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="app">
      <h1>NYC 311 Complaint Explorer</h1>

      <p>Search recent 311 complaints by ZIP code and complaint type.</p>

      <SearchForm
        zip={zip}
        setZip={setZip}
        complaintType={complaintType}
        setComplaintType={setComplaintType}
        complaintTypes={complaintTypes}
        threshold={threshold}
        setThreshold={setThreshold}
        searchComplaints={searchComplaints}
        analyzeTrend={analyzeTrend}
      />

      {loading && <p>Loading complaints...</p>}

      {error && <p className="error">{error}</p>}

      {stats && (
        <StatsCard
          stats={stats}
          threshold={threshold}
          saveAlert={saveAlert}
        />
      )}

      {trendData.length > 0 && (
        <TrendChart trendData={trendData} />
      )}

      <SavedAlerts
        savedAlerts={savedAlerts}
        deleteAlert={deleteAlert}
        toggleAlertStatus={toggleAlertStatus}
      />

      <ComplaintList complaints={complaints} />
    </main>
  );
}

export default App;