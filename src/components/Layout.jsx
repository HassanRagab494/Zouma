// Layout.js
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="d-flex flex-column vh-100"> {/* استخدم flex-column لـ Navbar ثم محتوى الصفحة */}
      <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="d-flex flex-grow-1" style={{ marginTop: "57px" }}> {/* هذا سيحتوي على Sidebar والمحتوى */}
        {/* سايدبار */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        {/* الكونتنت */}
        <div
          className={`content flex-grow-1 p-3`}
          style={{
            overflowY: "auto", // لتمكين السكرول العمودي داخل المحتوى إذا كان طويلاً
            transition: "margin-left 0.3s ease-in-out",
            // على الشاشات الكبيرة، قم بدفع المحتوى لليمين
            marginLeft: window.innerWidth >= 768 ? "220px" : "0", // 220px هو عرض الـ Sidebar
          }}
        >
          {children}
        </div>
      </div>

      <style jsx>{`
        /* تحكم في margin-left للمحتوى بناءً على حجم الشاشة */
        @media (max-width: 767.98px) { /* الشاشات الصغيرة (أقل من md) */
          .content {
            margin-left: 0 !important; /* لا يوجد هامش إذا كان السايدبار مخفيًا أو يظهر كـ overlay */
          }
        }
      `}</style>
    </div>
  );
}

export default Layout;
