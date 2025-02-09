import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./styles.css";

function SignupPage() {
  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usertype, setUsertype] = useState("user");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const data = {
      fullname,
      username,
      password,
      usertype,
    };

    try {
      const response = await fetch("http://localhost:5000/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        navigate("/login");
      } else {
        const errorData = await response.json();
        setError(errorData.message);
      }
    } catch (error) {
      setError("Error during signup. Please try again.");
    }
  };

  return (
    <div className="container">
      <h2 color="black">Signup</h2>
      <form onSubmit={handleSignup}>
        <label htmlFor="fullname" color="black">Full Name</label>
        <input
          type="text"
          id="fullname"
          placeholder="Enter your full name"
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
        />
        <label htmlFor="username" color="black">Username</label>
        <input
          type="text"
          id="username"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <label htmlFor="password" color="black">Password</label>
        <input
          type="password"
          id="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <label htmlFor="confirmPassword" color="black">Confirm Password</label>
        <input
          type="password"
          id="confirmPassword"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <label htmlFor="usertype" color="black">User Type</label>
        <select
          id="usertype"
          value={usertype}
          onChange={(e) => setUsertype(e.target.value)}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Sign Up</button>
      </form>
      {error && <p className="error-message">{error}</p>}
      <p style={{ marginTop: "10px", textAlign: "center" }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "#007bff", textDecoration: "none" }}>
          Login
        </Link>
      </p>
    </div>
  );
}

export default SignupPage;
