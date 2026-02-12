import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Dashboard.css";
import {useNavigate} from "react-router-dom";

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { name: "Workspaces", path: "/create-workspace" },
    { name: "Optimize", path: "/optimize" },
    { name: "Rewrite", path: "/rewrite" },
    { name: "Convert", path: "/convert" },
    { name: "Debug", path: "/debug" },
    { name: "Generate", path: "/generate" },
    { name: "Review", path: "/review" },
    { name: "Test", path: "/test" },
    { name: "Comment", path: "/comment" },
  ];
   const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };
  return (
    <div className="sidebar">
      {/* Clickable Logo */}
      <Link
        to="/dashboard"
        className="logo"
        style={{ textDecoration: "none", color: "inherit" }}
      >
        CodeCatalyst
      </Link>
      <ul>
        {menuItems.map((item, index) => (
          <li key={index}>
            <Link
              to={item.path}
              className={
                location.pathname === item.path
                  ? "sidebar-link active"
                  : "sidebar-link"
              }
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
      <div className="logout-section">
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
