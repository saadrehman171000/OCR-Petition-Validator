import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import CombinedPage from "./pages/combined_page";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SignupPage onSignup={() => {}} />} />
        <Route path="/login" element={<LoginPage onLogin={() => {}} />} />
        <Route path="/signup" element={<SignupPage onSignup={() => {}} />} />
        <Route path="/chat" element={<CombinedPage user={{ name: "Test User" }} />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;
