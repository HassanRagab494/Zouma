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
      setError("الإيميل أو الباسورد غلط");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-6 md:p-10 rounded-xl shadow-xl w-full max-w-md">
        <h3 className="text-2xl font-bold text-center text-blue-600 mb-6">تسجيل الدخول</h3>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">الإيميل</label>
            <input
              type="email"
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ادخل الإيميل"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">الباسورد</label>
            <input
              type="password"
              className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-center text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-bold hover:bg-blue-600 transition"
          >
            دخول
          </button>
        </form>
        <p className="text-center text-gray-400 text-sm mt-6">© 2025 Zouma System</p>
      </div>
    </div>
  );
}

export default Login;
