import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, deleteDoc, doc, orderBy, query } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FaWhatsapp, FaPhone } from "react-icons/fa";

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  // دالة جلب البيانات مع الترتيب
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      let clientsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // الترتيب حسب إجمالي المشتريات (الأعلى فوق)
      clientsList.sort((a, b) => {
        const totalA = (a.orders || []).reduce((sum, o) => sum + Number(o.total || 0), 0);
        const totalB = (b.orders || []).reduce((sum, o) => sum + Number(o.total || 0), 0);
        return totalB - totalA;
      });

      setClients(clientsList);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm("هل أنت متأكد أنك تريد حذف هذا العميل؟")) return;
    try {
      await deleteDoc(doc(db, "clients", clientId));
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      setSelectedClient(null);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء حذف العميل");
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.code && String(c.code).includes(searchTerm))
  );

  const getTotalOrdersAmount = (orders) =>
    (orders || []).reduce((sum, o) => sum + Number(o.total || 0), 0);

  const countryCode = "+20";

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-100px)] bg-transparent transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-blue-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-bold animate-pulse text-blue-600 dark:text-blue-400">جارٍ تحميل العملاء...</p>
    </div>
  );

  if (error)
    return <p className="text-center mt-10 text-red-600 font-bold bg-red-50 p-4 rounded-xl">{error}</p>;

  return (
    <div className="p-4 md:p-8 min-h-screen transition-colors duration-300 bg-gray-50/50 dark:bg-gray-900 text-right" dir="rtl">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">إدارة العملاء </h1>
          </div>
      </div>

      <div className="flex justify-between items-center mb-6 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <p className="text-gray-700 dark:text-gray-200 font-bold">إجمالي العملاء: <strong className="text-blue-600 dark:text-blue-400 text-lg mx-1">{clients.length}</strong> عميل</p>
        <span className="text-[10px] sm:text-xs font-black text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full uppercase tracking-wider">الترتيب: الأعلى مبيعاً</span>
      </div>

      <input
        type="text"
        className="w-full p-4 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl mb-8 focus:border-blue-500 dark:focus:border-blue-500 outline-none transition-all duration-300 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 font-bold shadow-sm"
        placeholder="ابحث باسم العميل، رقم الهاتف أو كود العميل..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="grid grid-cols-1 gap-4">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const totalOrdersAmount = getTotalOrdersAmount(client.orders);
            return (
              <div
                key={client.id}
                className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-5 cursor-pointer transform transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-blue-100 dark:hover:border-gray-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                onClick={() => setSelectedClient(client)}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                      <strong className="text-xl text-gray-800 dark:text-white">{client.name}</strong>
                      {client.code && (
                        <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800/50">#{client.code}</span>
                      )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1">الهاتف: <span className="font-sans">{client.phone}</span></p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-bold mt-1.5 bg-gray-50 dark:bg-gray-900 inline-block px-3 py-1 rounded-lg border dark:border-gray-700">
                    إجمالي المشتريات: <strong className="text-green-600 dark:text-green-400 text-base">{totalOrdersAmount.toLocaleString()} ج</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-none pt-3 md:pt-0 dark:border-gray-700">
                  {client.phone && (
                    <a
                      href={`https://wa.me/${countryCode}${client.phone.replace(/^0/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                      title="مراسلة واتساب"
                      onClick={(e) => e.stopPropagation()} // لمنع فتح المودال عند الضغط على الزر
                    >
                      <FaWhatsapp size={20} />
                    </a>
                  )}
                  {client.phone && (
                    <a
                      href={`tel:${client.phone}`}
                      className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 p-3 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                      title="اتصال هاتفي"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaPhone size={18} />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-500 mt-10 font-bold bg-white dark:bg-gray-800 p-8 rounded-2xl border border-dashed dark:border-gray-700">
            <span className="text-4xl block mb-3">🔍</span>
            لا يوجد عملاء لعرضهم أو لا توجد نتائج مطابقة للبحث.
          </div>
        )}
      </div>

      {/* ----------------- مودال تفاصيل العميل ----------------- */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 transition-all duration-300" dir="rtl">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto border border-transparent dark:border-gray-700 custom-scrollbar">
            
            <button
              className="absolute top-5 left-5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-2xl font-bold bg-gray-100 dark:bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center pb-1 transition-colors"
              onClick={() => setSelectedClient(null)}
            >
              &times;
            </button>

            <h2 className="text-2xl font-black mb-6 text-gray-800 dark:text-white">ملف العميل</h2>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 mb-8 space-y-3 text-sm font-bold text-gray-800 dark:text-gray-200">
               <div className="flex items-center"><span className="w-20 text-gray-400 dark:text-gray-500 uppercase tracking-widest text-[10px]">الاسم</span> <span>{selectedClient.name}</span></div>
               <div className="flex items-center"><span className="w-20 text-gray-400 dark:text-gray-500 uppercase tracking-widest text-[10px]">الهاتف</span> <span className="font-sans text-blue-600 dark:text-blue-400">{selectedClient.phone}</span></div>
               <div className="flex items-center"><span className="w-20 text-gray-400 dark:text-gray-500 uppercase tracking-widest text-[10px]">العنوان</span> <span>{selectedClient.address || "غير مسجل"}</span></div>
            </div>

            <h3 className="mt-6 mb-4 font-black text-gray-800 dark:text-white border-r-4 border-blue-500 dark:border-blue-400 pr-3 text-lg">سجل المشتريات (الأوردرات):</h3>
            
            {selectedClient.orders && selectedClient.orders.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <table className="min-w-full text-sm text-center">
                  <thead className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-b border-blue-100 dark:border-blue-900/50">
                    <tr>
                      <th className="px-4 py-4 font-black">تفاصيل الطلب</th>
                      <th className="px-4 py-4 font-black">الإجمالي</th>
                      <th className="px-4 py-4 font-black">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                    {selectedClient.orders.map((order, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-4 font-bold text-xs leading-relaxed max-w-[200px] truncate" title={order.items ? order.items.map(i => i.name).join(" + ") : (order.name || "أوردر")}>
                          {order.items ? order.items.map(i => i.name).join(" + ") : (order.name || "أوردر")}
                        </td>
                        <td className="px-4 py-4 font-black text-gray-800 dark:text-gray-100">{Number(order.total || 0).toLocaleString()} ج</td>
                        <td className="px-4 py-4 text-[10px] text-gray-400 dark:text-gray-500 font-sans tracking-wider">{order.date || "---"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 italic py-6 text-center bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed dark:border-gray-700 font-bold">لا يوجد أوردرات مسجلة لهذا العميل حتى الآن.</p>
            )}

            <div className="mt-8 pt-6 border-t dark:border-gray-800 flex flex-wrap justify-between items-center gap-3">
              <button
                className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 px-6 py-2.5 rounded-xl hover:bg-red-600 dark:hover:bg-red-600 hover:text-white dark:hover:text-white transition-all font-bold text-sm"
                onClick={() => handleDeleteClient(selectedClient.id)}
              >
                🗑️ حذف العميل نهائياً
              </button>
              <button
                className="bg-gray-800 dark:bg-gray-700 text-white px-8 py-2.5 rounded-xl hover:bg-black dark:hover:bg-gray-600 transition-all font-bold text-sm shadow-md"
                onClick={() => setSelectedClient(null)}
              >
                إغلاق
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientsPage;
