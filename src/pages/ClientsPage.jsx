import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FaWhatsapp, FaPhone } from "react-icons/fa";

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "clients"));
      const clientsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(clientsList);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.code && c.code.includes(searchTerm))
  );

  // إجمالي الطلبات للعميل - يرجع دايمًا رقم
  const getTotalOrdersAmount = (orders) =>
    (orders || []).reduce((sum, o) => sum + Number(o.total || 0), 0);

  if (loading)
    return (
      <p className="text-center mt-10 text-gray-600">جارٍ تحميل البيانات...</p>
    );
  if (error)
    return <p className="text-center mt-10 text-red-600">{error}</p>;

  const countryCode = "+20";

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">لوحة العملاء</h1>
      <p className="text-right mb-4">
        إجمالي العملاء: <strong>{clients.length}</strong>
      </p>

      <input
        type="text"
        className="w-full p-2 border border-gray-300 rounded mb-4"
        placeholder="ابحث باسم، رقم الهاتف أو الكود..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* قائمة العملاء */}
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
                  إجمالي المشتريات:{" "}
                  <strong className="text-green-600">
                    {Number(totalOrdersAmount || 0).toFixed(2)} ج
                  </strong>
                </p>
              </div>
              <div className="flex items-center flex-wrap gap-3">
                {client.phone && (
                  <a
                    href={`https://wa.me/${countryCode}${client.phone.replace(
                      /^0/,
                      ""
                    )}`}
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
                  <span className="bg-blue-600 text-white px-2 py-1 rounded">
                    {client.code}
                  </span>
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

      {/* مودال تفاصيل العميل */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-[2000] overflow-auto pt-20 sm:pt-0">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative mx-2 sm:mx-0">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
              onClick={() => setSelectedClient(null)}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">تفاصيل العميل</h2>
            <p>
              <strong>الاسم:</strong> {selectedClient.name}
            </p>
            <p>
              <strong>الهاتف:</strong> {selectedClient.phone}
            </p>
            <p>
              <strong>العنوان:</strong>{" "}
              {selectedClient.address || "غير محدد"}
            </p>
            {selectedClient.birthDate && (
              <p>
                <strong>تاريخ الميلاد:</strong>{" "}
                {new Date(selectedClient.birthDate).toLocaleDateString()}
              </p>
            )}
            {selectedClient.firstPurchaseDate && (
              <p>
                <strong>أول شراء:</strong>{" "}
                {new Date(
                  selectedClient.firstPurchaseDate
                ).toLocaleDateString()}
              </p>
            )}

            <h3 className="mt-4 mb-2 font-semibold">تفاصيل الأوردرات:</h3>
            {selectedClient.orders && selectedClient.orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 text-sm sm:text-base">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 border">الطلب</th>
                      <th className="px-3 py-2 border">تكلفة البضاعة</th>
                      <th className="px-3 py-2 border">المكسب</th>
                      <th className="px-3 py-2 border">السعر الكلي</th>
                      <th className="px-3 py-2 border">تاريخ الطلب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClient.orders.map((order, idx) => (
                      <tr key={idx} className="text-center">
                        <td className="px-3 py-2 border">
                          {order.name || "غير محدد"}
                        </td>
                        <td className="px-3 py-2 border">
                          {Number(order.cost || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 border">
                          {Number(order.profit || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 border">
                          {Number(order.total || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 border">
                          {order.date
                            ? new Date(order.date).toLocaleDateString()
                            : "غير محدد"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">
                لا يوجد أوردرات لهذا العميل حتى الآن.
              </p>
            )}

            <div className="mt-4 flex justify-end gap-3 flex-wrap">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={() => handleDeleteClient(selectedClient.id)}
              >
                حذف العميل
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
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
