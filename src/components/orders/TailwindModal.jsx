import React from "react";

const TailwindModal = ({ show, onClose, title, children, footer }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2050] p-4 transition-all duration-300" dir="rtl">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-transparent dark:border-gray-700 transition-colors duration-300">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-black text-gray-800 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-2xl font-bold bg-gray-100 dark:bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center pb-1 transition-colors"
          >
            &times;
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 text-right custom-scrollbar">{children}</div>
        {footer && (
          <div className="flex justify-end p-5 border-t border-gray-100 dark:border-gray-800 gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default TailwindModal;