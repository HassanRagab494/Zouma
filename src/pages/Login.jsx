import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fixedUser = {
    email: "Zouma@admin.com",
    password: "Zo1000@2000",
  };

  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
      navigate("/dashboard");
    }
  }, [navigate, setIsAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === fixedUser.email && password === fixedUser.password) {
      setIsAuthenticated(true);
      localStorage.setItem("isAuthenticated", "true"); 
      navigate("/dashboard");
    } else {
      setError("الإيميل أو الباسورد غلط ");
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg p-4 p-md-5 w-100" style={{ maxWidth: "420px", borderRadius: "15px" }}>
        <h3 className="text-center mb-4 fw-bold text-primary">تسجيل الدخول</h3>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label fw-semibold">الإيميل</label>
            <input
              type="email"
              className="form-control form-control-lg"
              placeholder="ادخل الإيميل"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label fw-semibold">الباسورد</label>
            <input
              type="password"
              className="form-control form-control-lg"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-danger text-center small mb-3">{error}</p>}
          <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold">
            دخول
          </button>
        </form>
        <p className="text-center mt-4 text-muted small mb-0">
          © 2025 Zouma System
        </p>
      </div>
    </div>
  );
}

export default Login;
