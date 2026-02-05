import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc, 
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
  const [sortBy, setSortBy] = useState("allTime");
  const [showClientModal, setShowClientModal] = useState(false);
  const [modalClient, setModalClient] = useState(null);
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
      const clientsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setClients(clientsList);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const deleteClient = async (clientId, clientName) => {
    if (window.confirm(`هل أنت متأكد من حذف العميل "${clientName}" وجميع فواتيره نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      try {
        await deleteDoc(doc(db, "clients", clientId));
        setSuccessMessage("تم حذف العميل بنجاح!");
        fetchClients(); // تحديث القائمة
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (err) {
        setError("حدث خطأ أثناء محاولة الحذف");
      }
    }
  };

  const processedClients = useMemo(() => {
    let filtered = clients.filter(c => 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone?.includes(searchTerm) || 
      (c.clientCode && c.clientCode.includes(searchTerm))
    );

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    return [...filtered].sort((a, b) => {
      if (sortBy === "allTime") {
        const totalA = a.orders?.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0;
        const totalB = b.orders?.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0;
        return totalB - totalA;
      } 
      if (sortBy === "recent") {
        const lastA = a.orders?.length > 0 ? new Date(a.orders[a.orders.length - 1].date).getTime() : 0;
        const lastB = b.orders?.length > 0 ? new Date(b.orders[b.orders.length - 1].date).getTime() : 0;
        return lastB - lastA;
      }
      if (sortBy === "thisMonth") {
        const totalA = a.orders?.filter(o => new Date(o.date) >= startOfMonth).reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0;
        const totalB = b.orders?.filter(o => new Date(o.date) >= startOfMonth).reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0;
        return totalB - totalA;
      }
      if (sortBy === "threeMonths") {
        const totalA = a.orders?.filter(o => new Date(o.date) >= threeMonthsAgo).reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0;
        const totalB = b.orders?.filter(o => new Date(o.date) >= threeMonthsAgo).reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0;
        return totalB - totalA;
      }
      return 0;
    });
  }, [clients, searchTerm, sortBy]);

  const openWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  const saveClient = async () => {
    try {
      if (modalClient) {
        await updateDoc(doc(db, "clients", modalClient.id), { ...clientForm });
      } else {
        const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
        await addDoc(collection(db, "clients"), { 
            ...clientForm, 
            clientCode: randomCode,
            orders: [], 
            createdAt: new Date().toISOString() 
        });
      }
      fetchClients(); setShowClientModal(false);
      setSuccessMessage("تم الحفظ بنجاح!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) { setError(err.message); }
  };

  const openOrderModal = (clientId, order = null, orderIndex = null) => {
    setCurrentClientId(clientId);
    setModalOrder(orderIndex !== null ? { ...order, index: orderIndex } : null);
    if (order) {
      setOrderForm({ 
        ...order, 
        items: order.items || [{ name: "أوردر", price: order.total }],
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
      const subTotal = orderForm.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
      const finalTotal = (subTotal - (subTotal * (orderForm.discountPercentage / 100))).toFixed(2);
      const orderData = { ...orderForm, total: finalTotal };

      if (modalOrder) {
        const updatedOrders = [...client.orders];
        updatedOrders[modalOrder.index] = orderData;
        await updateDoc(clientRef, { orders: updatedOrders });
      } else {
        await updateDoc(clientRef, { orders: arrayUnion(orderData) });
      }
      fetchClients(); setShowOrderModal(false);
      setSuccessMessage("تم حفظ الأوردر!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="container mx-auto px-4 py-8 text-right" dir="rtl">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800 tracking-tight">
        Z O U M A <span className="text-blue-600">DASHBOARD</span>
      </h1>

      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <input 
          className="flex-1 border-2 border-gray-100 p-3 rounded-lg outline-none focus:border-blue-400 transition-all shadow-inner" 
          placeholder="ابحث بالاسم، الهاتف أو الكود..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
        
        <div className="flex gap-2">
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-50 border-2 border-gray-100 px-4 py-2 rounded-lg font-bold text-gray-700 outline-none focus:border-purple-400"
          >
            <option value="allTime">🔝 أعلى مبيعات (الكل)</option>
            <option value="recent">🕒 أحدث أوردرات</option>
            <option value="thisMonth">📅 الأعلى هذا الشهر</option>
            <option value="threeMonths">🗓️ الأعلى (3 شهور)</option>
          </select>

          <button 
            onClick={() => { setModalClient(null); setClientForm({name:"", phone:"", address:"", dob:""}); setShowClientModal(true); }} 
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all active:scale-95 whitespace-nowrap"
          >
            + عميل جديد
          </button>
        </div>
      </div>

      {successMessage && <div className="bg-green-500 text-white p-3 rounded-lg mb-4 text-center animate-pulse">{successMessage}</div>}

      <div className="grid gap-6">
        {processedClients.map((client) => {
          const totalSpent = client.orders?.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0;
          return (
            <div key={client.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gray-50/50 p-4 flex flex-wrap justify-between items-center border-b border-gray-100 gap-3">
                <div className="flex-1 min-w-[250px]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-black">#{client.clientCode || "----"}</span>
                    <h2 className="text-xl font-bold text-gray-800">{client.name}</h2>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm mt-2">
                    <button onClick={() => openWhatsApp(client.phone)} className="text-green-600 font-bold hover:bg-green-50 px-2 py-1 rounded-md border border-green-200">
                      {client.phone} 🟢 WhatsApp
                    </button>
                    <span className="text-gray-500">📍 {client.address || "بدون عنوان"}</span>
                    {client.dob && <span className="text-purple-600">🎂 {client.dob}</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="text-left ml-4 border-l pl-4 border-gray-200">
                     <p className="text-[10px] text-gray-400 font-bold uppercase">إجمالي المشتريات</p>
                     <p className="text-lg font-black text-blue-600">{totalSpent.toFixed(2)} ج</p>
                  </div>
                  <button onClick={() => openOrderModal(client.id)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm">أوردر جديد</button>
                  <button onClick={() => { setModalClient(client); setClientForm({...client}); setShowClientModal(true); }} className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-4 py-2 rounded-xl text-sm font-bold transition-all">تعديل</button>
                  {/* زر حذف العميل */}
                  <button onClick={() => deleteClient(client.id, client.name)} className="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-xl transition-all" title="حذف العميل">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {client.orders && client.orders.length > 0 && (
                <div className="p-4 overflow-x-auto bg-white">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="text-gray-400 text-[10px] uppercase border-b border-gray-50">
                        <th className="pb-2 font-bold">التاريخ</th>
                        <th className="pb-2 font-bold">الأصناف</th>
                        <th className="pb-2 font-bold text-center">الإجمالي</th>
                        <th className="pb-2 font-bold text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {client.orders.slice().reverse().map((o, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 group">
                          <td className="py-3 text-xs text-gray-500">{o.date}</td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-1">
                                {o.items?.map((item, i) => (
                                    <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                                        {item.name}
                                    </span>
                                ))}
                            </div>
                          </td>
                          <td className="py-3 text-center font-bold text-gray-700">{o.total} ج</td>
                          <td className="py-3 text-center">
                            <button onClick={() => openOrderModal(client.id, o, client.orders.length - 1 - idx)} className="text-blue-500 hover:bg-blue-50 px-2 py-1 rounded text-xs font-bold">الفاتورة</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* موديالات العميل */}
      <TailwindModal show={showClientModal} onClose={() => setShowClientModal(false)} title="بيانات العميل">
        <div className="space-y-4">
          <input className="w-full border p-3 rounded-xl outline-none focus:ring-2 ring-blue-100" placeholder="اسم العميل" value={clientForm.name} onChange={(e)=>setClientForm({...clientForm, name: e.target.value})} />
          <input className="w-full border p-3 rounded-xl outline-none focus:ring-2 ring-blue-100" placeholder="رقم الهاتف" value={clientForm.phone} onChange={(e)=>setClientForm({...clientForm, phone: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">تاريخ الميلاد (اختياري)</label>
                <input type="date" className="w-full border p-3 rounded-xl outline-none" value={clientForm.dob} onChange={(e)=>setClientForm({...clientForm, dob: e.target.value})} />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-400 block mb-1">العنوان</label>
                <input className="w-full border p-3 rounded-xl outline-none" placeholder="المنطقة/الشارع" value={clientForm.address} onChange={(e)=>setClientForm({...clientForm, address: e.target.value})} />
            </div>
          </div>
          <button onClick={saveClient} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all">حفظ البيانات</button>
        </div>
      </TailwindModal>

      {/* موديول الأوردر */}
      <TailwindModal
        show={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        title="تفاصيل الأوردر"
        footer={
          <div className="flex gap-2 w-full">
            <button onClick={() => {
                html2canvas(invoiceRef.current).then(c => {
                    const link = document.createElement("a");
                    link.download = `Zouma_${orderForm.date}.png`;
                    link.href = c.toDataURL();
                    link.click();
                });
            }} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold flex-1">تحميل صورة 📸</button>
            <button onClick={saveOrder} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex-1">حفظ ✅</button>
          </div>
        }
      >
        <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-4 text-sm font-bold">
                    <span>قائمة الطلبات</span>
                    <button onClick={() => setOrderForm(prev => ({...prev, items: [...prev.items, {name:"", price:""}]}))} className="bg-blue-500 text-white w-6 h-6 rounded-full">+</button>
                </div>
                {orderForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                        <input className="flex-1 border p-2 rounded-lg text-sm" placeholder="اسم الصنف" value={item.name} onChange={(e) => {
                            const newItems = [...orderForm.items];
                            newItems[idx].name = e.target.value;
                            setOrderForm({...orderForm, items: newItems});
                        }} />
                        <input type="number" className="w-20 border p-2 rounded-lg text-sm text-center" placeholder="السعر" value={item.price} onChange={(e) => {
                            const newItems = [...orderForm.items];
                            newItems[idx].price = e.target.value;
                            setOrderForm({...orderForm, items: newItems});
                        }} />
                    </div>
                ))}
                <div className="flex gap-4 mt-4 border-t pt-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-400 block">الخصم %</label>
                        <input type="number" className="w-full border p-1 rounded-lg text-center" value={orderForm.discountPercentage} onChange={(e)=>setOrderForm({...orderForm, discountPercentage: e.target.value})} />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-400 block">التاريخ</label>
                        <input type="date" className="w-full border p-1 rounded-lg text-center" value={orderForm.date} onChange={(e)=>setOrderForm({...orderForm, date: e.target.value})} />
                    </div>
                </div>
            </div>

            <div ref={invoiceRef} className="bg-white p-6 border-2 border-dashed rounded-xl text-center shadow-lg mx-auto" style={{ width: '350px' }}>
                <h2 className="text-2xl font-black mb-1">Z O U M A</h2>
                <div className="text-right text-[10px] space-y-1 mb-4 border-b pb-2">
                    <p><strong>العميل:</strong> {clients.find(c=>c.id === currentClientId)?.name}</p>
                    <p><strong>كود العميل:</strong> #{clients.find(c=>c.id === currentClientId)?.clientCode}</p>
                    <p><strong>التاريخ:</strong> {orderForm.date}</p>
                </div>
                <table className="w-full text-xs text-right mb-4">
                    <thead><tr className="border-b"><th className="py-1">الصنف</th><th className="py-1 text-left">السعر</th></tr></thead>
                    <tbody>
                        {orderForm.items.map((item, i) => (
                            <tr key={i}><td className="py-1">{item.name}</td><td className="py-1 text-left">{item.price} ج</td></tr>
                        ))}
                    </tbody>
                </table>
                <div className="bg-gray-900 text-white p-2 rounded-lg flex justify-between items-center">
                    <span className="font-bold text-lg">
                        {(orderForm.items.reduce((s,i)=> s + (parseFloat(i.price)||0), 0) * (1 - (orderForm.discountPercentage/100))).toFixed(2)} ج
                    </span>
                    <span className="font-bold text-xs">الإجمالي:</span>
                </div>
                <p className="mt-4 text-[8px] text-gray-400 font-bold uppercase tracking-widest italic">Premium Quality Goods</p>
            </div>
        </div>
      </TailwindModal>
    </div>
  );
}

export default ClientsPage;
