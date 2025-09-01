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

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalCost = filteredOrders.reduce((sum, o) => sum + (o.cost || 0), 0);
  const totalProfit = filteredOrders.reduce((sum, o) => sum + (o.profit || 0), 0);
  const totalDiscount = filteredOrders.reduce((sum, o) => sum + (o.discount || 0), 0);

  if (loading) return <p className="text-center mt-20">جارٍ تحميل البيانات...</p>;
  if (error) return <p className="text-center mt-20 text-red-500">{error}</p>;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-center">صفحة الأرباح</h1>

      {/* فلتر حسب التاريخ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
        <label className="w-full sm:w-auto">فلتر حسب التاريخ:</label>
        <input
          type="date"
          className="border rounded px-2 py-1 w-full sm:w-auto"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        />
        <button
          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 w-full sm:w-auto"
          onClick={() => setFilterDate("")}
        >
          مسح الفلتر
        </button>
      </div>

      {/* كروت الملخص */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-500 text-white p-4 rounded shadow">
          <h5 className="font-semibold">إجمالي الإيرادات</h5>
          <p className="text-xl">{totalRevenue.toFixed(2)} ج</p>
        </div>
        <div className="bg-green-500 text-white p-4 rounded shadow">
          <h5 className="font-semibold">إجمالي الربح</h5>
          <p className="text-xl">{totalProfit.toFixed(2)} ج</p>
        </div>
        <div className="bg-yellow-500 text-white p-4 rounded shadow">
          <h5 className="font-semibold">إجمالي التكلفة</h5>
          <p className="text-xl">{totalCost.toFixed(2)} ج</p>
        </div>
        <div className="bg-red-500 text-white p-4 rounded shadow">
          <h5 className="font-semibold">إجمالي الخصومات</h5>
          <p className="text-xl">{totalDiscount.toFixed(2)} ج</p>
        </div>
      </div>

      {/* جدول الأوردرات */}
      <div className="overflow-x-auto shadow rounded">
        <table className="min-w-full border-collapse border border-gray-300 text-sm sm:text-base">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="border px-2 py-1">اسم العميل</th>
              <th className="border px-2 py-1">الطلب</th>
              <th className="border px-2 py-1">تكلفة البضاعة</th>
              <th className="border px-2 py-1">المكسب</th>
              <th className="border px-2 py-1">الخصم</th>
              <th className="border px-2 py-1">السعر الكلي</th>
              <th className="border px-2 py-1">تاريخ الأوردر</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, idx) => {
                const client = clients.find(c => (c.orders || []).includes(order));
                return (
                  <tr key={idx} className="even:bg-gray-100">
                    <td className="border px-1 sm:px-2 py-1">{client?.name || "-"}</td>
                    <td className="border px-1 sm:px-2 py-1">{order.name}</td>
                    <td className="border px-1 sm:px-2 py-1">{order.cost?.toFixed(2)}</td>
                    <td className="border px-1 sm:px-2 py-1">{order.profit?.toFixed(2)}</td>
                    <td className="border px-1 sm:px-2 py-1">{order.discount?.toFixed(2)}</td>
                    <td className="border px-1 sm:px-2 py-1">{order.total?.toFixed(2)}</td>
                    <td className="border px-1 sm:px-2 py-1">{order.date}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-gray-500 py-2">لا توجد بيانات</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProfitsPage;
