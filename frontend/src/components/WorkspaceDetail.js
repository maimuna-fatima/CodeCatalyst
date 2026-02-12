import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { auth } from "../firebase";
import "./Workspace.css";

const API = "http://127.0.0.1:8000";

function WorkspaceDetail() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);

  const loadWorkspace = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const res = await fetch(`${API}/user/${user.uid}/workspaces`);
      const data = await res.json();
      const found = data.find((w) => w.id === workspaceId);
      setWorkspace(found);
    } catch (error) {
      console.error("Failed to load workspace:", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  if (!workspace) return <div>Loading...</div>;

  return (
    <div className="workspace-container">
      <Sidebar />

      <div className="workspace-main">
        {/* Header Section */}
        <div className="workspace-header">
          <h1 className="workspace-title">{workspace.name}</h1>

          <div className="tech-stack">
            {workspace.tech_stack?.map((tech, index) => (
              <span key={index} className="tech-badge">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="workspace-features">
          <div
            className="feature-card"
            onClick={() => navigate(`/workspace/${workspaceId}/files`)}
          >
            <div className="feature-icon"></div>
            <h3>Extract Files</h3>
            <p>View and explore all project files with syntax highlighting.</p>
          </div>

          <div
            className="feature-card"
            onClick={() => navigate(`/workspace/${workspaceId}/explain`)}
          >
            <div className="feature-icon"></div>
            <h3>Explain Entire Project</h3>
            <p>AI analyzes your entire codebase and provides structured explanation.</p>
          </div>

          <div
            className="feature-card"
            onClick={() => navigate(`/workspace/${workspaceId}/docs`)}
          >
            <div className="feature-icon"></div>
            <h3>AI Documentation Generator</h3>
            <p>Generate README, API docs, function docstrings, and setup guide.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkspaceDetail;