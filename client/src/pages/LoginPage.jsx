import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthForm from "../Components/AuthForm";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { registerUser, loginUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleRegister = async (formData) => {
    try {
      setError("");
      await registerUser(formData);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Could not register.");
    }
  };

  const handleLogin = async (formData) => {
    try {
      setError("");
      await loginUser(formData);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Could not log in.");
    }
  };

  return (
    <section className="login-page">
      {error && <p className="error">{error}</p>}

      <AuthForm registerUser={handleRegister} loginUser={handleLogin} />
    </section>
  );
}

export default LoginPage;
