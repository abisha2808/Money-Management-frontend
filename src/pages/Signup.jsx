// ✅ FILE: src/pages/Signup.jsx
// Works with your setup:
// - api baseURL = http://localhost:8080/api (in src/api/api.js)
// - backend endpoint: POST /api/users/signup
// - redirects to /login after success
// - styles use your existing App.css (no new css file)

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // ✅ your backend expects: { name, email, password }
      await api.post("/users/signup", { name, email, password });

      // ✅ after signup, go to login
      navigate("/login", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (typeof err?.response?.data === "string" ? err.response.data : "") ||
        "Server error. Signup failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="signup-card">
        <h2>Create Account</h2>
        <p>Sign up to start tracking your money</p>

        {error && (
          <p style={{ color: "crimson", marginBottom: "10px", fontSize: "14px" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Sign up"}
          </button>
        </form>

        <p style={{ marginTop: "14px", fontSize: "14px" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#2563eb", fontWeight: 600 }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}