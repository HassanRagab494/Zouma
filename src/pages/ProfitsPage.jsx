import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

function ProfitsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "clients"));
      const clientsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsList);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const allOrders = clients.flatMap(c => (c.orders || []));
  const filteredOrders = filterDate
    ? allOrders.filter(o => o.date === filterDate)
    : allOrders;

  // الحسابات
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalCost = filteredOrders.reduce((sum, o) => sum + Number(o.cost || 0), 0);
  const totalProfit = filteredOrders.reduce((sum, o) => sum + Number(o.profit || 0), 0);
  const totalDiscount = filteredOrders.reduce((sum, o) => sum + Number(o.discount || 0), 0);

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-100px)] transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-blue-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-bold animate-pulse text-blue-600 dark:text-blue-400">جارٍ تجميع الحسابات...</p>
    </div>
  );

  if (error) return <p className="text-center mt-20 text-red-500 font-bold bg-red-50 p-4 rounded-xl">{error}</p>;

  return (
    <div className="p-4 md:p-8 min-h-screen transition-colors duration-300 bg-gray-50/50 dark:bg-gray-900 text-right" dir="rtl">
      
      {/* ----------------- الهيدر وفلتر التاريخ ----------------- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 mt-2">
          <div>
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">التقارير <span className="text-green-600 dark:text-green-500">والأرباح</span></h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1">تحليل مالي مفصل لحركة المبيعات</p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto transition-colors duration-300">
            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap px-2">📅 تصفية بالتاريخ:</span>
            <input
              type="date"
              className="bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-2 w-full sm:w-auto outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-colors font-bold cursor-pointer"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
            />
            {filterDate && (
              <button
                className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold px-4 py-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors w-full sm:w-auto whitespace-nowrap"
                onClick={() => setFilterDate("")}
              >
                مسح الفلتر ×
              </button>
            )}
          </div>
      </div>

      {/* ----------------- كروت الملخص المالي ----------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* إجمالي الإيرادات */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-r-4 border-r-blue-500 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
              <div>
                  <h5 className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">إجمالي الإيرادات (المبيعات)</h5>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalRevenue.toLocaleString()} <span className="text-sm text-blue-400/70">ج</span></p>
              </div>
          </div>
        </div>

        {/* إجمالي التكلفة */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-r-4 border-r-orange-500 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
              <div>
                  <h5 className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">إجمالي تكلفة البضاعة (رأس المال)</h5>
                  <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{totalCost.toLocaleString()} <span className="text-sm text-orange-400/70">ج</span></p>
              </div>
          </div>
        </div>

        {/* إجمالي الخصومات */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-r-4 border-r-red-500 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
              <div>
                  <h5 className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">إجمالي الخصومات للعملاء</h5>
                  <p className="text-2xl font-black text-red-600 dark:text-red-400">{totalDiscount.toLocaleString()} <span className="text-sm text-red-400/70">ج</span></p>
              </div>
          </div>
        </div>

        {/* الصافي (الربح) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-r-4 border-r-green-500 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-16 h-16 bg-green-500/10 dark:bg-green-500/5 rounded-br-full"></div>
          <div className="flex justify-between items-start relative z-10">
              <div>
                  <h5 className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">صافي الربح الفعلي</h5>
                  <p className="text-2xl font-black text-green-600 dark:text-green-400">{totalProfit.toLocaleString()} <span className="text-sm text-green-400/70">ج</span></p>
              </div>
          </div>
        </div>

      </div>

      {/* ----------------- جدول الأوردرات والتفاصيل ----------------- */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-black text-gray-800 dark:text-white">سجل العمليات التفصيلي</h3>
            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-800/50">
                {filteredOrders.length} عملية
            </span>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full text-center whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4 font-bold">تاريخ العملية</th>
                <th className="px-4 py-4 font-bold">اسم العميل</th>
                <th className="px-4 py-4 font-bold text-right">تفاصيل الطلب</th>
                <th className="px-4 py-4 font-bold">التكلفة</th>
                <th className="px-4 py-4 font-bold">الخصم</th>
                <th className="px-4 py-4 font-bold text-blue-600 dark:text-blue-400">الإجمالي</th>
                <th className="px-4 py-4 font-bold text-green-600 dark:text-green-400">المكسب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, idx) => {
                  const client = clients.find(c => (c.orders || []).includes(order));
                  const orderDetails = order.items ? order.items.map(i => i.name).join(" + ") : (order.name || "أوردر");
                  
                  return (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-4 font-sans text-xs text-gray-500 dark:text-gray-400">{order.date}</td>
                      <td className="px-4 py-4 font-bold text-gray-800 dark:text-gray-200">{client?.name || <span className="text-gray-400 italic">عميل طياري</span>}</td>
                      <td className="px-4 py-4 text-right text-gray-600 dark:text-gray-300 font-medium max-w-[200px] truncate" title={orderDetails}>
                          {orderDetails}
                      </td>
                      <td className="px-4 py-4 text-orange-600 dark:text-orange-400 font-bold">{Number(order.cost || 0).toLocaleString()}</td>
                      <td className="px-4 py-4 text-red-500 dark:text-red-400 font-bold">{Number(order.discount || 0).toLocaleString()}</td>
                      <td className="px-4 py-4 text-blue-600 dark:text-blue-400 font-black">{Number(order.total || 0).toLocaleString()}</td>
                      <td className="px-4 py-4 text-green-600 dark:text-green-400 font-black">{Number(order.profit || 0).toLocaleString()}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-gray-400 dark:text-gray-500 py-10 font-bold">
                    <span className="text-3xl block mb-2">📭</span>
                    لا توجد مبيعات في هذا التاريخ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default ProfitsPage;
