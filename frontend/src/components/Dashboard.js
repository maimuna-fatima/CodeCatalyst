import React from "react";
import Sidebar from "./Sidebar";
import "./Dashboard.css";

function Dashboard() {
  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="main-content">
        <h1>Welcome to CodeCatalyst 🚀</h1>

        <div className="dashboard-card">
          <h2>AI Powered Code Optimization Platform</h2>
          <p>
            Optimize, Improve, Convert, Debug, Generate and Review your code
            using powerful AI tools.
          </p>

          <p>
            Select a feature from the left sidebar to get started.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
