import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import SearchForm from "./Components/SearchForm";
import StatsCard from "./Components/StatsCard";
import TrendChart from "./Components/TrendChart";
import ComplaintList from "./Components/ComplaintList";

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

  useEffect(() => {
    const fetchComplaintTypes = async () => {
      const response = await axios.get(
        "http://localhost:5001/api/complaint-types"
      );

      setComplaintTypes(response.data);
    };

    fetchComplaintTypes();
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
        />
      )}

      {trendData.length > 0 && (
        <TrendChart trendData={trendData} />
      )}

      <ComplaintList complaints={complaints} />
    </main>
  );
}

export default App;