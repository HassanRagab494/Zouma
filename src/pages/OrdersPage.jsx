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
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const TailwindModal = ({ show, onClose, title, children, footer }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
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
  const [clientForm, setClientForm] = useState({ name: "", phone: "", address: "", birthDate: "" });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [modalOrder, setModalOrder] = useState(null);
  const [currentClientId, setCurrentClientId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [orderForm, setOrderForm] = useState({
    items: [{ name: "", price: 0 }],
    discountPercentage: 0,
    total: 0,
    date: new Date().toISOString().split("T")[0],
  });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const clientsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setClients(clientsList);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const calculateFinalTotal = (items, discount) => {
    const subTotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const discountAmount = subTotal * ((parseFloat(discount) || 0) / 100);
    return (subTotal - discountAmount).toFixed(2);
  };

  const addItemRow = () => {
    setOrderForm(prev => ({
      ...prev,
      items: [...prev.items, { name: "", price: 0 }]
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderForm.items];
    newItems[index][field] = value;
    const newTotal = calculateFinalTotal(newItems, orderForm.discountPercentage);
    setOrderForm({ ...orderForm, items: newItems, total: newTotal });
  };

  const removeItemRow = (index) => {
    if (orderForm.items.length === 1) return;
    const newItems = orderForm.items.filter((_, i) => i !== index);
    const newTotal = calculateFinalTotal(newItems, orderForm.discountPercentage);
    setOrderForm({ ...orderForm, items: newItems, total: newTotal });
  };

  const openClientModal = (client = null) => {
    setModalClient(client);
    setClientForm(client ? { ...client } : { name: "", phone: "", address: "", birthDate: "" });
    setShowClientModal(true);
  };

  const saveClient = async () => {
    try {
      if (modalClient) {
        await updateDoc(doc(db, "clients", modalClient.id), { ...clientForm });
      } else {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        await addDoc(collection(db, "clients"), { 
            ...clientForm, 
            code, 
            orders: [], 
            createdAt: new Date().toISOString() 
        });
      }
      fetchClients(); setShowClientModal(false);
      setSuccessMessage("تم حفظ بيانات العميل!");
    } catch (err) { setError(err.message); }
  };

  const openOrderModal = (clientId, order = null, orderIndex = null) => {
    setCurrentClientId(clientId);
    setModalOrder(orderIndex !== null ? { ...order, index: orderIndex } : null);
    
    if (order) {
      const sanitizedOrder = {
        ...order,
        items: order.items || [{ name: order.name || "أوردر", price: order.orderCost || order.total || 0 }]
      };
      setOrderForm(sanitizedOrder);
    } else {
      setOrderForm({
        items: [{ name: "", price: 0 }],
        discountPercentage: 0,
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
      const finalTotal = calculateFinalTotal(orderForm.items, orderForm.discountPercentage);
      
      const cost = +(finalTotal * 0.7).toFixed(2);
      const profit = +(finalTotal * 0.3).toFixed(2);
      const orderData = { ...orderForm, total: finalTotal, cost, profit };

      if (modalOrder) {
        const updatedOrders = [...client.orders];
        updatedOrders[modalOrder.index] = orderData;
        await updateDoc(clientRef, { orders: updatedOrders, lastOrderDate: orderForm.date });
      } else {
        await updateDoc(clientRef, { orders: arrayUnion(orderData), lastOrderDate: orderForm.date });
      }
      fetchClients(); setShowOrderModal(false);
      setSuccessMessage("تم حفظ الأوردر بنجاح!");
    } catch (err) { setError(err.message); }
  };

  const downloadInvoice = (client, order) => {
    const doc = new jsPDF();
    doc.text("Order Invoice", 105, 15, { align: "center" });
    doc.text(`Customer: ${client.name}`, 20, 30);
    doc.text(`Phone: ${client.phone || 'N/A'}`, 20, 37);
    doc.text(`Date: ${order.date}`, 20, 44);

    const itemsToPrint = order.items 
      ? order.items.map(item => [item.name, `${item.price} EGP`]) 
      : [[order.name || "Order", `${order.orderCost || order.total} EGP`]];

    doc.autoTable({
      startY: 50,
      head: [['Item Name', 'Price']],
      body: itemsToPrint,
      foot: [['Discount', `${order.discountPercentage || 0}%`], ['Total Amount', `${order.total} EGP`]]
    });

    doc.save(`Invoice_${client.name}_${order.date}.pdf`);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <h1 className="mb-6 text-3xl font-bold text-center text-gray-800">إدارة مبيعات الويب سايت</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
        <input
          type="text"
          className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 shadow-sm"
          placeholder="ابحث باسم العميل أو رقم الهاتف..."
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={() => openClientModal()} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-bold transition">إضافة عميل جديد</button>
      </div>

      {successMessage && <div className="bg-green-100 border-r-4 border-green-500 text-green-700 p-3 rounded mb-4 shadow-sm">{successMessage}</div>}

      <div className="space-y-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-4 flex flex-wrap justify-between items-center border-b gap-2">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{client.name} - <span className="text-blue-600">{client.phone}</span></h3>
                <p className="text-sm text-gray-500">{client.address}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openOrderModal(client.id)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded text-sm transition">إضافة أوردر</button>
                <button onClick={() => openClientModal(client)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm transition">تعديل</button>
              </div>
            </div>

            <div className="p-4">
              <table className="w-full text-center border-collapse">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="p-2 border">الأصناف</th>
                    <th className="p-2 border">الإجمالي</th>
                    <th className="p-2 border">التاريخ</th>
                    <th className="p-2 border">الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {client.orders?.map((o, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50 transition">
                      <td className="p-2 border text-sm text-right">
                        {o.items ? (
                          o.items.map((item, i) => <div key={i} className="border-b last:border-0 py-1">• {item.name} ({item.price}ج)</div>)
                        ) : (
                          <div className="text-gray-400">{o.name} (بيانات قديمة)</div>
                        )}
                      </td>
                      <td className="p-2 border font-bold text-green-700">{o.total} ج</td>
                      <td className="p-2 border text-sm">{o.date}</td>
                      <td className="p-2 border">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => downloadInvoice(client, o)} className="bg-gray-800 hover:bg-black text-white px-2 py-1 rounded text-xs transition">تحميل فاتورة</button>
                          <button onClick={() => openOrderModal(client.id, o, idx)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs transition">تعديل</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <TailwindModal show={showClientModal} onClose={() => setShowClientModal(false)} title="بيانات العميل">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-bold mb-1">اسم العميل</label>
                <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400" value={clientForm.name} onChange={(e)=>setClientForm({...clientForm, name: e.target.value})} />
             </div>
             <div>
                <label className="block text-sm font-bold mb-1">رقم الهاتف</label>
                <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400" value={clientForm.phone} onChange={(e)=>setClientForm({...clientForm, phone: e.target.value})} />
             </div>
             <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-1">العنوان</label>
                <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-400" value={clientForm.address} onChange={(e)=>setClientForm({...clientForm, address: e.target.value})} />
             </div>
          </div>
          <button onClick={saveClient} className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-6 py-2 rounded-lg font-bold transition">حفظ بيانات العميل</button>
      </TailwindModal>

      <TailwindModal
        show={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="إنشاء فاتورة أوردر"
        footer={<button onClick={saveOrder} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg font-bold transition">حفظ الأوردر</button>}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-gray-700">الأصناف المطلوبة:</h3>
            <button onClick={addItemRow} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition font-bold">+ إضافة صنف جديد</button>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2 p-1">
            {orderForm.items?.map((item, index) => (
              <div key={index} className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                <input
                  placeholder="اسم المنتج (مثلاً: مج)"
                  className="flex-1 border p-2 rounded-md text-right focus:ring-1 focus:ring-green-400"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, "name", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="السعر"
                  className="w-24 border p-2 rounded-md text-center focus:ring-1 focus:ring-green-400"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, "price", e.target.value)}
                />
                <button 
                  onClick={() => removeItemRow(index)} 
                  className="text-white bg-red-400 hover:bg-red-600 w-8 h-8 rounded-full flex items-center justify-center transition"
                  title="حذف الصنف"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div>
              <label className="block text-sm font-bold mb-1">نسبة الخصم (%)</label>
              <input
                type="number"
                className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-400"
                value={orderForm.discountPercentage}
                onChange={(e) => {
                  const disc = e.target.value;
                  setOrderForm(prev => ({ ...prev, discountPercentage: disc, total: calculateFinalTotal(prev.items, disc) }));
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">تاريخ الأوردر</label>
              <input
                type="date"
                className="w-full border p-2 rounded-md focus:ring-2 focus:ring-blue-400"
                value={orderForm.date}
                onChange={(e) => setOrderForm({ ...orderForm, date: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-blue-600 p-4 rounded-lg flex justify-between items-center text-white shadow-lg">
            <span className="text-lg font-bold">الإجمالي النهائي:</span>
            <span className="text-3xl font-black">{orderForm.total} ج.م</span>
          </div>
        </div>
      </TailwindModal>
    </div>
  );
}

export default ClientsPage;
