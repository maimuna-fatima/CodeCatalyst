import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Sidebar from "./Sidebar";
import { auth } from "../firebase";
import { jsPDF } from "jspdf";
import { FiDownload, FiCheck } from "react-icons/fi";
import autoTable from "jspdf-autotable";

import "./Workspace.css";

const API = "http://127.0.0.1:8000";

function WorkspaceDocs() {
  const { workspaceId } = useParams();

  const [workspace, setWorkspace] = useState(null);
  const [docOutput, setDocOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState(null);
  const [downloaded, setDownloaded] = useState(false);


  const cleanText = (text) => {
    return text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

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

  const generateDocs = async (type) => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    setDocOutput("");
    setActiveType(type);
    setDownloaded(false);   // 👈 Reset tick

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
      setDocOutput(cleanText(data.documentation));
    } catch (err) {
      setDocOutput("Error generating documentation.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const pdf = new jsPDF("p", "mm", "a4");

    const margin = 15;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;

    let y = margin;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);

    const lines = docOutput.split("\n");
    let tableBuffer = [];

    const renderTable = () => {
      if (tableBuffer.length === 0) return;

      const rows = tableBuffer
        .filter((row) => row.trim() !== "")
        .map((row) =>
          row
            .split("|")
            .map((cell) => cell.trim())
            .filter((cell) => cell !== "")
        );

      const headers = rows[0];
      const body = rows.slice(2);

      autoTable(pdf, {
        startY: y,
        head: [headers],
        body: body,
        theme: "grid",
        styles: {
          textColor: [0, 0, 0],
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          fontSize: 10,
        },
        headStyles: {
          fillColor: false,
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        margin: { left: margin, right: margin },
      });

      y = pdf.lastAutoTable.finalY + 8;
      tableBuffer = [];
    };

    lines.forEach((line) => {
      // Detect table rows
      if (line.includes("|")) {
        tableBuffer.push(line);
        return;
      } else {
        renderTable();
      }

      if (line.trim() === "") {
        y += 6;
        return;
      }

      // Headings
      if (line.startsWith("# ")) {
        pdf.setFontSize(18);
        pdf.setFont("helvetica", "bold");
        pdf.text(line.replace("# ", ""), margin, y);
        y += 10;
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        return;
      }

      if (line.startsWith("## ")) {
        pdf.setFontSize(15);
        pdf.setFont("helvetica", "bold");
        pdf.text(line.replace("## ", ""), margin, y);
        y += 8;
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "normal");
        return;
      }

      // Bullet points
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const bulletText = line.replace(/^[-*]\s/, "");
        const splitText = pdf.splitTextToSize("• " + bulletText, maxWidth - 5);

        if (y > 280) {
          pdf.addPage();
          y = margin;
        }

        pdf.text(splitText, margin + 5, y);
        y += splitText.length * 7;
        return;
      }

      // Numbered lists
      if (/^\d+\.\s/.test(line.trim())) {
        const splitText = pdf.splitTextToSize(line.trim(), maxWidth - 5);

        if (y > 280) {
          pdf.addPage();
          y = margin;
        }

        pdf.text(splitText, margin + 5, y);
        y += splitText.length * 7;
        return;
      }

      // Normal paragraph
      const cleanLine = line.replace(/[*_>`]/g, "");
      const splitText = pdf.splitTextToSize(cleanLine, maxWidth);

      if (y > 280) {
        pdf.addPage();
        y = margin;
      }

      pdf.text(splitText, margin, y);
      y += splitText.length * 7;
    });

    renderTable();

    pdf.save(`${activeType}.pdf`);
    setDownloaded(true);
  };


  if (!workspace) return <div>Loading...</div>;

  return (
    <div className="workspace-container">
      <Sidebar />

      <div className="workspace-main">
        <h1 className="page-title"> AI Documentation Generator</h1>
        <p className="project-name">
          <strong>Project:</strong> {workspace.name}
        </p>

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

        {loading && (
          <p className="loading-text">Generating documentation...</p>
        )}

        {docOutput && (
          <div className="docs-output-wrapper">

            {/* Download Icon Top Right */}
            <div className="download-icon" onClick={handleDownload}>
              {downloaded ? <FiCheck size={22} /> : <FiDownload size={22} />}
            </div>

            <div className="docs-output" id="docs-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {docOutput}
              </ReactMarkdown>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default WorkspaceDocs;