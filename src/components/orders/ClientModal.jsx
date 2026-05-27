import React from "react";
import TailwindModal from "./TailwindModal";

const ClientModal = ({ show, onClose, modalClient, clientForm, setClientForm, onSave }) => {
  return (
    <TailwindModal show={show} onClose={onClose} title="بيانات العميل">
      <div className="space-y-4">
        <input
          className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl outline-none focus:border-blue-500 text-gray-800 dark:text-white font-bold transition-colors"
          placeholder="اسم العميل"
          value={clientForm.name}
          onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
        />
        <div>
          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 pr-2 block mb-2">رقم الهاتف الأساسي</label>
          <input
            className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl outline-none focus:border-blue-500 text-gray-800 dark:text-white font-bold transition-colors"
            placeholder="رقم الهاتف الأساسي"
            value={clientForm.phone}
            onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 pr-2 block mb-2">رقم هاتف ثاني (اختياري)</label>
          <input
            className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl outline-none focus:border-blue-500 text-gray-800 dark:text-white font-bold transition-colors"
            placeholder="رقم هاتف ثاني"
            value={clientForm.phone2 || ""}
            onChange={(e) => setClientForm({ ...clientForm, phone2: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 pr-2 uppercase">تاريخ الميلاد</label>
          <input
            type="date"
            className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl outline-none focus:border-blue-500 text-gray-800 dark:text-white font-bold transition-colors"
            value={clientForm.dob}
            onChange={(e) => setClientForm({ ...clientForm, dob: e.target.value })}
          />
        </div>
        <input
          className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl outline-none focus:border-blue-500 text-gray-800 dark:text-white font-bold transition-colors"
          placeholder="العنوان"
          value={clientForm.address}
          onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
        />
        <button
          onClick={onSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all mt-2"
        >
          حفظ بيانات العميل
        </button>
      </div>
    </TailwindModal>
  );
};

export default ClientModal;