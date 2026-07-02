import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

import SearchForm from "./Components/SearchForm";
import StatsCard from "./Components/StatsCard";
import TrendChart from "./Components/TrendChart";
import ComplaintList from "./Components/ComplaintList";
import SavedAlerts from "./Components/SavedAlerts";
import AuthForm from "./Components/AuthForm";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [complaintTypes, setComplaintTypes] = useState([]);
  const [zip, setZip] = useState("");
  const [complaintType, setComplaintType] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [threshold, setThreshold] = useState("");
  const [trendData, setTrendData] = useState([]);
  const [savedAlerts, setSavedAlerts] = useState([]);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    const fetchComplaintTypes = async () => {
      const response = await axios.get(`${API_BASE_URL}/api/complaint-types`);
      setComplaintTypes(response.data);
    };

    fetchComplaintTypes();
  }, []);

  useEffect(() => {
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (storedToken && storedUser) {
    setToken(storedToken);
    setUser(JSON.parse(storedUser));
    fetchSavedAlerts(storedToken);
  }
}, []);

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchSavedAlerts = async (authToken = token) => {
    if (!authToken) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/api/alerts`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      setSavedAlerts(response.data);
    } catch (err) {
      console.error(err);
      setError("Could not load saved alerts.");
    }
  };

  const registerUser = async ({ name, email, password }) => {
    try {
      setError("");

      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name,
        email,
        password,
      });

      setToken(response.data.token);
      setUser(response.data.user);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );
      await fetchSavedAlerts(response.data.token);
    } catch (err) {
      console.error(err);
      setError("Could not register.");
    }
  };

  const loginUser = async ({ email, password }) => {
    try {
      setError("");

      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      setToken(response.data.token);
      setUser(response.data.user);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );
      await fetchSavedAlerts(response.data.token);
    } catch (err) {
      console.error(err);
      setError("Could not log in.");
    }
  };

  const logoutUser = () => {
    setUser(null);
    setToken("");
    setSavedAlerts([]);
    setError("");

    localStorage.removeItem("token");
    localStorage.removeItem("user");
};

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

      const response = await axios.get(`${API_BASE_URL}/api/complaints`, {
        params: {
          zip,
          complaintType,
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

      const response = await axios.get(`${API_BASE_URL}/api/stats`, {
        params: {
          zip,
          complaintType,
        },
      });

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
      const response = await axios.get(`${API_BASE_URL}/api/trend`, {
        params: {
          zip,
          complaintType,
        },
      });

      setTrendData(response.data.trendData);
    } catch (err) {
      console.error(err);
      setError("Could not load trend data.");
    }
  };

  const saveAlert = async () => {
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

      await axios.post(
        `${API_BASE_URL}/api/alerts`,
        {
          zip,
          complaintType,
          threshold,
        },
        authHeaders
      );

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

      await axios.delete(`${API_BASE_URL}/api/alerts/${id}`, authHeaders);

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

      await axios.patch(
        `${API_BASE_URL}/api/alerts/${id}`,
        {
          isActive: !currentStatus,
        },
        authHeaders
      );

      await fetchSavedAlerts();
    } catch (err) {
      console.error(err);
      setError("Could not update alert.");
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => {
    setZip("");
    setComplaintType("");
    setThreshold("");
    setComplaints([]);
    setStats(null);
    setTrendData([]);
    setError("");
  };

  return (
    <main className="app">
      <h1 onClick={goHome} className="site-title">
        NYC 311 Complaint Explorer
      </h1>

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
        <StatsCard stats={stats} threshold={threshold} saveAlert={saveAlert} />
      )}

      {trendData.length > 0 && <TrendChart trendData={trendData} />}

      {user ? (
        <>

          <SavedAlerts
            user={user}
            logoutUser={logoutUser}
            savedAlerts={savedAlerts}
            deleteAlert={deleteAlert}
            toggleAlertStatus={toggleAlertStatus}
          />
        </>
      ) : (
        <AuthForm registerUser={registerUser} loginUser={loginUser} />
      )}

      <ComplaintList complaints={complaints} />
    </main>
  );
}

export default App;