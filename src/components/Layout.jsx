import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout-container">
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* سايدبار */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* الكونتنت */}
      <div className="content">{children}</div>
    </div>
  );
}

export default Layout;
