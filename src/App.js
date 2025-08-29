import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import ClientsPage from "./pages/ClientsPage";
import ProfitsPage from "./pages/ProfitsPage";
import OrdersPage from "./pages/OrdersPage";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import "./App.css";
function LayoutWrapper({ children }) {
  const location = useLocation();
  const hideLayout = location.pathname === "/login";

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="app-layout d-flex">
      {!hideLayout && <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />} {/* <--- FIXED HERE! */}
      <div
        className="content flex-grow-1"
        style={{
          marginLeft: !hideLayout && sidebarOpen ? 220 : (!hideLayout && !sidebarOpen ? 60 : 0), // Adjust content margin
          transition: "margin-left 0.3s",
        }}
      >
        {!hideLayout && <Navbar />}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("isAuthenticated") === "true";
    setIsAuthenticated(auth);
  }, []);

  return (
    <Router>
      <LayoutWrapper>
        <Routes>
          <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />

          <Route
            path="/"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/clients"
            element={isAuthenticated ? <ClientsPage /> : <Navigate to="/login" replace />}
          />
          
          <Route
            path="/profits"
            element={isAuthenticated ? <ProfitsPage /> : <Navigate to="/login" replace />}
          />
            <Route
    path="/orders"
    element={isAuthenticated ? <OrdersPage /> : <Navigate to="/login" replace />}
  />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;