import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
    const response = await axios.get("http://localhost:5001/api/complaint-types");
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

      const response = await axios.get("http://localhost:5001/api/complaints", {
        params: {
          zip: zip,
          complaintType: complaintType,
        },
      });

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

    const response = await axios.get("http://localhost:5001/api/stats", {
      params: {
        zip: zip,
        complaintType: complaintType,
      },
    });

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

      <div className="search-box">
        <input
          type="text"
          placeholder="Enter ZIP code, e.g. 10002"
          value={zip}
          onChange={(event) => setZip(event.target.value)}
        />

        <select 
          value={complaintType}
          onChange={(event) => setComplaintType(event.target.value)}
        >
          <option value="">All complaint types</option>
          {complaintTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Spike threshold %"
          value={threshold}
          onChange={(event) => setThreshold(Number(event.target.value))}
        />

        <button onClick={searchComplaints}>Search</button>
        <button onClick={analyzeTrend}>Analyze Trend</button>
      </div>

      {loading && <p>Loading complaints...</p>}
      {error && <p className="error">{error}</p>}

      {stats && (
  <section className="stats-card">
    <h2>Trend Analysis</h2>
    <p><strong>ZIP:</strong> {stats.zip}</p>
    <p><strong>Complaint Type:</strong> {stats.complaintType}</p>
    <p><strong>Current 7 Days:</strong> {stats.currentWeek}</p>
    <p><strong>Previous 7 Days:</strong> {stats.previousWeek}</p>
    <p>
      <strong>Percent Change:</strong>{" "}
      {stats.percentChange === null
        ? "No previous complaints to compare"
        : `${stats.percentChange.toFixed(1)}%`}
    </p>

      {stats.percentChange !== null && stats.percentChange >= threshold ? (
        <p style={{ color: "red", fontWeight: "bold" }}>
            🚨 Spike detected
        </p>
      ) : (
        <p style={{ color: "green", fontWeight: "bold" }}>
          ✓ No spike detected
        </p>
      )}  

      <p><strong>Spike Threshold:</strong> {threshold}%</p>
  </section>
)}
  {trendData.length > 0 && (
    <section className="chart-card">
      <h2>14-Day Complaint Trend</h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            strokeWidth={2}
            dot={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  )}

      <section className="results">
        {complaints.map((complaint) => (
          <div className="complaint-card" key={complaint.unique_key}>
            <h2>{complaint.complaint_type}</h2>
            <p><strong>Status:</strong> {complaint.status}</p>
            <p><strong>Agency:</strong> {complaint.agency}</p>
            <p><strong>Descriptor:</strong> {complaint.descriptor || "N/A"}</p>
            <p><strong>Created:</strong> {complaint.created_date}</p>
            <p><strong>Borough:</strong> {complaint.borough}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

export default App;