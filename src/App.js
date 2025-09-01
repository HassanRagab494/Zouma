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
import Login from "./pages/Login";

function LayoutWrapper({ children }) {
  const location = useLocation();
  const hideLayout = location.pathname === "/login";

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      {!hideLayout && (
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      )}

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
          <Route
            path="/login"
            element={<Login setIsAuthenticated={setIsAuthenticated} />}
          />

          <Route
            path="/"
            element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/clients"
            element={
              isAuthenticated ? <ClientsPage /> : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/profits"
            element={
              isAuthenticated ? <ProfitsPage /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/orders"
            element={
              isAuthenticated ? <OrdersPage /> : <Navigate to="/login" replace />
            }
          />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;
