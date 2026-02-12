import React, { useState, useEffect, useContext } from "react";
import { auth } from "../firebase";
import { CodeContext } from "./CodeContext";
import Sidebar from "./Sidebar";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";


const API = "http://127.0.0.1:8000";

function CreateWorkspace() {
  const { workspace, setWorkspace } = useContext(CodeContext);
  const [workspaces, setWorkspaces] = useState([]);
  const [name, setName] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [creating, setCreating] = useState(false);


  const fetchWorkspaces = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const res = await fetch(`${API}/user/${user.uid}/workspaces`);
    const data = await res.json();
    setWorkspaces(data);
  };
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreate = async () => {
    if (!name || !repoUrl) {
      alert("Fill all fields.");
      return;
    }

    try {
      setCreating(true);   // 🔥 START LOADING

      const res = await fetch(`${API}/create-workspace`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: auth.currentUser.uid,
          name,
          repo_url: repoUrl,
        }),
      });

      const data = await res.json();

      const newWorkspace = {
        id: data.workspace_id,
        name,
        tech_stack: data.tech_stack,
        project_summary: data.summary,
        user_id: auth.currentUser.uid,
      };

      setWorkspace(newWorkspace);

      setName("");
      setRepoUrl("");

      fetchWorkspaces();

      navigate(`/workspace/${data.workspace_id}`);

    } catch (err) {
      console.error(err);
      alert("Creation failed.");
    } finally {
      setCreating(false);  // 🔥 STOP LOADING
    }
  };


  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="main-content">
        <h2>Workspace Manager</h2>
        {/* Create Section */}
        <h3 style={{ marginTop: "40px" }}>Create New Workspace</h3>

        <input
          placeholder="Workspace Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "300px", padding: "10px", marginBottom: "15px" }}
        />

        <br />

        <input
          placeholder="GitHub Repo URL"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          style={{ width: "400px", padding: "10px" }}
        />

        <br /><br />

        <button
          className="action-btn"
          onClick={handleCreate}
          disabled={creating}
          style={{
            opacity: creating ? 0.6 : 1,
            cursor: creating ? "not-allowed" : "pointer",
          }}
        >
          {creating ? "Creating..." : "Create Workspace"}
        </button>

        {/* Existing Workspaces */}
        <h3 style={{ marginTop: "30px" }}>Your Workspaces</h3>

        {workspaces.length === 0 && (
          <p>No workspaces yet.</p>
        )}

        {workspaces.map((ws) => (
          <div
            key={ws.id}
            onClick={() => {
              const selected = { ...ws, user_id: auth.currentUser.uid };
              setWorkspace(selected);
              navigate(`/workspace/${ws.id}`);
            }}

            style={{
              border:
                workspace?.id === ws.id
                  ? "2px solid #22c55e"
                  : "1px solid #334155",
              padding: "20px",
              marginBottom: "15px",
              borderRadius: "12px",
              cursor: "pointer",
              background: "#1e293b",
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              transition: "0.2s ease",
            }}
          >
            <h4>{ws.name}</h4>
            <p><b>Tech Stack:</b> {ws.tech_stack.join(", ")}</p>
            <p style={{ fontSize: "14px", opacity: 0.8 }}>
              {ws.project_summary}
            </p>
          </div>
        ))}

      </div>
    </div>
  );
}

export default CreateWorkspace;
