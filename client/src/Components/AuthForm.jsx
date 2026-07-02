import { useState } from "react";

function AuthForm({ registerUser, loginUser }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (mode === "register") {
      registerUser({ name, email, password });
    } else {
      loginUser({ email, password });
    }
  };

  return (
    <section className="auth-card">
      <h2>{mode === "login" ? "Log In" : "Create Account"}</h2>

      <form onSubmit={handleSubmit} className="auth-form">
        {mode === "register" && (
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button type="submit">
          {mode === "login" ? "Log In" : "Register"}
        </button>
      </form>

      <button
        type="button"
        onClick={() =>
          setMode(mode === "login" ? "register" : "login")
        }
      >
        {mode === "login"
          ? "Need an account? Register"
          : "Already have an account? Log in"}
      </button>
    </section>
  );
}

export default AuthForm;