import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import html2canvas from "html2canvas";

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
  
  // تحديث حالة العميل لإضافة تاريخ الميلاد
  const [clientForm, setClientForm] = useState({ name: "", phone: "", address: "", dob: "" });
  
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [modalOrder, setModalOrder] = useState(null);
  const [currentClientId, setCurrentClientId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  
  const invoiceRef = useRef(null);

  const [orderForm, setOrderForm] = useState({
    items: [{ name: "", price: "" }],
    discountPercentage: 0,
    total: 0,
    date: new Date().toISOString().split("T")[0],
  });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      let clientsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      clientsList.sort((a, b) => {
        const totalA = a.orders?.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0;
        const totalB = b.orders?.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0;
        return totalB - totalA;
      });

      setClients(clientsList);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const deleteOrder = async (clientId, orderIndex) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الفاتورة نهائياً؟")) return;
    try {
      const clientRef = doc(db, "clients", clientId);
      const client = clients.find((c) => c.id === clientId);
      const updatedOrders = client.orders.filter((_, i) => i !== orderIndex);
      
      await updateDoc(clientRef, { orders: updatedOrders });
      fetchClients();
      setSuccessMessage("تم حذف الفاتورة بنجاح!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("حدث خطأ أثناء الحذف");
    }
  };

  const openClientModal = (client = null) => {
    setModalClient(client);
    setClientForm(client ? { 
        name: client.name, 
        phone: client.phone, 
        address: client.address, 
        dob: client.dob || "" 
    } : { name: "", phone: "", address: "", dob: "" });
    setShowClientModal(true);
  };

  // وظيفة حفظ العميل مع توليد الكود
  const saveClient = async () => {
    try {
      if (modalClient) {
        await updateDoc(doc(db, "clients", modalClient.id), { ...clientForm });
      } else {
        // توليد كود عشوائي من 4 أرقام
        const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
        await addDoc(collection(db, "clients"), { 
            ...clientForm, 
            clientCode: randomCode, // إضافة الكود
            orders: [], 
            createdAt: new Date().toISOString() 
        });
      }
      fetchClients(); 
      setShowClientModal(false);
      setSuccessMessage("تم حفظ بيانات العميل بنجاح!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) { setError(err.message); }
  };

  // وظيفة فتح الواتساب
  const openWhatsApp = (phone) => {
    // إزالة أي مسافات أو رموز، والتأكد من وجود كود الدولة (مثال لمصر 2)
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const calculateFinalTotal = (items, discount) => {
    const subTotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    const discountAmount = subTotal * ((parseFloat(discount) || 0) / 100);
    return (subTotal - discountAmount).toFixed(2);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderForm.items];
    newItems[index][field] = value;
    const newTotal = calculateFinalTotal(newItems, orderForm.discountPercentage);
    setOrderForm({ ...orderForm, items: newItems, total: newTotal });
  };

  const addItemRow = () => setOrderForm(prev => ({...prev, items: [...prev.items, { name: "", price: "" }]}));
  
  const removeItemRow = (index) => {
    if (orderForm.items.length === 1) return;
    const newItems = orderForm.items.filter((_, i) => i !== index);
    const newTotal = calculateFinalTotal(newItems, orderForm.discountPercentage);
    setOrderForm({ ...orderForm, items: newItems, total: newTotal });
  };

  const openOrderModal = (clientId, order = null, orderIndex = null) => {
    setCurrentClientId(clientId);
    setModalOrder(orderIndex !== null ? { ...order, index: orderIndex } : null);
    if (order) {
      const legacyItems = order.items || [{ name: order.name || "أوردر", price: order.orderCost || order.total || 0 }];
      setOrderForm({ 
        ...order, 
        items: legacyItems,
        discountPercentage: order.discountPercentage || 0,
        total: order.total || 0,
        date: order.date || new Date().toISOString().split("T")[0]
      });
    } else {
      setOrderForm({ items: [{ name: "", price: "" }], discountPercentage: 0, total: 0, date: new Date().toISOString().split("T")[0] });
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
        await updateDoc(clientRef, { orders: updatedOrders });
      } else {
        await updateDoc(clientRef, { orders: arrayUnion(orderData) });
      }
      fetchClients(); setShowOrderModal(false);
      setSuccessMessage("تم حفظ الأوردر بنجاح!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) { setError(err.message); }
  };

  const handleDownloadImage = async () => {
    if (invoiceRef.current) {
      const canvas = await html2canvas(invoiceRef.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      const clientName = clients.find(c => c.id === currentClientId)?.name || "عميل";
      link.download = `فاتورة_${clientName}.png`;
      link.click();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 text-right" dir="rtl">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">سيستم إدارة فواتير Z O U M A</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input 
          className="flex-1 border-2 border-gray-200 p-2 rounded-lg shadow-sm focus:border-blue-500 outline-none transition" 
          placeholder="ابحث بالاسم، الهاتف أو الكود..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        <button onClick={() => openClientModal()} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow transition">إضافة عميل جديد</button>
      </div>

      {successMessage && <div className="bg-green-100 border-r-4 border-green-500 text-green-700 p-3 rounded mb-4">{successMessage}</div>}

      <div className="grid gap-6">
        {clients
          .filter(c => 
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            c.phone.includes(searchTerm) || 
            (c.clientCode && c.clientCode.includes(searchTerm))
          )
          .map((client) => {
            const clientTotalSpending = client.orders?.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0;
            return (
              <div key={client.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 p-4 flex flex-wrap justify-between items-center border-b gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm ml-2">#{client.clientCode || "----"}</span>
                        {client.name} - 
                        <button 
                            onClick={() => openWhatsApp(client.phone)}
                            className="text-blue-600 font-medium hover:underline mr-2"
                            title="فتح واتساب"
                        >
                            {client.phone} 📱
                        </button>
                    </h2>
                    <div className="flex gap-4 mt-1">
                        <p className="text-xs text-green-600 font-bold">إجمالي المبيعات: {clientTotalSpending.toFixed(2)} ج</p>
                        {client.dob && <p className="text-xs text-purple-600 font-bold">تاريخ الميلاد: {client.dob}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openOrderModal(client.id)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1 rounded-md text-sm font-bold shadow transition">أوردر جديد</button>
                    <button onClick={() => openClientModal(client)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-md text-sm transition font-bold">تعديل</button>
                  </div>
                </div>
                
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-center border-collapse">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                      <tr>
                        <th className="p-3 border">الأصناف المطلوبة</th>
                        <th className="p-3 border">الإجمالي</th>
                        <th className="p-3 border">التاريخ</th>
                        <th className="p-3 border">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {client.orders?.map((o, idx) => (
                        <tr key={idx} className="hover:bg-blue-50 transition border-b">
                          <td className="p-3 border text-sm text-right">
                            {o.items?.map((item, i) => (
                                <div key={i} className="py-1">• {item.name} ({item.price} ج)</div>
                            ))}
                          </td>
                          <td className="p-3 border font-black text-green-700">{o.total} ج</td>
                          <td className="p-3 border text-xs">{o.date}</td>
                          <td className="p-3 border flex justify-center gap-2">
                                <button onClick={() => openOrderModal(client.id, o, idx)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-bold">الفاتورة</button>
                                <button onClick={() => deleteOrder(client.id, idx)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-bold">حذف</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
      </div>

      {/* موديالات العميل */}
      <TailwindModal show={showClientModal} onClose={() => setShowClientModal(false)} title="بيانات العميل">
        <div className="space-y-4 p-2">
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">اسم العميل</label>
            <input className="w-full border p-3 rounded-lg outline-none" placeholder="اسم العميل" value={clientForm.name} onChange={(e)=>setClientForm({...clientForm, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">رقم الهاتف</label>
            <input className="w-full border p-3 rounded-lg outline-none" placeholder="مثال: 010xxxxxxxx" value={clientForm.phone} onChange={(e)=>setClientForm({...clientForm, phone: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">تاريخ الميلاد (اختياري)</label>
            <input type="date" className="w-full border p-3 rounded-lg outline-none" value={clientForm.dob} onChange={(e)=>setClientForm({...clientForm, dob: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">العنوان</label>
            <input className="w-full border p-3 rounded-lg outline-none" placeholder="العنوان" value={clientForm.address} onChange={(e)=>setClientForm({...clientForm, address: e.target.value})} />
          </div>
          <button onClick={saveClient} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition shadow-md">حفظ بيانات العميل</button>
        </div>
      </TailwindModal>

      {/* موديالات الأوردر */}
      <TailwindModal
        show={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="إنشاء / تعديل أوردر"
        footer={
          <div className="flex gap-2 w-full justify-between">
            <button onClick={handleDownloadImage} className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg font-bold shadow flex-1">تحميل السكرين شوت 📸</button>
            <button onClick={saveOrder} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow flex-1">حفظ الأوردر ✅</button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-blue-800 underline">قائمة الطلبات:</h3>
              <button onClick={addItemRow} className="bg-cyan-500 hover:bg-cyan-600 text-white w-10 h-10 rounded-full font-black text-xl shadow-md flex items-center justify-center">+</button>
            </div>
            
            <div className="space-y-3 max-h-48 overflow-y-auto p-1 text-right">
                {orderForm.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-center animate-fadeIn">
                    <input className="flex-1 border p-2 rounded-md shadow-sm outline-none focus:border-cyan-500 text-right" placeholder="اسم الصنف" value={item.name} onChange={(e)=>handleItemChange(index, "name", e.target.value)} />
                    <input type="number" className="w-24 border p-2 rounded-md shadow-sm outline-none text-center" placeholder="السعر" value={item.price} onChange={(e)=>handleItemChange(index, "price", e.target.value)} />
                    {orderForm.items.length > 1 && <button onClick={()=>removeItemRow(index)} className="text-red-500 hover:bg-red-100 p-2 rounded-full font-bold">✕</button>}
                </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 text-right">الخصم (%)</label>
                <input type="number" className="w-full border p-2 rounded-md outline-none text-center" value={orderForm.discountPercentage} onChange={(e)=>setOrderForm({...orderForm, discountPercentage: e.target.value, total: calculateFinalTotal(orderForm.items, e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 text-right">التاريخ</label>
                <input type="date" className="w-full border p-2 rounded-md outline-none text-center" value={orderForm.date} onChange={(e)=>setOrderForm({...orderForm, date: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
             <div ref={invoiceRef} className="bg-white p-8 border shadow-2xl rounded-lg text-black mx-auto" style={{ width: '400px', fontFamily: 'Arial, sans-serif' }}>
                <div className="text-center border-b-2 border-gray-100 pb-4 mb-6">
                  <h2 className="text-3xl font-black text-gray-800 mb-1 tracking-tighter uppercase">Z O U M A</h2>
                  <p className="text-xs text-gray-400 tracking-widest uppercase">Premium Store • {orderForm.date}</p>
                </div>
                
                <div className="mb-6 space-y-1 text-right" dir="rtl">
                  <p className="text-sm"><strong>العميل:</strong> {clients.find(c=>c.id === currentClientId)?.name}</p>
                  <p className="text-sm"><strong>الهاتف:</strong> {clients.find(c=>c.id === currentClientId)?.phone}</p>
                  <p className="text-sm"><strong>كود العميل:</strong> #{clients.find(c=>c.id === currentClientId)?.clientCode}</p>
                </div>

                <table className="w-full text-sm mb-6 border-collapse" dir="rtl">
                  <thead>
                    <tr className="border-b-2 border-black">
                      <th className="text-right py-2">الصنف</th>
                      <th className="text-left py-2">السعر</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderForm.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-50">
                        <td className="py-3 text-right">{item.name || "صنف غير مسمى"}</td>
                        <td className="py-3 font-medium text-left">{item.price || 0} ج</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="space-y-2 border-t-2 border-gray-100 pt-4 text-right" dir="rtl">
                  <div className="flex justify-between text-xs text-gray-500 font-bold">
                    <span>{orderForm.items.reduce((s,i)=> s + (parseFloat(i.price)||0), 0)} ج</span>
                    <span>المجموع الفرعي:</span>
                  </div>
                  <div className="flex justify-between text-xs text-red-500 font-bold">
                    <span>{orderForm.discountPercentage}%</span>
                    <span>الخصم:</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mt-4 border border-gray-100">
                    <span className="font-black text-2xl text-blue-700">{orderForm.total} ج.م</span>
                    <span className="font-bold text-lg text-gray-800">الإجمالي:</span>
                  </div>
                </div>

                <div className="mt-8 text-center">
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">شكراً لثقتكم في متجرنا • يسعدنا التعامل معكم دائماً</p>
                </div>
             </div>
          </div>
        </div>
      </TailwindModal>

      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default ClientsPage;
