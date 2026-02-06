import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

export default function Login({ setIsLoggedIn }) {   // ✅ change: accept prop
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errMsg, setErrMsg] = useState("");
  const [suggestSignup, setSuggestSignup] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrMsg("");
    setSuggestSignup(false);

    try {
      const res = await api.post("/users/login", { email, password });

      // ✅ save login user
      localStorage.setItem("authUser", JSON.stringify(res.data));

      // ✅ change: update App state so Navbar changes immediately (no refresh)
      if (setIsLoggedIn) setIsLoggedIn(true);

      // ✅ go home
      navigate("/home");
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Login failed";

      setErrMsg(msg);

      if (
        status === 404 ||
        status === 400 ||
        String(msg).toLowerCase().includes("not found") ||
        String(msg).toLowerCase().includes("not registered")
      ) {
        setSuggestSignup(true);
      }
    }
  };

  return (
    <div className="login-page auth-wrapper">
      <div className="auth-card">
        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />

          {errMsg && <p style={{ color: "crimson" }}>{errMsg}</p>}

          {suggestSignup && (
            <div style={{ marginTop: 8 }}>
              <p style={{ color: "gray" }}>
                Account not found. Are you a new user?
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate("/signup")}
              >
                Create an account
              </button>
            </div>
          )}

          <button className="btn-primary" type="submit">
            Login
          </button>
        </form>

        <p style={{ marginTop: 12 }}>
          New user? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}