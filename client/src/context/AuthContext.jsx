import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const persistAuth = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const registerUser = async ({ name, email, password }) => {
    const response = await apiClient.post("/api/auth/register", {
      name,
      email,
      password,
    });

    persistAuth(response.data.token, response.data.user);
  };

  const loginUser = async ({ email, password }) => {
    const response = await apiClient.post("/api/auth/login", {
      email,
      password,
    });

    persistAuth(response.data.token, response.data.user);
  };

  const logoutUser = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const updateNotificationSettings = async ({
    notificationMethod,
    slackWebhookUrl,
    emailNotificationAddress,
  }) => {
    const response = await apiClient.patch("/api/users/notification-settings", {
      notificationMethod,
      slackWebhookUrl,
      emailNotificationAddress,
    });

    updateUser(response.data);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        registerUser,
        loginUser,
        logoutUser,
        updateNotificationSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
