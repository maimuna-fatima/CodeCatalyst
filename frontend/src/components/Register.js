import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import "./Auth.css";
import loginImage from "../assets/login.jpg";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const userCredential =
        await createUserWithEmailAndPassword(auth, email, password);

      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "user",
        createdAt: new Date()
      });

      navigate("/");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-wrapper">

      {/* LEFT FORM */}
      <div className="auth-form-section">
        <div className="auth-box">
          <h2>Register</h2>

          <form onSubmit={handleRegister}>
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
              Register
            </button>
          </form>

          <div className="auth-link">
            Already have an account? <Link to="/">Login</Link>
          </div>
        </div>
      </div>

      {/* RIGHT IMAGE */}
      <div
        className="auth-image"
        style={{ backgroundImage: `url(${loginImage})` }}
      ></div>

    </div>
  );
}

export default Register;
