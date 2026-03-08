// Sidebar.js
import React from "react";
import { Link } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaChartLine,
  FaClipboardList,
  FaBoxOpen,
  FaUserShield,
} from "react-icons/fa";

function Sidebar({ open, setOpen }) {
  // **التأكد من أننا نستخدم "userData" هنا**
  const userData = JSON.parse(localStorage.getItem("userData")) || {};
  const isAdmin = userData?.role === "super_admin";
  const permissions = userData?.permissions || [];

  // الروابط كلها مع key للصلاحيات
  const allLinks = [
    { to: "/dashboard", key: "dashboard", icon: <FaHome className="mr-2" />, label: "الرئيسية" },
    { to: "/clients", key: "clients", icon: <FaUsers className="mr-2" />, label: "العملاء" },
    { to: "/profits", key: "profits", icon: <FaChartLine className="mr-2" />, label: "الأرباح" },
    { to: "/orders", key: "orders", icon: <FaClipboardList className="mr-2" />, label: "الطلبات" },
    { to: "/products", key: "products", icon: <FaBoxOpen className="mr-2" />, label: "المخزون" },
  ];

  // فلترة الروابط حسب الصلاحيات
  const allowedLinks = isAdmin
    ? allLinks
    : allLinks.filter(link => permissions.includes(link.key));

  return (
    <div
      className={`
        fixed top-[57px] left-0 h-[calc(100vh-57px)]
        bg-[#f5f5dc] text-black shadow-md transition-all duration-300 z-[1040]
        ${open ? "w-[220px]" : "w-[60px]"}
        md:w-[220px]
      `}
      dir="rtl" // إضافة هذا لتصحيح اتجاه الشريط الجانبي
    >
      <div className="flex flex-col h-full">

        {/* Header */}
        <div className="flex items-center justify-between px-2 mb-4">
          <h3 className={`font-bold transition-all ${open ? "block" : "hidden md:block"}`}>
            لوحة التحكم
          </h3>

          <button
            className="md:hidden p-2 rounded bg-gray-100 hover:bg-gray-200"
            onClick={() => setOpen(!open)}
          >
            {open ? "×" : "☰"}
          </button>
        </div>

        {/* Links */}
        <ul className="flex flex-col px-2">
          {allowedLinks.map((item, idx) => (
            <li key={idx} className="mb-2">
              <Link
                to={item.to}
                className="flex items-center px-2 py-2 rounded hover:bg-black/5"
              >
                {item.icon}
                <span className={`${open ? "inline" : "hidden md:inline"}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          ))}

          {/* صفحة إدارة المستخدمين للأدمن فقط */}
          {isAdmin && (
            <li className="mb-2">
              <Link
                to="/users-admin"
                className="flex items-center px-2 py-2 rounded hover:bg-black/5"
              >
                <FaUserShield className="mr-2" />
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