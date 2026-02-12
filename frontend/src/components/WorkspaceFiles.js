import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const res = await fetch(
      `${API}/workspace/${user.uid}/${workspaceId}/files`
    );
    const data = await res.json();
    setFiles(data);
  };

  const fetchFileContent = async (file) => {
    setSelectedFile(file);

    const res = await fetch(
      `${API}/workspace/file-content?download_url=${encodeURIComponent(
        file.download_url
      )}`
    );

    const data = await res.json();
    setFileContent(data.content);
  };

  return (
    <div className="workspace-container">
      <Sidebar />

      <div className="workspace-main">
        <h1>Project Files</h1>

        <div className="file-container">
          <div className="file-list">
            {files.map((file) => (
              <div
                key={file.id}
                className="file-item"
                onClick={() => fetchFileContent(file)}
              >
                {file.file_name}
              </div>
            ))}
          </div>

          <div className="file-content">
            {selectedFile && (
              <>
                <h3>{selectedFile.file_name}</h3>
                <pre>{fileContent}</pre>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkspaceFiles;