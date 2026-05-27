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
    // التعديل هنا: إضافة كلاسات الدارك مود للخلفية والنص الرئيسي
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Sidebar */}
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
        {!hideLayout && <Navbar />}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function ProtectedRoute({ element: Element, permission, isAuthenticated, currentUser }) {
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!currentUser) return <Navigate to="/login" replace />;

  const isAdmin = currentUser.role === "super_admin";
  if (!isAdmin && (!currentUser.permissions || !currentUser.permissions.includes(permission))) {
    return <Navigate to="/" replace />;
  }

  return <Element />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // ---- منطق الدارك مود الأساسي ----
    const storedTheme = localStorage.getItem("theme");
    // إذا كان محفوظ دارك، أو نظام الويندوز/الماك نفسه دارك
    if (storedTheme === "dark" || (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    // ----------------------------------

    const auth = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(auth);

    const user = JSON.parse(localStorage.getItem("userData"));
    if (user) {
      setCurrentUser(user);
    }
  }, []); 

  return (
    <Router>
      <LayoutWrapper>
        <Routes>
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setCurrentUser={setCurrentUser} />} />
          <Route path="/" element={<ProtectedRoute element={Dashboard} permission="dashboard" isAuthenticated={isAuthenticated} currentUser={currentUser} />} />
          <Route path="/dashboard" element={<ProtectedRoute element={Dashboard} permission="dashboard" isAuthenticated={isAuthenticated} currentUser={currentUser} />} />
          <Route path="/clients" element={<ProtectedRoute element={ClientsPage} permission="clients" isAuthenticated={isAuthenticated} currentUser={currentUser} />} />
          <Route path="/profits" element={<ProtectedRoute element={ProfitsPage} permission="profits" isAuthenticated={isAuthenticated} currentUser={currentUser} />} />
          <Route path="/orders" element={<ProtectedRoute element={OrdersPage} permission="orders" isAuthenticated={isAuthenticated} currentUser={currentUser} />} />
          <Route path="/products" element={<ProtectedRoute element={ProductsPage} permission="products" isAuthenticated={isAuthenticated} currentUser={currentUser} />} />
          <Route path="/users-admin" element={<ProtectedRoute element={UsersAdminPage} permission="users-admin" isAuthenticated={isAuthenticated} currentUser={currentUser} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;
