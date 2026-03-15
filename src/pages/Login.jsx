// Login.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

// استقبال setCurrentUser كـ prop
function Login({ setIsAuthenticated, setCurrentUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // بيانات المدير العام (ثابتة للحماية من فقدان الوصول)
  const superAdmin = {
    email: "Zouma@gmail.com",
    password: "Zo1000@2026",
    role: "super_admin",
    name: "المدير العام",
    // المدير له صلاحية لكل الروابط الممكنة
    permissions: ["dashboard", "clients", "profits", "orders", "products", "users-admin"] 
  };

  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
      const user = JSON.parse(localStorage.getItem("userData"));
      if (user) setCurrentUser(user);
      navigate("/"); 
    }
  }, [navigate, setIsAuthenticated, setCurrentUser]); 

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. التحقق من المدير العام
      if (email === superAdmin.email && password === superAdmin.password) {
        setIsAuthenticated(true);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userData", JSON.stringify(superAdmin)); 
        setCurrentUser(superAdmin); 
        navigate("/");
        return;
      }

      // 2. البحث في الداتابيز عن إيميل الموظف
      const q = query(
        collection(db, "users"),
        where("email", "==", email),
        where("password", "==", password)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

        setIsAuthenticated(true);
        localStorage.setItem("isAuthenticated", "true");
        const userWithId = { id: querySnapshot.docs[0].id, ...userData };
        localStorage.setItem("userData", JSON.stringify(userWithId));
        setCurrentUser(userWithId); 

        navigate("/");
      } else {
        setError("الإيميل أو الباسورد غير صحيح!");
      }
    } catch (err) {
      console.error(err);
      setError("حدث خطأ في الاتصال بقاعدة البيانات. تأكد من الإنترنت.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4 transition-colors duration-300" dir="rtl">
      <div className="bg-white dark:bg-gray-800 p-8 md:p-10 rounded-3xl shadow-2xl dark:shadow-none dark:border dark:border-gray-700 w-full max-w-md border-t-4 border-t-blue-600 dark:border-t-blue-500 transition-colors duration-300">
        
        <div className="text-center mb-8">
            <h2 className="text-4xl font-black italic tracking-widest text-gray-800 dark:text-white mb-2 transition-colors">Z O U M A</h2>
            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 tracking-wide">تسجيل الدخول للنظام</h3>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm transition-colors">البريد الإلكتروني</label>
            <input
              type="email"
              className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500 dark:focus:border-blue-500 text-gray-800 dark:text-gray-100 font-bold transition-all text-left placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="admin@zouma.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div>
            <label className="block mb-2 font-bold text-gray-700 dark:text-gray-300 text-sm transition-colors">كلمة المرور</label>
            <input
              type="password"
              className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl px-4 py-3 outline-none focus:border-blue-500 dark:focus:border-blue-500 text-gray-800 dark:text-gray-100 font-bold transition-all text-left tracking-widest placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-center text-sm font-bold border border-red-200 dark:border-red-800/50 transition-colors">
                {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 mt-2 rounded-xl font-bold transition-all text-white shadow-lg text-lg tracking-wide ${
                loading ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed shadow-none" : "bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 shadow-blue-500/30"
            }`}
          >
            {loading ? "جاري التحقق..." : "تسجيل الدخول"}
          </button>
        </form>
        
        <p className="text-center text-gray-400 dark:text-gray-500 text-xs mt-8 font-bold transition-colors">
          © {new Date().getFullYear()} Zouma Management System
        </p>
      </div>
    </div>
  );
}

export default Login;
