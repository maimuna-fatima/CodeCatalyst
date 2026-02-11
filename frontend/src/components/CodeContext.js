import React, { createContext, useState, useEffect } from "react";

export const CodeContext = createContext();

export const CodeProvider = ({ children }) => {
  const [code, setCode] = useState("");

  // Persist in localStorage
  useEffect(() => {
    const savedCode = localStorage.getItem("globalCode");
    if (savedCode) {
      setCode(savedCode);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("globalCode", code);
  }, [code]);

  return (
    <CodeContext.Provider value={{ code, setCode }}>
      {children}
    </CodeContext.Provider>
  );
};
