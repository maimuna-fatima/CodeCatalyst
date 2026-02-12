import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { auth } from "../firebase";
import "./Workspace.css";

const API = "http://127.0.0.1:8000";

function WorkspaceDetail() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);

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

  if (!workspace) return <div>Loading...</div>;

  return (
    <div className="workspace-container">
      <Sidebar />

      <div className="workspace-main">
        <h1>{workspace.name}</h1>
        <p>Tech Stack: {workspace.tech_stack?.join(", ")}</p>

        <div
          className="workspace-card clickable"
          onClick={() => navigate(`/workspace/${workspaceId}/files`)}
        >
          📂 Extract Files
        </div>

        <div
          className="workspace-card clickable"
          onClick={() => navigate(`/workspace/${workspaceId}/explain`)}
        >
          🧠 Explain Entire Project
        </div>

        <div
          className="workspace-card clickable"
          onClick={() => navigate(`/workspace/${workspaceId}/docs`)}
        >
          🚀 AI Documentation Generator
        </div>
      </div>
    </div>
  );
}

export default WorkspaceDetail;