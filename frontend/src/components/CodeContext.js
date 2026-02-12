import React, { createContext, useState, useEffect } from "react";

export const CodeContext = createContext();

export const CodeProvider = ({ children }) => {
  const [code, setCode] = useState("");
  const [workspace, setWorkspace] = useState(null);

  useEffect(() => {
    const savedWorkspace = localStorage.getItem("workspace");
    if (savedWorkspace) {
      setWorkspace(JSON.parse(savedWorkspace));
    }
  }, []);

  useEffect(() => {
    if (workspace) {
      localStorage.setItem("workspace", JSON.stringify(workspace));
    } else {
      localStorage.removeItem("workspace");
    }
  }, [workspace]);

  return (
    <CodeContext.Provider
      value={{
        code,
        setCode,
        workspace,
        setWorkspace,   // ✅ MUST EXIST
      }}
    >
      {children}
    </CodeContext.Provider>
  );
};
