import React from "react";
import { ORDER_STATUSES } from "../../constants/orderStatuses";

const OrdersHeader = ({ searchTerm, setSearchTerm, sortBy, setSortBy, statusFilter, setStatusFilter, onNewClient }) => {
  return (
    <>
      {/* عنوان الصفحة */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-2">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight uppercase italic">
            Z O U M A <span className="text-blue-600 dark:text-blue-500 italic">Dashboard</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1">إدارة الأوردرات والفواتير</p>
        </div>
      </div>

      {/* فلاتر الحالة */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
            statusFilter === "ALL"
              ? "bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          }`}
        >
          الكل
        </button>
        {Object.entries(ORDER_STATUSES).map(([key, info]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
              statusFilter === key
                ? `${info.color} text-white shadow-md`
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {info.label}
          </button>
        ))}
      </div>

      {/* البحث والترتيب */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <input
          className="flex-1 border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3.5 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-500 text-right font-bold text-gray-800 dark:text-white placeholder-gray-400 transition-colors"
          placeholder="ابحث باسم العميل، الهاتف أو الكود..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-white px-4 py-3 rounded-xl font-bold outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            <option value="recent">🕒 أحدث الأوردرات</option>
            <option value="allTime">🔝 أعلى مبيعات (الكل)</option>
            <option value="thisMonth">📅 مبيعات الشهر</option>
            <option value="threeMonths">🗓️ مبيعات 3 شهور</option>
          </select>
          <button
            onClick={onNewClient}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-green-500/30 whitespace-nowrap transition-all"
          >
            + عميل جديد
          </button>
        </div>
      </div>
    </>
  );
};

export default OrdersHeader;