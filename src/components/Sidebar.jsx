// Sidebar.js
import React from "react";
import { Link } from "react-router-dom";
import { FaHome, FaUsers, FaChartLine, FaBars, FaClipboardList } from "react-icons/fa";

function Sidebar({ open, setOpen }) {
  return (
    <div
      className={`sidebar ${open ? "open" : ""}`}
      style={{
        position: "fixed",
        top: 57,
        // على الشاشات الكبيرة، لا نريد إخفاءه، بل نريده أن يكون جزءًا من التخطيط
        // هذا الجزء سيتم التحكم فيه بواسطة CSS Media Queries
        left: open ? 0 : "-220px", // هذا للتحكم في ظهوره على الشاشات الصغيرة
        height: "calc(100vh - 57px)", // ارتفاعه من بعد Navbar
        width: "220px",
        background: "#f5f5dc",
        color: "#000",
        transition: "left 0.3s, transform 0.3s", // أضف transform للانتقال السلس
        zIndex: 1040,
        paddingTop: 20,
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
      }}
    >
      <div className="d-flex flex-column h-100">
        <div className="d-flex justify-content-between align-items-center px-2 mb-4">
          <h3 className="m-0" style={{ fontWeight: "bold" }}>لوحة التحكم</h3>
          <button
            className="btn btn-sm btn-light d-md-none" // يظهر فقط على الشاشات الصغيرة
            onClick={() => setOpen(false)}
            aria-label="إغلاق القائمة"
          >
            <FaBars />
          </button>
        </div>
        <ul className="nav flex-column px-2">
          {[
            { to: "/", icon: <FaHome className="me-2" />, label: "الرئيسية" },
            { to: "/clients", icon: <FaUsers className="me-2" />, label: "العملاء" },
            { to: "/profits", icon: <FaChartLine className="me-2" />, label: "الأرباح" },
            { to: "/orders", icon: <FaClipboardList className="me-2" />, label: "الطلبات" },
          ].map((item, idx) => (
            <li className="nav-item mb-2" key={idx}>
              <Link
                to={item.to}
                className="nav-link d-flex align-items-center"
                style={{
                  color: "#000",
                  borderRadius: "4px",
                  padding: "8px",
                  transition: "background 0.2s",
                  textDecoration: "none",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.05)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {/* إضافة الستايل المباشر هنا لتحكم أفضل */}
      <style jsx>{`
        .sidebar {
          /* إعدادات افتراضية للهواتف */
          transform: translateX(${open ? "0" : "-100%"});
          left: 0; /* تأكد من أن left: 0 ليعمل الـ transform */
        }

        /* Media query للشاشات الأكبر من 768 بكسل (md في Bootstrap) */
        @media (min-width: 768px) {
          .sidebar {
            position: fixed; /* يبقى fixed */
            top: 57px;
            left: 0; /* يكون ظاهرًا دائمًا على اليسار */
            height: calc(100vh - 57px); /* ارتفاعه من بعد الـ Navbar */
            width: 220px; /* عرضه ثابت */
            transform: translateX(0); /* لا يوجد تحويل */
            transition: none; /* لا يوجد انتقال عند التحميل على الشاشات الكبيرة */
            z-index: 1020; /* أقل من المودال لكن أعلى من المحتوى */
            box-shadow: 2px 0 5px rgba(0,0,0,0.1);
          }
        }
      `}</style>
    </div>
  );
}

export default Sidebar;
