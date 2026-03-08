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
    permissions: ["dashboard", "clients", "profits", "orders", "products", "users-admin"] // استخدم نفس الـ keys الموجودة في permissionsList
  };

  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated");
    // **التعديل هنا:** عند التحقق الأولي، لا تعيد توجيه فوراً، فقط قم بتعيين حالة المصادقة
    if (auth === "true") {
      setIsAuthenticated(true);
      // **جديد:** استعد بيانات المستخدم هنا أيضاً إذا كانت موجودة
      const user = JSON.parse(localStorage.getItem("userData"));
      if (user) setCurrentUser(user);
      navigate("/"); // الانتقال للصفحة الرئيسية بعد التأكد من وجود البيانات
    }
  }, [navigate, setIsAuthenticated, setCurrentUser]); // أضف setCurrentUser هنا

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. أولاً: نتحقق هل من يسجل الدخول هو المدير العام؟
      if (email === superAdmin.email && password === superAdmin.password) {
        setIsAuthenticated(true);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userData", JSON.stringify(superAdmin)); // حفظ بيانات وصلاحيات المدير
        setCurrentUser(superAdmin); // تحديث حالة المستخدم الحالي في App.js
        navigate("/");
        return;
      }

      // 2. ثانياً: إذا لم يكن المدير، نبحث في الداتابيز عن إيميل الموظف
      const q = query(
        collection(db, "users"),
        where("email", "==", email),
        where("password", "==", password)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // الموظف موجود!
        const userData = querySnapshot.docs[0].data();

        setIsAuthenticated(true);
        localStorage.setItem("isAuthenticated", "true");
        // حفظ بيانات الموظف (والتي ستحتوي على الصلاحيات التي حددها له المدير)
        const userWithId = { id: querySnapshot.docs[0].id, ...userData };
        localStorage.setItem("userData", JSON.stringify(userWithId));
        setCurrentUser(userWithId); // تحديث حالة المستخدم الحالي في App.js

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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4" dir="rtl">
      <div className="bg-white p-6 md:p-10 rounded-xl shadow-xl w-full max-w-md border-t-4 border-blue-600">
        <div className="text-center mb-6">
            <h2 className="text-3xl font-black italic tracking-widest text-gray-800 mb-1">Z O U M A</h2>
            <h3 className="text-sm font-bold text-blue-600">تسجيل الدخول للنظام</h3>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1 font-bold text-gray-700 text-sm">الإيميل</label>
            <input
              type="email"
              className="w-full border-2 rounded-lg px-4 py-3 outline-none focus:border-blue-500 font-bold text-left"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              dir="ltr"
            />
          </div>
          <div>
            <label className="block mb-1 font-bold text-gray-700 text-sm">الباسورد</label>
            <input
              type="password"
              className="w-full border-2 rounded-lg px-4 py-3 outline-none focus:border-blue-500 font-bold text-left tracking-widest"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-center text-sm font-bold border border-red-200">
                {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold transition-all text-white shadow-md text-lg ${
                loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
            }`}
          >
            {loading ? "جاري التحقق..." : "تسجيل الدخول"}
          </button>
        </form>
        <p className="text-center text-gray-400 text-xs mt-6 font-bold">© {new Date().getFullYear()} Zouma Management System</p>
      </div>
    </div>
  );
}

export default Login;