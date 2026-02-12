import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Editor from "@monaco-editor/react";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCopy,
  FiCheck,
} from "react-icons/fi";
import "./Dashboard.css";

const API = "http://127.0.0.1:8000";

function Generate() {
  const [language, setLanguage] = useState("python");
  const [versions, setVersions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);

  const [codeCopied, setCodeCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  const currentVersion = versions[currentIndex] || {};
  const currentCode = currentVersion.code || "";
  const currentPrompt = currentVersion.prompt || "";

  const handleSubmit = async () => {
    if (!instruction.trim()) {
      alert("Please enter a description or modification.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: instruction,
          language: language,
          history: currentCode
            ? [{ role: "assistant", content: currentCode }]
            : [],
        }),
      });

      const data = await res.json();
      let newCode = data.code || "";

      // 🔥 Remove leading language name like "python"
      newCode = newCode.replace(
        /^(python|java|javascript|cpp|c|go|rust|sql)\s*\n/i,
        ""
      );

      const newVersion = {
        prompt: instruction,
        code: newCode,
      };

      setVersions((prev) => {
        const updated = [...prev.slice(0, currentIndex + 1), newVersion];
        setCurrentIndex(updated.length - 1);
        return updated;
      });

      setInstruction("");
    } catch (error) {
      console.error("Generation error:", error);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < versions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleCopyCode = async () => {
    if (!currentCode) return;
    await navigator.clipboard.writeText(currentCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  };

  const handleCopyPrompt = async () => {
    if (!currentPrompt) return;
    await navigator.clipboard.writeText(currentPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 1500);
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
            <option value="sql">SQL</option>
          </select>
        </div>

        {/* Large Prompt Input */}
        <div style={{ marginBottom: "25px" }}>
          <textarea
            placeholder="Describe what to build or modify..."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={6}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: "12px",
              border: "1px solid #334155",
              backgroundColor: "#0f172a",
              color: "white",
              resize: "none",
              fontSize: "14px",
            }}
          />

          <button
            className="action-btn"
            style={{ marginTop: "12px" }}
            onClick={handleSubmit}
          >
            {loading ? "Processing..." : "Submit"}
          </button>
        </div>

        {/* Prompt Display Box */}
        {currentPrompt && (
          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              background: "#1e293b",
              borderRadius: "12px",
              border: "1px solid #334155",
              position: "relative",
              color: "#cbd5e1",
              fontSize: "13px",
            }}
          >
            <div
              onClick={handleCopyPrompt}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                cursor: "pointer",
                background: "#0f172a",
                padding: "6px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {promptCopied ? (
                <FiCheck size={16} color="#22c55e" />
              ) : (
                <FiCopy size={16} color="#cbd5e1" />
              )}
            </div>

            <strong style={{ display: "block", marginBottom: "8px" }}>
              Prompt Used:
            </strong>

            <div style={{ whiteSpace: "pre-wrap", paddingRight: "35px" }}>
              {currentPrompt}
            </div>
          </div>
        )}

        {/* Code Box with Copy Inside */}
        {versions.length > 0 && (
          <div
            style={{
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
              position: "relative",
            }}
          >
            <div
              onClick={handleCopyCode}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                cursor: "pointer",
                background: "#0f172a",
                padding: "6px",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              {codeCopied ? (
                <FiCheck size={16} color="#22c55e" />
              ) : (
                <FiCopy size={16} color="#cbd5e1" />
              )}
            </div>
            
            <Editor
              height="520px"
              language={language}
              value={currentCode}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "Fira Code, monospace",
                scrollBeyondLastLine: false,
                padding: { top: 20, bottom: 16 },
              }}
            />
          </div>
        )}

        {/* Navigation */}
        {versions.length > 0 && (
          <div
            style={{
              marginTop: "30px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "30px",
            }}
          >
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "50%",
                padding: "10px",
                cursor: "pointer",
                opacity: currentIndex === 0 ? 0.4 : 1,
              }}
            >
              <FiArrowLeft size={20} color="white" />
            </button>

            <div
              style={{
                padding: "8px 18px",
                borderRadius: "20px",
                background: "#1e293b",
                border: "1px solid #334155",
                fontSize: "14px",
                color: "#cbd5e1",
              }}
            >
              Version {currentIndex + 1} / {versions.length}
            </div>

            <button
              onClick={handleNext}
              disabled={currentIndex === versions.length - 1}
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "50%",
                padding: "10px",
                cursor: "pointer",
                opacity:
                  currentIndex === versions.length - 1 ? 0.4 : 1,
              }}
            >
              <FiArrowRight size={20} color="white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Generate;