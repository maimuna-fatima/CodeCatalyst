import React, { useContext, useState } from "react";
import Sidebar from "./Sidebar";
import { CodeContext } from "./CodeContext";
import Editor from "@monaco-editor/react";
import { FiCopy, FiCheck } from "react-icons/fi";
import "./Dashboard.css";

const API = "http://127.0.0.1:8000";

function Optimize() {
  const { code, setCode } = useContext(CodeContext);

  const [language, setLanguage] = useState("python");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!result?.optimized_code) return;

    try {
      await navigator.clipboard.writeText(result.optimized_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleOptimize = async () => {
    if (!code.trim()) {
      alert("Please enter code first.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Optimize error:", error);
      alert("Optimization failed.");
    } finally {
      setLoading(false);
    }
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  };

  const selectStyle = {
    backgroundColor: "#0f172a",
    color: "white",
    border: "1px solid #334155",
    padding: "6px 10px",
    borderRadius: "6px",
    fontSize: "14px",
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="main-content">

        {/* Header */}
        <div style={headerStyle}>
          <h2>Code Optimizer</h2>

          <select
            style={selectStyle}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="javascript">JavaScript</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
          </select>
        </div>

        {/* Input Editor */}
        <div
          style={{
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
          }}
        >
          <Editor
            height="400px"
            language={language}
            value={code}
            theme="vs-dark"
            onChange={(value) => setCode(value)}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              fontFamily: "Fira Code, monospace",
              cursorBlinking: "smooth",
              smoothScrolling: true,
              scrollBeyondLastLine: false,
              padding: { top: 16, bottom: 16 },
            }}
          />
        </div>

        <button className="action-btn" onClick={handleOptimize}>
          {loading ? "Optimizing..." : "Run Optimizer"}
        </button>

        {/* ================= OUTPUT SECTION ================= */}
        {result && (
          <div style={{ marginTop: "40px" }}>

            {/* Output Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <h3>Optimized Code</h3>

              <div
                onClick={handleCopy}
                style={{
                  cursor: "pointer",
                  background: "#1e293b",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "0.2s ease",
                }}
              >
                {copied ? (
                  <FiCheck size={18} color="#22c55e" />
                ) : (
                  <FiCopy size={18} color="#cbd5e1" />
                )}
              </div>
            </div>

            {/* Output Editor */}
            <div
              style={{
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
              }}
            >
              <Editor
                height="400px"
                language={language}
                value={result.optimized_code}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "Fira Code, monospace",
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </div>

            {/* ================= Explanation ================= */}
            <h3 className="section-title">Explanation</h3>

            <div className="explanation-card">
              {result.theoretical_explanation}
            </div>

            {/* ================= Complexity ================= */}
            <h3 className="section-title">Complexity Comparison</h3>

            <div className="complexity-wrapper">

              <div className="complexity-box before-box">
                <h4>Before Optimization</h4>
                <p>
                  <strong>Time Complexity:</strong> {result.before_time_complexity}
                </p>
                <p>
                  <strong>Space Complexity:</strong> {result.before_space_complexity}
                </p>
              </div>

              <div className="complexity-box after-box">
                <h4>After Optimization</h4>
                <p>
                  <strong>Time Complexity:</strong> {result.after_time_complexity}
                </p>
                <p>
                  <strong>Space Complexity:</strong> {result.after_space_complexity}
                </p>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default Optimize;