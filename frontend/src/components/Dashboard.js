import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Optimize from "./Optimize";
import Rewrite from "./Rewrite";
import Convert from "./Convert";
import Debug from "./Debug";
import Generate from "./Generate";
import Review from "./Review";
import Test from "./Test";
import "./Dashboard.css";
import { FiSun, FiMoon } from "react-icons/fi";


function Dashboard() {

  // Default Home View
  const [activeComponent, setActiveComponent] = useState("home");
  const [lightMode, setLightMode] = useState(
    localStorage.getItem("theme") === "light"
  );

  useEffect(() => {
    if (lightMode) {
      document.body.classList.add("light-mode");
      localStorage.setItem("theme", "light");
    } else {
      document.body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
    }
  }, [lightMode]);


  const renderContent = () => {
    switch (activeComponent) {
      case "optimize":
        return <Optimize />;
      case "rewrite":
        return <Rewrite />;
      case "convert":
        return <Convert />;
      case "debug":
        return <Debug />;
      case "generate":
        return <Generate />;
      case "review":
        return <Review />;
      case "test":
        return <Test />;
      default:
        return (
          <div className="dashboard-home">

            {/* ================= HERO SECTION ================= */}
            <div className="hero-section">
              <h1 className="hero-title">
                Welcome to CodeCatalyst !
              </h1>
              <p className="hero-description">
                An AI-powered code optimization platform designed to enhance performance,
                improve readability, and streamline your development workflow effortlessly.
              </p>
            </div>

            {/* ================= MODULE CARDS ================= */}
            <div className="modules-grid">

              {/* Optimize */}
              <div className="module-card">
                <h3>Optimize</h3>
                <p>Enhance performance and reduce time & space complexity.</p>
                <ul>
                  <li>Select programming language.</li>
                  <li>Paste your existing code.</li>
                  <li>Click <span className="highlight">Run Optimizer</span>.</li>
                  <li>Review optimized output and complexity analysis.</li>
                </ul>
              </div>

              {/* Rewrite */}
              <div className="module-card">
                <h3>Rewrite</h3>
                <p>Improve readability and structure without changing logic.</p>
                <ul>
                  <li>Paste your code snippet.</li>
                  <li>Click <span className="highlight">Rewrite</span>.</li>
                  <li>Compare original and improved version.</li>
                </ul>
              </div>

              {/* Convert */}
              <div className="module-card">
                <h3>Convert</h3>
                <p>Convert code from one programming language to another.</p>
                <ul>
                  <li>Select source and target languages.</li>
                  <li>Paste original code.</li>
                  <li>Click <span className="highlight">Convert</span>.</li>
                  <li>Verify converted logic.</li>
                </ul>
              </div>

              {/* Debug */}
              <div className="module-card">
                <h3>Debug</h3>
                <p>Identify errors and receive intelligent fixes.</p>
                <ul>
                  <li>Paste faulty code.</li>
                  <li>Click <span className="highlight">Run Debugger</span>.</li>
                  <li>Review detected issues and fixes.</li>
                </ul>
              </div>

              {/* Generate */}
              <div className="module-card">
                <h3>Generate</h3>
                <p>Generate code automatically from problem description.</p>
                <ul>
                  <li>Enter your problem statement clearly.</li>
                  <li>Select language.</li>
                  <li>Click <span className="highlight">Generate</span>.</li>
                  <li>Review AI-generated solution.</li>
                </ul>
              </div>

              {/* Review */}
              <div className="module-card">
                <h3>Review</h3>
                <p>Get structured feedback categorized by severity.</p>
                <ul>
                  <li>Paste your complete code.</li>
                  <li>Click <span className="highlight">Run Review</span>.</li>
                  <li>Analyze feedback (Critical, High, Medium, Low).</li>
                </ul>
              </div>

              {/* Test */}
              <div className="module-card">
                <h3>Test</h3>
                <p>Execute code and validate output correctness.</p>
                <ul>
                  <li>Select language.</li>
                  <li>Paste your code.</li>
                  <li>Click <span className="highlight">Run Code</span>.</li>
                  <li>View output and error logs.</li>
                </ul>
              </div>
              {/* Workspace */}
              <div className="module-card">
                <h3>Workspace</h3>
                <p>
                  Create project-level AI workspaces with persistent memory and
                  repository intelligence.
                </p>
                <ul>
                  <li>Create a new workspace with project name & GitHub URL.</li>
                  <li>System automatically detects <span className="highlight">Tech Stack</span>.</li>
                  <li>AI generates project summary & architecture understanding.</li>
                </ul>
              </div>
              {/* Comments */}
              <div className="module-card">
                <h3>Comments</h3>
                <p>Automatically generate meaningful comments for your existing code.</p>
                <ul>
                  <li>Select programming language.</li>
                  <li>Paste your code snippet.</li>
                  <li>Click <span className="highlight">Generate Comments</span>.</li>
                  <li>Receive properly structured inline comments.</li>
                </ul>
              </div>

            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard-container">

      <div className="theme-toggle" onClick={() => setLightMode(!lightMode)}>
        {lightMode ? <FiMoon size={20} /> : <FiSun size={20} />}
      </div>

      <Sidebar
        activeComponent={activeComponent}
        setActiveComponent={setActiveComponent}
      />

      <div className="main-content">
        {renderContent()}
      </div>

    </div>
  );
}

export default Dashboard;