import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Dashboard.css";

function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { name: "Optimize", path: "/optimize" },
    { name: "Improve", path: "/improve" },
    { name: "Convert", path: "/convert" },
    { name: "Debug", path: "/debug" },
    { name: "Generate", path: "/generate" },
    { name: "Review", path: "/review" },
    { name: "Test", path: "/test" },
    { name: "Comment", path: "/comment" },
  ];

  return (
    <div className="sidebar">
      <h2 className="logo">CodeCatalyst</h2>

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
    </div>
  );
}

export default Sidebar;
