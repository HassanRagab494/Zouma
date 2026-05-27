import React from "react";
import OrderRow from "./OrderRow";

const ClientCard = ({ client, copiedPhone, onCopyPhone, onOpenWhatsApp, onEditClient, onDeleteClient, onNewOrder, onEditOrder, onDeleteOrder, onUpdateStatus, onShowNotes }) => {
  const totalSpent = client.orders?.reduce((s, o) => s + (parseFloat(o.total) || 0), 0) || 0;
  const totalPaid  = client.orders?.reduce((s, o) => s + (parseFloat(o.paidAmount) || 0), 0) || 0;
  const totalDebt  = (totalSpent - totalPaid).toFixed(2);

  const has10Percent = client.orders?.some((o) => parseFloat(o.discountPercentage) === 10);
  const has5Percent  = client.orders?.some((o) => parseFloat(o.discountPercentage) === 5);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">

      {/* هيدر الكارت */}
      <div className="bg-gray-50/50 dark:bg-gray-800/50 p-5 flex flex-wrap justify-between items-center border-b border-gray-100 dark:border-gray-700 gap-4">
        <div className="flex-1 text-right min-w-[250px]">
          <div className="flex items-center gap-2 mb-2 justify-start">
            <h2 className="text-xl font-black text-gray-800 dark:text-white">
              {client.name}
              {has10Percent && <span title="ميدالية ذهبية 10%" className="mr-2 text-xl">🥇</span>}
              {has5Percent && !has10Percent && <span title="ميدالية فضية 5%" className="mr-2 text-xl">🥈</span>}
            </h2>
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 rounded-md text-[10px] font-black border border-blue-200 dark:border-blue-800/50">
              #{client.clientCode}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 text-sm mt-2 justify-start items-center">
            {/* الهاتف الأساسي */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenWhatsApp(client.phone)}
                className="text-green-600 dark:text-green-400 font-bold hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800/50 transition-colors flex items-center gap-1.5"
              >
                <span className="text-lg">🟢</span> {client.phone}
              </button>
              <button
                onClick={() => onCopyPhone(client.phone)}
                className={`text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1.5 rounded-lg transition-colors ${copiedPhone === client.phone ? "text-green-600 dark:text-green-400" : ""}`}
                title="نسخ رقم الهاتف"
              >
                {copiedPhone === client.phone ? "✓" : "📋"}
              </button>
            </div>

            {/* الهاتف الثاني */}
            {client.phone2 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onOpenWhatsApp(client.phone2)}
                  className="text-green-600 dark:text-green-400 font-bold hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800/50 transition-colors flex items-center gap-1.5"
                >
                  <span className="text-lg">🟢</span> {client.phone2}
                </button>
                <button
                  onClick={() => onCopyPhone(client.phone2)}
                  className={`text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1.5 rounded-lg transition-colors ${copiedPhone === client.phone2 ? "text-green-600 dark:text-green-400" : ""}`}
                >
                  {copiedPhone === client.phone2 ? "✓" : "📋"}
                </button>
              </div>
            )}

            <span className="text-gray-500 dark:text-gray-400 font-bold bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
              📍 {client.address || "بدون عنوان"}
            </span>
            {client.dob && (
              <span className="text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-800/50">
                🎂 {client.dob}
              </span>
            )}
          </div>
        </div>

        {/* الإحصائيات والأزرار */}
        <div className="flex items-center gap-4">
          <div className="text-left border-l pl-4 border-gray-200 dark:border-gray-700 font-bold">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">المسحوبات</p>
            <p className="text-base font-black text-blue-600 dark:text-blue-400">{totalSpent.toLocaleString()} ج</p>
          </div>
          <div className="text-left border-l pl-4 border-gray-200 dark:border-gray-700 font-bold">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">المتبقي الكلي</p>
            <p className={`text-base font-black ${parseFloat(totalDebt) > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`}>
              {Number(totalDebt).toLocaleString()} ج
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onNewOrder(client.id)} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-purple-500/30 transition-all">أوردر جديد</button>
            <button onClick={() => onEditClient(client)} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold transition-all">تعديل</button>
            <button onClick={() => onDeleteClient(client.id, client.name)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2.5 rounded-xl transition-all text-lg">🗑️</button>
          </div>
        </div>
      </div>

      {/* جدول الأوردرات */}
      {client.orders && client.orders.length > 0 && (
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                <th className="px-5 py-3 font-bold">التاريخ</th>
                <th className="px-5 py-3 font-bold">الأصناف</th>
                <th className="px-5 py-3 font-bold text-center">ملاحظات</th>
                <th className="px-5 py-3 font-bold">الحالة</th>
                <th className="px-5 py-3 font-bold text-center">تغيير سريع</th>
                <th className="px-5 py-3 font-bold text-center">الإجمالي</th>
                <th className="px-5 py-3 font-bold text-center">المدفوع</th>
                <th className="px-5 py-3 font-bold text-center">المتبقي</th>
                <th className="px-5 py-3 font-bold text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm">
              {client.orders
                .slice()
                .reverse()
                .map((order, idx) => {
                  const originalIndex = client.orders.length - 1 - idx;
                  return (
                    <OrderRow
                      key={idx}
                      order={order}
                      originalIndex={originalIndex}
                      client={client}
                      onEditOrder={onEditOrder}
                      onDeleteOrder={onDeleteOrder}
                      onUpdateStatus={onUpdateStatus}
                      onShowNotes={onShowNotes}
                    />
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClientCard;