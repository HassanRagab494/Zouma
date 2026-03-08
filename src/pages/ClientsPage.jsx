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

  if (loading)
    return <p className="text-center mt-10 text-gray-600">جارٍ تحميل البيانات...</p>;
  if (error)
    return <p className="text-center mt-10 text-red-600">{error}</p>;

  return (
    <div className="p-4 text-right" dir="rtl">
      <h1 className="text-2xl font-bold mb-4 text-center">لوحة إدارة العملاء (ZOUMA)</h1>

      <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg border">
        <p className="text-gray-700">إجمالي العملاء: <strong>{clients.length}</strong></p>
        <span className="text-xs text-gray-400">الترتيب: حسب إجمالي المبيعات</span>
      </div>

      <input
        type="text"
        className="w-full p-3 border-2 border-blue-100 rounded-lg mb-4 focus:border-blue-500 outline-none transition"
        placeholder="ابحث باسم، رقم الهاتف أو الكود..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {filteredClients.length > 0 ? (
        filteredClients.map((client) => {
          const totalOrdersAmount = getTotalOrdersAmount(client.orders);
          return (
            <div
              key={client.id}
              className="bg-white shadow-sm rounded-lg mb-3 p-4 cursor-pointer transform transition duration-300 hover:scale-105 flex flex-col md:flex-row justify-between items-start md:items-center"
              onClick={() => setSelectedClient(client)}
            >
              <div className="mb-2 md:mb-0">
                <strong className="text-lg">{client.name}</strong>
                <p className="text-gray-700 mb-0">الهاتف: {client.phone}</p>
                <p className="text-gray-700 mb-0">
                  إجمالي المشتريات: <strong className="text-green-600">{totalOrdersAmount.toFixed(2)} ج</strong>
                </p>
              </div>

              <div className="flex items-center flex-wrap gap-3">
                {client.phone && (
                  <a
                    href={`https://wa.me/${countryCode}${client.phone.replace(/^0/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 text-xl"
                    title="واتساب"
                  >
                    <FaWhatsapp />
                  </a>
                )}
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="text-blue-600 text-xl"
                    title="اتصال"
                  >
                    <FaPhone />
                  </a>
                )}
                {client.code && (
                  <span className="bg-blue-600 text-white px-2 py-1 rounded">{client.code}</span>
                )}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center text-gray-500 mt-10">
          لا يوجد عملاء لعرضهم أو لا توجد نتائج للبحث.
        </div>
      )}

      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-fadeIn">
            <button
              className="absolute top-4 left-4 text-gray-400 hover:text-red-500 text-2xl font-bold"
              onClick={() => setSelectedClient(null)}
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-4">تفاصيل العميل</h2>
            <p><strong>الاسم:</strong> {selectedClient.name}</p>
            <p><strong>الهاتف:</strong> {selectedClient.phone}</p>
            <p><strong>العنوان:</strong> {selectedClient.address || "غير محدد"}</p>

            <h3 className="mt-6 mb-3 font-bold text-gray-800 border-r-4 border-blue-500 pr-2">سجل الأوردرات:</h3>
            {selectedClient.orders && selectedClient.orders.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full text-sm text-center">
                  <thead className="bg-blue-50 text-blue-700">
                    <tr>
                      <th className="px-2 py-3 border">الطلب</th>
                      <th className="px-2 py-3 border">الإجمالي</th>
                      <th className="px-2 py-3 border">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClient.orders.map((order, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition">
                        <td className="px-2 py-3 border">
                          {order.items ? order.items.map(i => i.name).join(" + ") : (order.name || "أوردر")}
                        </td>
                        <td className="px-2 py-3 border font-bold">{Number(order.total || 0).toFixed(2)} ج</td>
                        <td className="px-2 py-3 border text-xs">{order.date || "---"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic py-4">لا يوجد أوردرات مسجلة لهذا العميل.</p>
            )}

            <div className="mt-8 flex justify-between items-center gap-3">
              <button
                className="bg-red-50 text-red-600 border border-red-200 px-6 py-2 rounded-lg hover:bg-red-600 hover:text-white transition font-bold"
                onClick={() => handleDeleteClient(selectedClient.id)}
              >
                حذف العميل نهائياً
              </button>
              <button
                className="bg-gray-800 text-white px-8 py-2 rounded-lg hover:bg-black transition"
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