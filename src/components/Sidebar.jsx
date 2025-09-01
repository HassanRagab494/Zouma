import React from "react";
import { Link } from "react-router-dom";
import { FaHome, FaUsers, FaChartLine, FaClipboardList } from "react-icons/fa";

function Sidebar({ open, setOpen }) {
  return (
    <div
      className={`
        fixed top-[57px] left-0 h-[calc(100vh-57px)]
        bg-[#f5f5dc] text-black shadow-md transition-all duration-300 z-[1040] // z-index: 1040
        ${open ? "w-[220px] translate-x-0" : "w-[60px] -translate-x-0"}
        md:w-[220px] md:translate-x-0 md:flex
      `}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-2 mb-4">
          <h3 className={`font-bold transition-all duration-300 ${open ? "block" : "hidden md:block"}`}>
            لوحة التحكم
          </h3>
          <button
            className="md:hidden p-2 rounded bg-gray-100 hover:bg-gray-200"
            onClick={() => setOpen(!open)}
            aria-label="فتح/إغلاق القائمة"
          >
            {open ? "×" : "☰"}
          </button>
        </div>

        {/* Links */}
        <ul className="flex flex-col px-2">
          {[
            { to: "/", icon: <FaHome className="mr-2" />, label: "الرئيسية" },
            { to: "/clients", icon: <FaUsers className="mr-2" />, label: "العملاء" },
            { to: "/profits", icon: <FaChartLine className="mr-2" />, label: "الأرباح" },
            { to: "/orders", icon: <FaClipboardList className="mr-2" />, label: "الطلبات" },
          ].map((item, idx) => (
            <li key={idx} className="mb-2">
              <Link
                to={item.to}
                className="flex items-center px-2 py-2 rounded text-black no-underline hover:bg-black/5 transition"
              >
                {item.icon}
                <span className={`transition-all duration-300 ${open ? "inline" : "hidden md:inline"}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;