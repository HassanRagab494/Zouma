import React from "react";

const NotesModal = ({ show, onClose, notes, clientName, orderDate }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[3000] p-4" dir="rtl">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-black text-gray-800 dark:text-white">📝 ملاحظات الأوردر</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{clientName} — {orderDate}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-2xl font-bold bg-gray-100 dark:bg-gray-800 w-9 h-9 rounded-full flex items-center justify-center pb-1 transition-colors"
          >
            &times;
          </button>
        </div>
        <div className="p-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        </div>
        <div className="flex justify-end px-6 pb-5">
          <button
            onClick={onClose}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2.5 rounded-xl font-bold transition-all text-sm"
          >
            إغلاق ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesModal;