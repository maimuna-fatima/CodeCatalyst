import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import { auth } from "../firebase";
import "./Workspace.css";

const API = "http://127.0.0.1:8000";

function WorkspaceFiles() {
  const { workspaceId } = useParams();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchFiles = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const res = await fetch(
        `${API}/workspace/${user.uid}/${workspaceId}/files`
      );
      const data = await res.json();
      setFiles(data);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const fetchFileContent = async (file) => {
    setSelectedFile(file);
    setLoading(true);

    try {
      const res = await fetch(
        `${API}/workspace/file-content?download_url=${encodeURIComponent(
          file.download_url
        )}`
      );
      const data = await res.json();
      setFileContent(data.content);
    } catch (error) {
      console.error("Failed to fetch file content:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-container">
      <Sidebar />

      <div className="workspace-main">
        <h1 className="page-title">Project Files</h1>

        <div className="file-container">
          {/* LEFT PANEL */}
          <div className="file-list">
            {files.length === 0 ? (
              <p className="empty-text">No files found</p>
            ) : (
              files.map((file) => (
                <div
                  key={file.id}
                  className={`file-item ${
                    selectedFile?.id === file.id ? "active-file" : ""
                  }`}
                  onClick={() => fetchFileContent(file)}
                >
                  {file.file_name}
                </div>
              ))
            )}
          </div>

          {/* RIGHT PANEL */}
          <div className="file-content">
            {!selectedFile && (
              <div className="empty-state">
                Select a file to view its content
              </div>
            )}

            {selectedFile && (
              <>
                <h3>{selectedFile.file_name}</h3>

                {loading ? (
                  <p className="loading-text">Loading file...</p>
                ) : (
                  <pre>{fileContent}</pre>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkspaceFiles;