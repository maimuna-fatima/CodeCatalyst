import React, { useContext, useState } from "react";
import Sidebar from "./Sidebar";
import { CodeContext } from "./CodeContext";
import Editor from "@monaco-editor/react";
import { FiCopy, FiCheck } from "react-icons/fi";
import "./Dashboard.css";

const API = "http://127.0.0.1:8000";

function Generate() {
  const { code, setCode } = useContext(CodeContext);

  const [language, setLanguage] = useState("python");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleGenerate = async () => {
    if (!code.trim()) {
      alert("Please enter a prompt first.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: code,
          language: language
        })
      });

      const data = await res.json();
      setOutput(data.generated_code);

    } catch (error) {
      console.error("Generation error:", error);
      alert("Code generation failed.");
    } finally {
      setLoading(false);
    }
  };

  /* Header Styles */
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

        {/* Header with right-aligned language selector */}
        <div style={headerStyle}>
          <h2>Code Generator</h2>

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

        {/* Prompt Editor */}
        <div
          style={{
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
          }}
        >
          <Editor
            height="300px"
            language="markdown"
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
              wordWrap: "on",
            }}
          />
        </div>

        <button className="action-btn" onClick={handleGenerate}>
          {loading ? "Generating..." : "Generate Code"}
        </button>

        {/* Output Section */}
        <div style={{ marginTop: "30px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <h3>Generated Code</h3>

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
              value={output}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "Fira Code, monospace",
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

export default Generate;
