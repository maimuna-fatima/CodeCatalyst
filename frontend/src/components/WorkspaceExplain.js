import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import { auth } from "../firebase";
import "./Workspace.css";

const API = "http://127.0.0.1:8000";

function WorkspaceExplain() {
  const { workspaceId } = useParams();

  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateExplanation();
  }, []);

  const generateExplanation = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    try {
      const res = await fetch(`${API}/workspace/explain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.uid,
          workspace_id: workspaceId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setExplanation(data.explanation);
      } else {
        setExplanation("Failed to generate explanation.");
      }

    } catch (error) {
      setExplanation("Error generating explanation.");
    }

    setLoading(false);
  };

  return (
    <div className="workspace-container">
      <Sidebar />

      <div className="workspace-main">
        <h1 className="page-title">🧠 Explain Entire Project</h1>

        <div className="workspace-box explanation-box">
          {loading ? (
            <p>Analyzing entire codebase... Please wait...</p>
          ) : (
            explanation.split("\n").map((line, index) => (
              <p key={index}>{line}</p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkspaceExplain;