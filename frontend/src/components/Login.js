import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";
import loginImage from "../assets/login.jpg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-wrapper">

      {/* LEFT IMAGE */}
      <div
        className="auth-image"
        style={{ backgroundImage: `url(${loginImage})` }}
      ></div>

      {/* RIGHT FORM */}
      <div className="auth-form-section">
        <div className="auth-box">
          <h2>Login</h2>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Enter Email"
              className="auth-input"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Enter Password"
              className="auth-input"
              autoComplete="new-password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
            />


            <button type="submit" className="auth-button">
              Login
            </button>
          </form>

          <div className="auth-link">
            Don’t have an account? <Link to="/register">Register</Link>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Login;
