import React, { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// مكون Modal بسيط لـ Tailwind CSS
const TailwindModal = ({ show, onClose, title, children, footer }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>
        <div className="p-4">{children}</div>
        <div className="flex justify-end p-4 border-t border-gray-200 gap-2">
          {footer}
        </div>
      </div>
    </div>
  );
};

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [showClientModal, setShowClientModal] = useState(false);
  const [modalClient, setModalClient] = useState(null);
  const [clientForm, setClientForm] = useState({
    name: "",
    phone: "",
    address: "",
    birthDate: "",
  });

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [modalOrder, setModalOrder] = useState(null);
  const [currentClientId, setCurrentClientId] = useState(null);
  const [orderForm, setOrderForm] = useState({
    name: "",
    orderCost: 0,
    cost: 0,
    profit: 0,
    quantity: 1,
    discountPercentage: 0, // تم تغيير الاسم ليعكس أنه نسبة مئوية
    total: 0,
    date: new Date().toISOString().split("T")[0],
  });

  const [successMessage, setSuccessMessage] = useState("");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const clientsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(clientsList);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // ---------- مودال العميل ----------
  const openClientModal = (client = null) => {
    setModalClient(client);
    if (client) {
      setClientForm({
        name: client.name || "",
        phone: client.phone || "",
        address: client.address || "",
        birthDate: client.birthDate || "",
      });
    } else {
      setClientForm({ name: "", phone: "", address: "", birthDate: "" });
    }
    setShowClientModal(true);
  };

  const saveClient = async () => {
    try {
      if (modalClient) {
        const clientRef = doc(db, "clients", modalClient.id);
        await updateDoc(clientRef, { ...clientForm });
        setSuccessMessage("تم تعديل العميل بنجاح!");
      } else {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        await addDoc(collection(db, "clients"), {
          ...clientForm,
          code,
          orders: [],
          createdAt: new Date().toISOString(),
          firstOrderDate: null,
          lastOrderDate: null,
        });
        setSuccessMessage("تم إضافة العميل بنجاح!");
      }
      fetchClients();
      setShowClientModal(false);
    } catch (err) {
      console.error("Error saving client:", err);
      setError(err.message);
    }
  };

  const deleteClient = async (clientId) => {
    if (!window.confirm("هل تريد حذف العميل؟")) return;
    try {
      await deleteDoc(doc(db, "clients", clientId));
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      setSuccessMessage("تم حذف العميل بنجاح!");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  // ---------- مودال الأوردر ----------
  // دالة لحساب الإجمالي بناءً على السعر، الكمية، ونسبة الخصم
  const calculateTotal = useCallback((orderCost, quantity, discountPercentage) => {
    const baseTotal = (parseFloat(orderCost) || 0) * (parseInt(quantity) || 1);
    const discountAmount = baseTotal * ((parseFloat(discountPercentage) || 0) / 100);
    return (baseTotal - discountAmount).toFixed(2);
  }, []);

  const openOrderModal = (clientId, order = null, orderIndex = null) => {
    setCurrentClientId(clientId);
    setModalOrder(orderIndex !== null ? { ...order, index: orderIndex } : null);

    if (order) {
      setOrderForm({ ...order });
    } else {
      setOrderForm({
        name: "",
        orderCost: 0,
        cost: 0,
        profit: 0,
        quantity: 1,
        discountPercentage: 0, // استخدام الاسم الجديد
        total: 0,
        date: new Date().toISOString().split("T")[0],
      });
    }
    setShowOrderModal(true);
  };

  const saveOrder = async () => {
    try {
      const clientRef = doc(db, "clients", currentClientId);
      const client = clients.find((c) => c.id === currentClientId);

      const total = calculateTotal(
        orderForm.orderCost,
        orderForm.quantity,
        orderForm.discountPercentage // استخدام الاسم الجديد
      );

      // إعادة حساب التكلفة والمكسب بعد تطبيق الخصم على السعر الإجمالي
      const basePriceAfterDiscount = parseFloat(total); // السعر بعد الخصم
      const cost = +(basePriceAfterDiscount * 0.7).toFixed(2);
      const profit = +(basePriceAfterDiscount * 0.3).toFixed(2);


      if (modalOrder) {
        const updatedOrders = [...client.orders];
        updatedOrders[modalOrder.index] = { ...orderForm, total, cost, profit };
        await updateDoc(clientRef, { orders: updatedOrders, lastOrderDate: orderForm.date });
        setSuccessMessage("تم تعديل الأوردر بنجاح!");
      } else {
        const orderToAdd = { ...orderForm, total, cost, profit };
        const updateData = { orders: arrayUnion(orderToAdd), lastOrderDate: orderForm.date };
        if (!client.firstOrderDate) updateData.firstOrderDate = orderForm.date;
        await updateDoc(clientRef, updateData);
        setSuccessMessage("تم إضافة الأوردر بنجاح!");
      }

      fetchClients();
      setShowOrderModal(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const deleteOrder = async (clientId, orderIndex) => {
    if (!window.confirm("هل تريد حذف الأوردر؟")) return;
    try {
      const clientRef = doc(db, "clients", clientId);
      const client = clients.find((c) => c.id === clientId);
      const updatedOrders = client.orders.filter((_, i) => i !== orderIndex);
      const updateData = { orders: updatedOrders };
      if (updatedOrders.length === 0) updateData.firstOrderDate = updateData.lastOrderDate = null;
      else updateData.lastOrderDate = updatedOrders[updatedOrders.length - 1].date; // قد تحتاج لتعديل هذا ليعكس تاريخ أحدث أوردر متبقي
      await updateDoc(clientRef, updateData);
      fetchClients();
      setSuccessMessage("تم حذف الأوردر بنجاح!");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.code && c.code.includes(searchTerm))
  );

  const getTotalOrdersAmount = (orders) =>
    (orders || []).reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

  if (loading) return <p className="text-center mt-5 text-gray-700">جارٍ تحميل البيانات...</p>;
  if (error) return <p className="text-red-500 text-center mt-5">{error}</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-center text-gray-800">
        نظام إدارة العملاء
      </h1>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <p className="text-lg text-gray-700">
          إجمالي العملاء: <strong className="font-bold">{clients.length}</strong>
        </p>
        <button
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-200"
          onClick={() => openClientModal()}
        >
          إضافة عميل جديد
        </button>
      </div>

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          {successMessage}
        </div>
      )}

      <input
        type="text"
        className="form-input w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-6"
        placeholder="ابحث باسم العميل أو رقم الهاتف أو الكود..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {filteredClients.length === 0 && (
        <p className="text-center text-gray-500">لا يوجد عملاء لعرضهم.</p>
      )}

      {filteredClients.map((client) => {
        const totalOrders = getTotalOrdersAmount(client.orders);
        return (
          <div key={client.id} className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
            <div className="bg-gray-100 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-gray-200">
              <span className="font-semibold text-xl text-gray-800">
                {client.name} ({client.phone || "غير محدد"}) [{client.code}]
              </span>
              <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm py-1 px-3 rounded transition duration-200"
                  onClick={() => openClientModal(client)}
                >
                  تعديل
                </button>
                <button
                  className="bg-purple-500 hover:bg-purple-600 text-white text-sm py-1 px-3 rounded transition duration-200"
                  onClick={() => openOrderModal(client.id)}
                >
                  إضافة أوردر
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white text-sm py-1 px-3 rounded transition duration-200"
                  onClick={() => deleteClient(client.id)}
                >
                  حذف
                </button>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-700 mb-1">
                <strong className="font-medium">العنوان:</strong>{" "}
                {client.address || "غير محدد"}
              </p>
              <p className="text-gray-700 mb-3">
                <strong className="font-medium">إجمالي مبلغ الأوردرات:</strong>{" "}
                {totalOrders.toFixed(2)} ج
              </p>

              {client.orders && client.orders.length > 0 && (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
  <table className="min-w-full border-collapse">
    <thead className="bg-gray-50">
      <tr>
        {["اسم الأوردر", "السعر", "الكمية", "الخصم (%)", "الإجمالي", "التاريخ", "إجراءات"].map(
          (title, i) => (
            <th
              key={i}
              className="py-2 px-4 border-b text-center text-sm font-semibold text-gray-600 whitespace-nowrap"
            >
              {title}
            </th>
          )
        )}
      </tr>
    </thead>
    <tbody>
      {client.orders.map((o, idx) => (
        <tr key={idx} className="hover:bg-gray-50">
          <td className="py-2 px-4 border-b text-center text-sm text-gray-800 whitespace-nowrap">
            {o.name}
          </td>
          <td className="py-2 px-4 border-b text-center text-sm text-gray-800 whitespace-nowrap">
            {o.orderCost}
          </td>
          <td className="py-2 px-4 border-b text-center text-sm text-gray-800 whitespace-nowrap">
            {o.quantity}
          </td>
          <td className="py-2 px-4 border-b text-center text-sm text-gray-800 whitespace-nowrap">
            {o.discountPercentage || 0}%
          </td>
          <td className="py-2 px-4 border-b text-center text-sm text-gray-800 whitespace-nowrap">
            {o.total}
          </td>
          <td className="py-2 px-4 border-b text-center text-sm text-gray-800 whitespace-nowrap">
            {o.date}
          </td>
          <td className="py-2 px-4 border-b text-center text-sm text-gray-800 whitespace-nowrap">
            <button
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs py-1 px-2 rounded mr-1"
              onClick={() => openOrderModal(client.id, o, idx)}
            >
              تعديل
            </button>
            <button
              className="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded"
              onClick={() => deleteOrder(client.id, idx)}
            >
              حذف
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

              )}
            </div>
          </div>
        );
      })}

      {/* مودال العميل (TailwindModal) */}
      <TailwindModal
        show={showClientModal}
        onClose={() => setShowClientModal(false)}
        title={modalClient ? "تعديل العميل" : "إضافة عميل جديد"}
        footer={
          <>
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition duration-200"
              onClick={() => setShowClientModal(false)}
            >
              إلغاء
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200"
              onClick={saveClient}
            >
              حفظ
            </button>
          </>
        }
      >
        <form>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                الاسم
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={clientForm.name}
                onChange={(e) =>
                  setClientForm({ ...clientForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                الهاتف
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={clientForm.phone}
                onChange={(e) =>
                  setClientForm({ ...clientForm, phone: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                العنوان
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={clientForm.address}
                onChange={(e) =>
                  setClientForm({ ...clientForm, address: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                تاريخ الميلاد
              </label>
              <input
                type="date"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={clientForm.birthDate}
                onChange={(e) =>
                  setClientForm({ ...clientForm, birthDate: e.target.value })
                }
              />
            </div>
          </div>
        </form>
      </TailwindModal>

      {/* مودال الأوردر (TailwindModal) */}
      <TailwindModal
        show={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title={modalOrder ? "تعديل الأوردر" : "إضافة أوردر جديد"}
        footer={
          <>
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition duration-200"
              onClick={() => setShowOrderModal(false)}
            >
              إلغاء
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200"
              onClick={saveOrder}
            >
              حفظ
            </button>
          </>
        }
      >
        <form>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                اسم الأوردر
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={orderForm.name}
                onChange={(e) =>
                  setOrderForm({ ...orderForm, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                سعر الأوردر
              </label>
              <input
                type="number"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={orderForm.orderCost}
                onChange={(e) => {
                  const orderCost = parseFloat(e.target.value) || 0;
                  setOrderForm((prev) => {
                    const quantity = prev.quantity || 1;
                    const discountPercentage = prev.discountPercentage || 0;
                    const total = calculateTotal(orderCost, quantity, discountPercentage);
                    const basePriceAfterDiscount = parseFloat(total);
                    const cost = +(basePriceAfterDiscount * 0.7).toFixed(2);
                    const profit = +(basePriceAfterDiscount * 0.3).toFixed(2);

                    return {
                      ...prev,
                      orderCost,
                      cost,
                      profit,
                      total,
                    };
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                التكلفة
              </label>
              <input
                type="number"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline"
                value={orderForm.cost}
                readOnly
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                المكسب
              </label>
              <input
                type="number"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline"
                value={orderForm.profit}
                readOnly
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                الكمية
              </label>
              <input
                type="number"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={orderForm.quantity}
                onChange={(e) => {
                  const quantity = parseInt(e.target.value) || 1;
                  setOrderForm((prev) => {
                    const orderCost = prev.orderCost || 0;
                    const discountPercentage = prev.discountPercentage || 0;
                    const total = calculateTotal(orderCost, quantity, discountPercentage);
                    const basePriceAfterDiscount = parseFloat(total);
                    const cost = +(basePriceAfterDiscount * 0.7).toFixed(2);
                    const profit = +(basePriceAfterDiscount * 0.3).toFixed(2);
                    return {
                      ...prev,
                      quantity,
                      cost,
                      profit,
                      total,
                    };
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                الخصم (نسبة مئوية %)
              </label>
              <input
                type="number"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={orderForm.discountPercentage}
                onChange={(e) => {
                  const discountPercentage = parseFloat(e.target.value) || 0;
                  setOrderForm((prev) => {
                    const orderCost = prev.orderCost || 0;
                    const quantity = prev.quantity || 1;
                    const total = calculateTotal(orderCost, quantity, discountPercentage);
                    const basePriceAfterDiscount = parseFloat(total);
                    const cost = +(basePriceAfterDiscount * 0.7).toFixed(2);
                    const profit = +(basePriceAfterDiscount * 0.3).toFixed(2);
                    return {
                      ...prev,
                      discountPercentage,
                      cost,
                      profit,
                      total,
                    };
                  });
                }}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                الإجمالي
              </label>
              <input
                type="number"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline"
                value={orderForm.total}
                readOnly
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                التاريخ
              </label>
              <input
                type="date"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={orderForm.date}
                onChange={(e) =>
                  setOrderForm((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </div>
          </div>
        </form>
      </TailwindModal>
    </div>
  );
}

export default ClientsPage;
