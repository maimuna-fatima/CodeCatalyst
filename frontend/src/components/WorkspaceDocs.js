import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import { auth } from "../firebase";
import "./Workspace.css";

const API = "http://127.0.0.1:8000";

function WorkspaceDocs() {
  const { workspaceId } = useParams();

  const [workspace, setWorkspace] = useState(null);
  const [docOutput, setDocOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState(null);

  useEffect(() => {
    loadWorkspace();
  }, []);

  const loadWorkspace = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const res = await fetch(`${API}/user/${user.uid}/workspaces`);
    const data = await res.json();

    const found = data.find((w) => w.id === workspaceId);
    setWorkspace(found);
  };

  const generateDocs = async (type) => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    setDocOutput("");
    setActiveType(type);

    try {
      const res = await fetch(`${API}/generate-docs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.uid,
          workspace_id: workspaceId,
          doc_type: type,
        }),
      });

      const data = await res.json();
      setDocOutput(data.documentation);
    } catch (err) {
      setDocOutput("Error generating documentation.");
    }

    setLoading(false);
  };

  if (!workspace) return <div>Loading...</div>;

  return (
    <div className="workspace-container">
      <Sidebar />

      <div className="workspace-main">
        <h1>🚀 AI Documentation Generator</h1>
        <p><b>Project:</b> {workspace.name}</p>

        <div className="docs-buttons">
          {[
            "README.md",
            "API Documentation",
            "Function Docstrings",
            "Setup Instructions",
          ].map((type) => (
            <button
              key={type}
              onClick={() => generateDocs(type)}
              disabled={loading}
              className={activeType === type ? "active-doc-btn" : ""}
            >
              {type}
            </button>
          ))}
        </div>

        {loading && <p className="loading-text">Generating documentation...</p>}

        {docOutput && (
          <div className="docs-output">
            {docOutput.split("\n").map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkspaceDocs;