import React from "react";
import { ORDER_STATUSES } from "../../constants/orderStatuses";

const OrderRow = ({ order, originalIndex, client, onEditOrder, onDeleteOrder, onUpdateStatus, onShowNotes }) => {
  const statusInfo = ORDER_STATUSES[order.status || "NEW"];
  const total = parseFloat(order.total || 0);
  const paid = parseFloat(order.paidAmount || 0);
  const remaining = (total - paid).toFixed(2);
  const hasNotes = order.notes && order.notes.trim() !== "";

  return (
    <tr className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors">
      <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400 font-sans tracking-wide">{order.date}</td>
      <td className="px-5 py-4 text-xs text-gray-700 dark:text-gray-300 font-bold max-w-[200px] truncate">
        {order.items && order.items.length > 0
          ? order.items.map((i) => `${i.name} (x${i.qty || 1})`).filter(Boolean).join(" + ")
          : "أوردر"}
      </td>

      {/* الملاحظات */}
      <td className="px-5 py-4 text-center">
        {hasNotes ? (
          <button
            onClick={() => onShowNotes({ notes: order.notes, clientName: client.name, orderDate: order.date })}
            className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center justify-center mx-auto transition-all text-sm"
            title="عرض الملاحظات"
          >
            📝
          </button>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto opacity-30">
            📝
          </div>
        )}
      </td>

      <td className={`px-5 py-4 text-[11px] font-black ${statusInfo.text}`}>{statusInfo.label}</td>

      {/* تغيير سريع للحالة */}
      <td className="px-5 py-4">
        <div className="flex justify-center gap-1.5 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg w-fit mx-auto border dark:border-gray-700">
          {Object.entries(ORDER_STATUSES).map(([key, info]) => (
            <button
              key={key}
              onClick={() => onUpdateStatus(client.id, originalIndex, key)}
              className={`px-2.5 py-1 rounded-md text-[9px] font-black transition-all ${
                order.status === key
                  ? `${info.color} text-white shadow-sm scale-105`
                  : "text-gray-400 dark:text-gray-500 hover:bg-white dark:hover:bg-gray-800"
              }`}
            >
              {info.label}
            </button>
          ))}
        </div>
      </td>

      <td className="px-5 py-4 text-center font-black text-gray-800 dark:text-gray-200">{Number(order.total).toLocaleString()} ج</td>
      <td className="px-5 py-4 text-center font-black text-green-600 dark:text-green-400">{Number(order.paidAmount || 0).toLocaleString()} ج</td>
      <td className={`px-5 py-4 text-center font-black ${parseFloat(remaining) > 0 ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`}>
        {Number(remaining).toLocaleString()} ج
      </td>

      <td className="px-5 py-4 text-center">
        <div className="flex justify-center gap-2">
          <button
            onClick={() => onEditOrder(client.id, order, originalIndex)}
            className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
          >
            تعديل / عرض
          </button>
          <button
            onClick={() => onDeleteOrder(client.id, originalIndex)}
            className="text-red-400 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors"
          >
            حذف
          </button>
        </div>
      </td>
    </tr>
  );
};

export default OrderRow;