// Sidebar.js
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaChartLine,
  FaClipboardList,
  FaBoxOpen,
  FaUserShield,
} from "react-icons/fa";

function Sidebar({ open, setOpen }) {
  const location = useLocation(); // لمعرفة الصفحة الحالية وتمييز الرابط النشط
  
  // التأكد من أننا نستخدم "userData" هنا
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const isAdmin = userData?.role === "super_admin";
  const permissions = userData?.permissions || [];

  // الروابط كلها مع key للصلاحيات
  const allLinks = [
    { to: "/dashboard", key: "dashboard", icon: <FaHome size={18} />, label: "الرئيسية" },
    { to: "/clients", key: "clients", icon: <FaUsers size={18} />, label: "العملاء" },
    { to: "/profits", key: "profits", icon: <FaChartLine size={18} />, label: "الأرباح" },
    { to: "/orders", key: "orders", icon: <FaClipboardList size={18} />, label: "الطلبات" },
    { to: "/products", key: "products", icon: <FaBoxOpen size={18} />, label: "المخزون" },
  ];

  // فلترة الروابط حسب الصلاحيات
  const allowedLinks = isAdmin
    ? allLinks
    : allLinks.filter(link => permissions.includes(link.key));

  return (
    <div
      className={`
        fixed top-[57px] left-0 h-[calc(100vh-57px)]
        /* التعديل هنا: ألوان الوضع الفاتح والليلي مع تأثير انتقال ناعم */
        bg-[#f5f5dc] dark:bg-gray-900 text-black dark:text-gray-200 
        shadow-md dark:shadow-none dark:border-r dark:border-gray-800
        transition-all duration-300 z-[1040]
        ${open ? "w-[220px]" : "w-[60px]"}
        md:w-[220px]
      `}
      dir="rtl"
    >
      <div className="flex flex-col h-full py-4">

        {/* Header */}
        <div className="flex items-center justify-between px-4 mb-6">
          <h3 className={`font-black text-gray-800 dark:text-white tracking-wide transition-all ${open ? "block" : "hidden md:block"}`}>
            لوحة التحكم
          </h3>

          {/* زر الموبايل */}
          <button
            className="md:hidden p-1.5 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            onClick={() => setOpen(!open)}
          >
            {open ? "×" : "☰"}
          </button>
        </div>

        {/* Links */}
        <ul className="flex flex-col px-3 gap-1">
          {allowedLinks.map((item, idx) => {
            const isActive = location.pathname === item.to || (item.to === "/dashboard" && location.pathname === "/");
            return (
              <li key={idx}>
                <Link
                  to={item.to}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-bold text-sm
                    ${isActive 
                      ? "bg-blue-600 text-white shadow-md dark:shadow-none" 
                      : "hover:bg-black/5 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-400 dark:hover:text-white"
                    }
                  `}
                >
                  <span className={`${isActive ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>
                    {item.icon}
                  </span>
                  <span className={`${open ? "inline" : "hidden md:inline"}`}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}

          {/* صفحة إدارة المستخدمين للأدمن فقط */}
          {isAdmin && (
            <li className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-800">
              <Link
                to="/users-admin"
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-bold text-sm
                  ${location.pathname === "/users-admin"
                    ? "bg-purple-600 text-white shadow-md"
                    : "hover:bg-black/5 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-400 dark:hover:text-white"
                  }
                `}
              >
                <span className={`${location.pathname === "/users-admin" ? "text-white" : "text-purple-500"}`}>
                  <FaUserShield size={18} />
                </span>
                <span className={`${open ? "inline" : "hidden md:inline"}`}>
                  إدارة المستخدمين
                </span>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;
