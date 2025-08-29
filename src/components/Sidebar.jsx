import React from "react";
import { Link } from "react-router-dom";
import { FaHome, FaUsers, FaChartLine, FaBars, FaClipboardList } from "react-icons/fa";

function Sidebar({ open, setOpen }) {
  return (
    <div
      className={`sidebar`}
      style={{
        position: "fixed",
        top: 57,
        left: 0,
        height: "calc(100vh - 70px)",import React from "react";
import { Link } from "react-router-dom";
import { FaHome, FaUsers, FaChartLine, FaBars, FaClipboardList } from "react-icons/fa";

function Sidebar({ open, setOpen }) {
  return (
    <div
      className={`sidebar ${open ? "open" : ""}`}
      style={{
        position: "fixed",
        top: 57,
        left: open ? 0 : "-220px",
        height: "100%",
        width: "220px",
        background: "#f5f5dc",
        color: "#000", 
        transition: "left 0.3s",
        zIndex: 1040,
        paddingTop: 20,
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
      }}
    >
      <div className="d-flex flex-column h-100">
        <div className="d-flex justify-content-between align-items-center px-2 mb-4">
          <h3 className="m-0" style={{ fontWeight: "bold" }}>لوحة التحكم</h3>
          <button
            className="btn btn-sm btn-light d-md-none"
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
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;

        width: open ? 220 : 60,
        background: "#f5f5dc",
        color: "#000", 
        transition: "width 0.3s, transform 0.3s",
        zIndex: 1020,
        paddingTop: 20,
        boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
        transform: open ? "translateX(0)" : "translateX(-100%)", 
      }}
    >
      <div className="d-flex flex-column h-100">
        <div className="d-flex justify-content-between align-items-center px-2 mb-4">
          {open && <h3 className="m-0" style={{ fontWeight: "bold" }}>لوحة التحكم</h3>}
          <button
            className="btn btn-sm btn-light"
            onClick={() => setOpen(!open)}
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
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
                {open && item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <style>
        {`
          @media (min-width: 768px) {
            .sidebar {
              transform: translateX(0) !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default Sidebar;
