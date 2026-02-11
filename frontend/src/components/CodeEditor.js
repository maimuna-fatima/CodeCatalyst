function CodeEditor({ code, setCode }) {
  return (
    <textarea
      value={code}
      onChange={(e) => setCode(e.target.value)}
      placeholder="Paste your code here..."
      rows={15}
      style={{ width: "100%", padding: "10px" }}
    />
  );
}

export default CodeEditor;
