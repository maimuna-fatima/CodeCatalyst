import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Sidebar from "./Sidebar";
import { auth } from "../firebase";
import "./Workspace.css";

const API = "http://127.0.0.1:8000";

function WorkspaceExplain() {
  const { workspaceId } = useParams();

  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);

  const cleanText = (text) => {
    return text
      .replace(/\r\n/g, "\n")          // normalize line breaks
      .replace(/\n{3,}/g, "\n\n")      // remove extra blank lines
      .trim();                         // remove start & end spaces
  };

  const generateExplanation = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);

    try {
      const res = await fetch(`${API}/workspace/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.uid,
          workspace_id: workspaceId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setExplanation(cleanText(data.explanation));
      } else {
        setExplanation("Failed to generate explanation.");
      }
    } catch (error) {
      setExplanation("Error generating explanation.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    generateExplanation();
  }, [generateExplanation]);

  return (
    <div className="workspace-container">
      <Sidebar />

      <div className="workspace-main">
        <h1 className="page-title">Explain Entire Project</h1>

        <div className="workspace-box explanation-box">
          {loading ? (
            <p className="loading-text">Analyzing entire codebase...</p>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown>
                {explanation}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkspaceExplain;