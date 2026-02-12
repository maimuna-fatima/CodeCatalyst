import React, { useContext, useState } from "react";
import Sidebar from "./Sidebar";
import { CodeContext } from "./CodeContext";
import Editor from "@monaco-editor/react";
import { FiCopy, FiCheck } from "react-icons/fi";
import "./Dashboard.css";

const API = "http://127.0.0.1:8000";

function Test() {
  const { code, setCode } = useContext(CodeContext);

  const [language, setLanguage] = useState("python");
  const [result, setResult] = useState({ output: "", error: "" });
  const [edgeCases, setEdgeCases] = useState(null);
  const [loading, setLoading] = useState(false);
  const [edgeLoading, setEdgeLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  // ==========================
  // RUN CODE
  // ==========================
  const handleRun = async () => {
    if (!code.trim()) {
      alert("Please enter code first.");
      return;
    }

    try {
      setLoading(true);
      setShowOutput(true);

      const res = await fetch(`${API}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Execution error:", error);
      alert("Execution failed.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // GENERATE EDGE CASES
  // ==========================
  const handleEdgeCases = async () => {
    if (!code.trim()) {
      alert("Please enter code first.");
      return;
    }

    try {
      setEdgeLoading(true);

      const res = await fetch(`${API}/edge-cases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language,
        }),
      });

      const data = await res.json();
      setEdgeCases(data);
    } catch (error) {
      console.error("Edge case error:", error);
      alert("Failed to generate edge cases.");
    } finally {
      setEdgeLoading(false);
    }
  };

  const handleCopy = async () => {
    const fullText = `
OUTPUT:
${result.output || ""}

ERROR:
${result.error || ""}
`;

    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
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

  const outputText = `
OUTPUT:
${result.output || "No output"}

ERROR:
${result.error || "No errors"}
`;

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="main-content">

        {/* Header */}
        <div style={headerStyle}>
          <h2>Code Runner</h2>

          <select
            style={selectStyle}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
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

        {/* Buttons */}
        <div style={{ display: "flex", gap: "15px", marginTop: "20px" }}>
          <button className="action-btn" onClick={handleRun}>
            {loading ? "Running..." : "Run Code"}
          </button>

          <button className="action-btn" onClick={handleEdgeCases}>
            {edgeLoading ? "Generating..." : "Generate Edge Cases"}
          </button>
        </div>

        {/* Execution Result */}
        {showOutput && (
        <div style={{ marginTop: "40px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <h3>Execution Result</h3>

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
              }}
            >
              {copied ? (
                <FiCheck size={18} color="#22c55e" />
              ) : (
                <FiCopy size={18} color="#cbd5e1" />
              )}
            </div>
          </div>

          <div
            style={{
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
            }}
          >
            <Editor
              height="250px"
              language="plaintext"
              value={outputText}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>
        </div>
        )}

        {/* Edge Case Result */}
        {edgeCases && edgeCases.edge_test_cases && (
          <div style={{ marginTop: "40px" }}>
            <h3>Generated Edge Test Cases</h3>

            <div
              style={{
                background: "#0f172a",
                padding: "20px",
                borderRadius: "16px",
                border: "1px solid #334155",
                lineHeight: "1.6",
              }}
            >
              {edgeCases.edge_test_cases.map((test, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: "20px",
                    paddingBottom: "15px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)"
                  }}
                >
                  <strong>Test Case {index + 1}</strong>

                  <div style={{ marginTop: "8px" }}>
                    <span style={{ color: "#38bdf8" }}>Input → </span>
                    <pre style={{ margin: 0 }}>
                      {JSON.stringify(test.input, null, 2)}
                    </pre>
                  </div>

                  <div style={{ marginTop: "8px" }}>
                    <span style={{ color: "#22c55e" }}>Expected → </span>
                    {test.expected_behavior}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  );
}

export default Test;