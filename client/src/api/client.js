import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attaches the Bearer token to every request when a user is logged in,
// so callers never have to rebuild the Authorization header themselves.
// Reading straight from localStorage (rather than React state) keeps this
// in sync even outside a component, and matches what AuthContext persists.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default apiClient;
