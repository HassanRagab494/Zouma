// App.js
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import ClientsPage from "./pages/ClientsPage";
import ProfitsPage from "./pages/ProfitsPage";
import OrdersPage from "./pages/OrdersPage";
import Dashboard from "./pages/Dashboard";
import ProductsPage from "./pages/ProductsPage";
import UsersAdminPage from "./pages/UsersAdminPage";

import Login from "./pages/Login";

function LayoutWrapper({ children }) {
  const location = useLocation();
  const hideLayout = location.pathname === "/login";

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      {/* لا تعرض الشريط الجانبي إذا كانت الصفحة هي صفحة تسجيل الدخول */}
      {!hideLayout && <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />}

      {/* Content */}
      <div
        className={`flex-grow transition-all duration-300 ${
          !hideLayout && sidebarOpen
            ? "ml-[220px]"
            : !hideLayout && !sidebarOpen
            ? "ml-[60px]"
            : "ml-0"
        }`}
      >
        {/* لا تعرض شريط التنقل إذا كانت الصفحة هي صفحة تسجيل الدخول */}
        {!hideLayout && <Navbar />}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function ProtectedRoute({ element: Element, permission, isAuthenticated, currentUser }) {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // **التعديل هنا:** التأكد من وجود currentUser قبل محاولة الوصول إلى خصائصه
  if (!currentUser) {
    // يمكن أن يحدث هذا إذا تم مسح localStorage يدوياً أو إذا كان هناك خطأ آخر
    // إعادة التوجيه إلى صفحة تسجيل الدخول للتأكد من إعادة تحميل بيانات المستخدم
    return <Navigate to="/login" replace />;
  }

  // تحقق من الصلاحيات، الادمن يقدر يشوف كل الصفحات
  const isAdmin = currentUser.role === "super_admin";
  // إذا لم يكن المدير العام وليس لديه الصلاحية المطلوبة، أعد التوجيه إلى لوحة القيادة
  if (!isAdmin && (!currentUser.permissions || !currentUser.permissions.includes(permission))) {
    return <Navigate to="/" replace />;
  }

  return <Element />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // هنا نخزن بيانات المستخدم

  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(auth);

    // **التعديل هنا:** استعادة البيانات من "userData"
    const user = JSON.parse(localStorage.getItem("userData"));
    if (user) {
      setCurrentUser(user);
    }
  }, []); // تشغيل مرة واحدة عند تحميل المكون

  return (
    <Router>
      <LayoutWrapper>
        <Routes>
          {/* Login Page */}
          <Route
            path="/login"
            element={<Login setIsAuthenticated={setIsAuthenticated} setCurrentUser={setCurrentUser} />} // تمرير setCurrentUser
          />

          {/* Protected Routes */}
          {/* هنا يجب أن تكون الروابط محمية */}
          <Route
            path="/"
            element={
              <ProtectedRoute
                element={Dashboard}
                permission="dashboard"
                isAuthenticated={isAuthenticated}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                element={Dashboard}
                permission="dashboard"
                isAuthenticated={isAuthenticated}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedRoute
                element={ClientsPage}
                permission="clients"
                isAuthenticated={isAuthenticated}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/profits"
            element={
              <ProtectedRoute
                element={ProfitsPage}
                permission="profits"
                isAuthenticated={isAuthenticated}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute
                element={OrdersPage}
                permission="orders"
                isAuthenticated={isAuthenticated}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute
                element={ProductsPage}
                permission="products"
                isAuthenticated={isAuthenticated}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/users-admin"
            element={
              <ProtectedRoute
                element={UsersAdminPage}
                permission="users-admin" // تأكد من أن هذا الـ key موجود في permissionsList في UsersAdminPage
                isAuthenticated={isAuthenticated}
                currentUser={currentUser}
              />
            }
          />
           {/* Fallback route for unmatched paths */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;