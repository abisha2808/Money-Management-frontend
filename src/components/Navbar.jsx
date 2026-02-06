import { Link, useNavigate } from "react-router-dom";

export default function Navbar({ isLoggedIn, setIsLoggedIn }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authUser");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="navbar">
      <div className="navbar-left">Money Manager</div>

      <div className="navbar-right">
        {!isLoggedIn ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        ) : (
          <>
            <Link to="/home">Home</Link>
            <Link to="/dashboard">Dashboard</Link>

            {/* Logout as normal link-style */}
            <span className="nav-link" onClick={handleLogout}>
            Logout
            </span>
          </>
        )}
      </div>
    </div>
  );
}