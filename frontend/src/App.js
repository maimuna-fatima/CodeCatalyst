import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CodeProvider } from "./components/CodeContext";

import Dashboard from "./components/Dashboard";
import Optimize from "./components/Optimize";
import Rewrite from "./components/Rewrite";
import Convert from "./components/Convert";
import Debug from "./components/Debug";
import Generate from "./components/Generate";
import Review from "./components/Review";
import Test from "./components/Test";
import Comment from "./components/Comment";
import Login from "./components/Login";
import Register from "./components/Register";

function App() {
  return (
    <CodeProvider>
      <Router>
        <Routes>

          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/optimize" element={<Optimize />} />
          <Route path="/rewrite" element={<Rewrite />} />
          <Route path="/convert" element={<Convert />} />
          <Route path="/debug" element={<Debug />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/review" element={<Review />} />
          <Route path="/test" element={<Test />} />
          <Route path="/comment" element={<Comment />} />

        </Routes>
      </Router>
    </CodeProvider>
  );
}

export default App;
