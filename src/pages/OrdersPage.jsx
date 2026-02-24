import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import html2canvas from "html2canvas";

// مكون الموديول الأساسي
const TailwindModal = ({ show, onClose, title, children, footer }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 text-right">{children}</div>
        <div className="flex justify-end p-4 border-t border-gray-200 gap-2">
          {footer}
        </div>
      </div>
    </div>
  );
};

// تعريف مراحل الأوردر وألوانها
const ORDER_STATUSES = {
  NEW: { label: "جديد", color: "bg-red-500", text: "text-red-500" },
  PREPARING: { label: "تجهيز", color: "bg-yellow-500", text: "text-yellow-600" },
  READY: { label: "جاهز", color: "bg-blue-500", text: "text-blue-500" },
  DELIVERED: { label: "تم الاستلام", color: "bg-green-600", text: "text-green-600" }
};

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [statusFilter, setStatusFilter] = useState("ALL");
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
    paidAmount: 0,
    total: 0,
    status: "NEW",
    date: new Date().toISOString().split("T")[0],
  });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const clientsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setClients(clientsList);
      return clientsList;
    } catch (err) { 
      console.error("Error:", err);
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const updateStatusQuickly = async (clientId, orderIndex, newStatus) => {
    try {
      const clientRef = doc(db, "clients", clientId);
      const client = clients.find(c => c.id === clientId);
      const updatedOrders = [...client.orders];
      updatedOrders[orderIndex].status = newStatus;
      await updateDoc(clientRef, { orders: updatedOrders });
      fetchClients();
      setSuccessMessage("تم تحديث حالة الأوردر");
      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (err) { alert("خطأ في التحديث"); }
  };

  const deleteClient = async (clientId, clientName) => {
    if (window.confirm(`هل أنت متأكد من حذف العميل "${clientName}"؟`)) {
      try {
        await deleteDoc(doc(db, "clients", clientId));
        fetchClients();
      } catch (err) { alert("خطأ في الحذف"); }
    }
  };

  const deleteOrder = async (clientId, orderIndex) => {
    if (!window.confirm("حذف الفاتورة؟")) return;
    try {
      const clientRef = doc(db, "clients", clientId);
      const client = clients.find((c) => c.id === clientId);
      const updatedOrders = client.orders.filter((_, i) => i !== orderIndex);
      await updateDoc(clientRef, { orders: updatedOrders });
      fetchClients();
    } catch (err) { alert("خطأ"); }
  };

  const openWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}`, '_blank', 'noopener,noreferrer');
  };

  const openOrderModal = useCallback((clientId, order = null, orderIndex = null) => {
    setCurrentClientId(clientId);
    setModalOrder(orderIndex !== null ? { ...order, index: orderIndex } : null);
    if (order) {
      setOrderForm({ 
        ...order, 
        paidAmount: order.paidAmount || 0,
        items: order.items || [{ name: "أوردر", price: order.total }],
        status: order.status || "NEW",
        date: order.date || new Date().toISOString().split("T")[0]
      });
    } else {
      setOrderForm({ items: [{ name: "", price: "" }], discountPercentage: 0, paidAmount: 0, total: 0, status: "NEW", date: new Date().toISOString().split("T")[0] });
    }
    setShowOrderModal(true);
  }, []);

  const saveClient = async () => {
    try {
      if (modalClient) {
        await updateDoc(doc(db, "clients", modalClient.id), { ...clientForm });
      } else {
        const docRef = await addDoc(collection(db, "clients"), { 
            ...clientForm, 
            clientCode: Math.floor(1000 + Math.random() * 9000).toString(), 
            orders: [], 
            createdAt: new Date().toISOString() 
        });
        await fetchClients(); 
        setShowClientModal(false);
        openOrderModal(docRef.id);
        return;
      }
      await fetchClients(); 
      setShowClientModal(false);
    } catch (err) { alert(err.message); }
  };

  const saveOrder = async () => {
    try {
      const clientRef = doc(db, "clients", currentClientId);
      const client = clients.find((c) => c.id === currentClientId);
      const subTotal = orderForm.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
      const finalTotal = (subTotal - (subTotal * (parseFloat(orderForm.discountPercentage) / 100))).toFixed(2);
      const orderData = { ...orderForm, total: finalTotal };

      let updatedOrders = [...client.orders];
      if (modalOrder) {
        updatedOrders[modalOrder.index] = orderData;
      } else {
        updatedOrders.push(orderData);
      }
      await updateDoc(clientRef, { orders: updatedOrders });
      fetchClients(); setShowOrderModal(false);
    } catch (err) { alert(err.message); }
  };

  const processedClients = useMemo(() => {
    let filtered = clients.filter(c => 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone?.includes(searchTerm) || 
      (c.clientCode && c.clientCode.includes(searchTerm))
    );

    if (statusFilter !== "ALL") {
        filtered = filtered.filter(c => c.orders && c.orders.some(o => o.status === statusFilter));
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(now.getMonth() - 3);

    return [...filtered].sort((a, b) => {
      const getSum = (client, limit) => client.orders?.filter(o => !limit || new Date(o.date) >= limit).reduce((s, o) => s + parseFloat(o.total || 0), 0) || 0;
      
      if (sortBy === "thisMonth") return getSum(b, startOfMonth) - getSum(a, startOfMonth);
      if (sortBy === "threeMonths") return getSum(b, threeMonthsAgo) - getSum(a, threeMonthsAgo);
      if (sortBy === "allTime") return getSum(b, null) - getSum(a, null);
      if (sortBy === "recent") {
        const dateA = a.orders?.length > 0 ? new Date(a.orders[a.orders.length - 1].date).getTime() : 0;
        const dateB = b.orders?.length > 0 ? new Date(b.orders[b.orders.length - 1].date).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });
  }, [clients, searchTerm, sortBy, statusFilter]);

  const handleDownloadImage = async () => {
    if (invoiceRef.current) {
        const canvas = await html2canvas(invoiceRef.current);
        const link = document.createElement("a");
        link.download = `Invoice.png`; link.href = canvas.toDataURL(); link.click();
    }
  };

  const handlePrint = () => {
    if (invoiceRef.current) {
      const printContent = invoiceRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>Zouma Invoice - Print</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { font-family: sans-serif; padding: 20px; }
              @media print {
                .no-print { display: none; }
                body { padding: 0; }
              }
            </style>
          </head>
          <body onload="window.print();window.close()">
            <div class="max-w-sm mx-auto border-2 border-dashed p-6 rounded-xl">
              ${printContent}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const subTotalCalc = orderForm.items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
  const finalTotalCalc = (subTotalCalc * (1 - (parseFloat(orderForm.discountPercentage || 0) / 100))).toFixed(2);
  const remainingCalc = (parseFloat(finalTotalCalc) - parseFloat(orderForm.paidAmount || 0)).toFixed(2);

  if (loading) return <div className="text-center py-20 font-bold">جاري تحميل البيانات...</div>;

  return (
    <div className="container mx-auto px-4 py-8 text-right" dir="rtl">
      <h1 className="text-3xl font-bold text-center mb-8 uppercase italic">Z O U M A <span className="text-blue-600 italic">Dashboard</span></h1>

      {/* شريط الفلترة */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        <button onClick={() => setStatusFilter("ALL")} className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${statusFilter === "ALL" ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'}`}>الكل</button>
        {Object.entries(ORDER_STATUSES).map(([key, info]) => (
            <button key={key} onClick={() => setStatusFilter(key)} className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${statusFilter === key ? `${info.color} text-white shadow-lg` : `bg-gray-100 border`}`}>
                {info.label}
            </button>
        ))}
      </div>

      {/* البحث */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <input className="flex-1 border-2 border-gray-100 p-3 rounded-lg outline-none focus:border-blue-400 text-right font-bold" placeholder="ابحث بالاسم أو الهاتف أو الكود..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <div className="flex gap-2">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-50 border-2 border-gray-100 px-4 py-2 rounded-lg font-bold outline-none">
            <option value="recent">🕒 أحدث الأوردرات</option>
            <option value="allTime">🔝 أعلى مبيعات (الكل)</option>
            <option value="thisMonth">📅 مبيعات الشهر</option>
            <option value="threeMonths">🗓️ مبيعات 3 شهور</option>
          </select>
          <button onClick={() => { setModalClient(null); setClientForm({name:"", phone:"", address:"", dob:""}); setShowClientModal(true); }} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow whitespace-nowrap">+ عميل جديد</button>
        </div>
      </div>

      {successMessage && <div className="bg-green-500 text-white p-3 rounded-lg mb-4 text-center font-bold">{successMessage}</div>}

      <div className="grid gap-6">
        {processedClients.map((client) => {
          const totalSpent = client.orders?.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0;
          const totalPaid = client.orders?.reduce((sum, o) => sum + (parseFloat(o.paidAmount) || 0), 0) || 0;
          const totalDebt = (totalSpent - totalPaid).toFixed(2);
          
          const has10Percent = client.orders?.some(o => parseFloat(o.discountPercentage) === 10);
          const has5Percent = client.orders?.some(o => parseFloat(o.discountPercentage) === 5);

          return (
            <div key={client.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50/50 p-4 flex flex-wrap justify-between items-center border-b border-gray-100 gap-3">
                <div className="flex-1 text-right min-w-[250px]">
                  <div className="flex items-center gap-2 mb-1 justify-start">
                    <h2 className="text-xl font-bold text-gray-800">
                        {client.name} 
                        {has10Percent && <span title="ميدالية ذهبية 10%" className="mr-1">🥇</span>}
                        {has5Percent && !has10Percent && <span title="ميدالية فضية 5%" className="mr-1">🥈</span>}
                    </h2>
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-black">#{client.clientCode}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm mt-2 justify-start items-center">
                    <button onClick={() => openWhatsApp(client.phone)} className="text-green-600 font-bold hover:bg-green-50 px-2 py-1 rounded-md border border-green-200">{client.phone} 🟢 WhatsApp</button>
                    <span className="text-gray-500 font-bold">📍 {client.address || "بدون عنوان"}</span>
                    {client.dob && <span className="text-purple-600 font-bold italic">🎂 {client.dob}</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-left border-l pl-4 border-gray-200 font-bold">
                     <p className="text-[10px] text-gray-400 uppercase">المسحوبات</p>
                     <p className="text-sm text-blue-600">{totalSpent.toFixed(2)} ج</p>
                  </div>
                  <div className="text-left border-l pl-4 border-gray-200 font-bold">
                     <p className="text-[10px] text-gray-400 uppercase">المتبقي الكلي</p>
                     <p className={`text-sm ${parseFloat(totalDebt) > 0 ? 'text-red-600' : 'text-gray-400'}`}>{totalDebt} ج</p>
                  </div>
                  <button onClick={() => openOrderModal(client.id)} className="bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm">أوردر جديد</button>
                  <button onClick={() => { setModalClient(client); setClientForm({...client}); setShowClientModal(true); }} className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold">تعديل</button>
                  <button onClick={() => deleteClient(client.id, client.name)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl">🗑️</button>
                </div>
              </div>

              {/* جدول الطلبات */}
              {client.orders && client.orders.length > 0 && (
                <div className="p-4 overflow-x-auto bg-white">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="text-gray-400 text-[10px] uppercase border-b border-gray-50">
                        <th className="pb-2 font-bold">التاريخ</th>
                        <th className="pb-2 font-bold">الأصناف</th>
                        <th className="pb-2 font-bold">الحالة</th>
                        <th className="pb-2 font-bold text-center">تغيير سريع</th>
                        <th className="pb-2 font-bold text-center">الإجمالي</th>
                        <th className="pb-2 font-bold text-center">المدفوع</th>
                        <th className="pb-2 font-bold text-center">المتبقي</th>
                        <th className="pb-2 font-bold text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {client.orders.slice().reverse().map((o, idx) => {
                        const originalIndex = client.orders.length - 1 - idx;
                        const statusInfo = ORDER_STATUSES[o.status || "NEW"];
                        const currentOrderTotal = parseFloat(o.total || 0);
                        const currentOrderPaid = parseFloat(o.paidAmount || 0);
                        const currentOrderRemaining = (currentOrderTotal - currentOrderPaid).toFixed(2);

                        return (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 text-xs text-gray-500">{o.date}</td>
                            <td className="py-3 text-[10px] text-gray-600 font-medium max-w-[150px] truncate">
                                {o.items && o.items.length > 0 
                                  ? o.items.map(i => i.name).filter(Boolean).join(" - ") 
                                  : "أوردر"}
                            </td>
                            <td className={`py-3 text-[10px] font-bold ${statusInfo.text}`}>{statusInfo.label}</td>
                            <td className="py-3">
                                <div className="flex justify-center gap-1">
                                    {Object.entries(ORDER_STATUSES).map(([key, info]) => (
                                        <button key={key} onClick={() => updateStatusQuickly(client.id, originalIndex, key)} className={`px-2 py-1 rounded text-[8px] font-bold transition-all ${o.status === key ? `${info.color} text-white scale-110 shadow-md` : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}>{info.label}</button>
                                    ))}
                                </div>
                            </td>
                            <td className="py-3 text-center font-bold text-gray-800">{o.total} ج</td>
                            <td className="py-3 text-center font-bold text-green-600">{o.paidAmount || 0} ج</td>
                            <td className={`py-3 text-center font-bold ${parseFloat(currentOrderRemaining) > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                {currentOrderRemaining} ج
                            </td>
                            <td className="py-3 text-center flex justify-center gap-3">
                              <button onClick={() => openOrderModal(client.id, o, originalIndex)} className="text-blue-500 hover:bg-blue-50 px-2 py-1 rounded text-xs font-bold">تعديل</button>
                              <button onClick={() => deleteOrder(client.id, originalIndex)} className="text-red-400 text-xs">حذف</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* مودالات الإضافة والتعديل (نفسها كما كانت) */}
      <TailwindModal show={showClientModal} onClose={() => setShowClientModal(false)} title="بيانات العميل">
        <div className="space-y-4">
          <input className="w-full border p-3 rounded-xl outline-none" placeholder="اسم العميل" value={clientForm.name} onChange={(e)=>setClientForm({...clientForm, name: e.target.value})} />
          <input className="w-full border p-3 rounded-xl outline-none" placeholder="رقم الهاتف" value={clientForm.phone} onChange={(e)=>setClientForm({...clientForm, phone: e.target.value})} />
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 pr-2 uppercase">تاريخ الميلاد</label>
            <input type="date" className="w-full border p-3 rounded-xl outline-none" value={clientForm.dob} onChange={(e)=>setClientForm({...clientForm, dob: e.target.value})} />
          </div>
          <input className="w-full border p-3 rounded-xl outline-none" placeholder="العنوان" value={clientForm.address} onChange={(e)=>setClientForm({...clientForm, address: e.target.value})} />
          <button onClick={saveClient} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg">حفظ بيانات العميل</button>
        </div>
      </TailwindModal>

      <TailwindModal show={showOrderModal} onClose={() => setShowOrderModal(false)} title="تفاصيل الأوردر" footer={
        <div className="flex gap-2 w-full font-bold">
            <button onClick={handlePrint} className="bg-green-600 text-white px-4 py-2 rounded-lg flex-1 hover:bg-green-700 transition-all">طباعة الفاتورة 🖨️</button>
            <button onClick={handleDownloadImage} className="bg-gray-800 text-white px-4 py-2 rounded-lg flex-1 hover:bg-black transition-all">تحميل صورة 📸</button>
            <button onClick={saveOrder} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex-1 hover:bg-blue-700 transition-all">حفظ الأوردر ✅</button>
        </div>
      }>
        <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-center shadow-inner">
                <label className="text-xs font-bold text-blue-800 mb-2 block uppercase tracking-widest">حالة الأوردر</label>
                <div className="grid grid-cols-4 gap-2">
                    {Object.entries(ORDER_STATUSES).map(([key, info]) => (
                        <button key={key} onClick={() => setOrderForm({...orderForm, status: key})} className={`p-2 rounded-lg text-[10px] font-bold transition-all border-2 ${orderForm.status === key ? 'bg-white border-blue-600 text-blue-600 shadow-sm' : 'bg-gray-100 border-transparent text-gray-500'}`}>{info.label}</button>
                    ))}
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setOrderForm(prev => ({...prev, items: [...prev.items, {name:"", price:""}]}))} className="bg-blue-500 text-white w-8 h-8 rounded-full font-bold">+</button>
                    <span className="font-bold text-gray-700 underline">قائمة الطلبات</span>
                </div>
                {orderForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                        <input className="flex-1 border p-2 rounded-lg text-sm text-right outline-none" placeholder="اسم الصنف" value={item.name} onChange={(e) => {
                            const newItems = [...orderForm.items]; newItems[idx].name = e.target.value; setOrderForm({...orderForm, items: newItems});
                        }} />
                        <input type="number" className="w-20 border p-2 rounded-lg text-sm text-center outline-none" placeholder="السعر" value={item.price} onChange={(e) => {
                            const newItems = [...orderForm.items]; newItems[idx].price = e.target.value; setOrderForm({...orderForm, items: newItems});
                        }} />
                        {orderForm.items.length > 1 && (
                            <button onClick={() => setOrderForm(p => ({...p, items: p.items.filter((_, i) => i !== idx)}))} className="text-red-400 text-xs px-1">حذف</button>
                        )}
                    </div>
                ))}
                
                <div className="mt-4 flex flex-wrap gap-4 border-t pt-4">
                    <button onClick={() => setOrderForm({...orderForm, discountPercentage: 5})} className={`flex-1 p-2 rounded-lg font-bold text-[10px] border-2 transition-all ${Number(orderForm.discountPercentage) === 5 ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-gray-200'}`}>🥈 ميدالية 5%</button>
                    <button onClick={() => setOrderForm({...orderForm, discountPercentage: 10})} className={`flex-1 p-2 rounded-lg font-bold text-[10px] border-2 transition-all ${Number(orderForm.discountPercentage) === 10 ? 'border-yellow-500 bg-yellow-50 text-yellow-600' : 'border-gray-200'}`}>🥇 ميدالية 10%</button>
                    <div className="w-full flex gap-2 mt-2">
                         <div className="flex-1">
                             <label className="text-[10px] font-bold text-gray-400 block text-right pr-2">خصم %</label>
                             <input type="number" className="w-full border p-2 rounded-lg text-center font-bold outline-none" value={orderForm.discountPercentage} onChange={(e)=>setOrderForm({...orderForm, discountPercentage: e.target.value})} />
                         </div>
                         <div className="flex-1">
                             <label className="text-[10px] font-bold text-green-600 block text-right pr-2 font-black tracking-tighter">تم دفع</label>
                             <input type="number" className="w-full border p-2 rounded-lg text-center font-bold text-green-600 border-green-100 bg-green-50 outline-none" value={orderForm.paidAmount} onChange={(e)=>setOrderForm({...orderForm, paidAmount: e.target.value})} />
                         </div>
                    </div>
                </div>
            </div>

            {/* معاينة الفاتورة */}
            <div ref={invoiceRef} className="bg-white p-6 border-2 border-dashed border-gray-200 rounded-xl text-center shadow-lg mx-auto" style={{ width: '350px' }}>
                <h2 className="text-2xl font-black mb-1 text-gray-800 uppercase italic tracking-tighter">Z O U M A</h2>
                <div className={`text-[10px] inline-block px-3 py-1 rounded-full text-white font-bold mb-4 shadow-sm ${ORDER_STATUSES[orderForm.status || "NEW"].color}`}>{ORDER_STATUSES[orderForm.status || "NEW"].label}</div>
                <div className="text-right text-[10px] space-y-1 mb-4 border-b pb-2 font-bold">
                    <p>العميل: {clients.find(c=>c.id === currentClientId)?.name}</p>
                    <p>الكود: #{clients.find(c=>c.id === currentClientId)?.clientCode}</p>
                    <p>التاريخ: {orderForm.date}</p>
                </div>
                <table className="w-full text-[11px] text-right mb-4 font-bold border-collapse">
                    <tbody className="divide-y divide-gray-100">{orderForm.items.map((item, i) => (<tr key={i}><td className="py-1">{item.name || "-"}</td><td className="py-1 text-left font-sans">{item.price || 0} ج</td></tr>))}</tbody>
                </table>
                <div className="border-t pt-2 space-y-1 text-xs font-bold text-right">
                    <div className="flex justify-between text-gray-500"><span>الإجمالي:</span><span>{subTotalCalc} ج</span></div>
                    {parseFloat(orderForm.discountPercentage) > 0 && <div className="flex justify-between text-red-500 italic"><span>الخصم ({orderForm.discountPercentage}%):</span><span>-{(subTotalCalc * parseFloat(orderForm.discountPercentage) / 100).toFixed(2)} ج</span></div>}
                    <div className="flex justify-between bg-gray-900 text-white p-2 rounded-lg mt-2 text-sm shadow-md"><span>الصافي النهائي:</span><span>{finalTotalCalc} ج</span></div>
                    <div className="flex justify-between text-green-600 px-1 pt-1 underline decoration-dotted"><span>تم دفع:</span><span>{orderForm.paidAmount} ج</span></div>
                    <div className="flex justify-between text-orange-600 px-1 font-black text-[13px] border-t border-gray-100 pt-1"><span>المتبقي:</span><span>{remainingCalc} ج</span></div>
                </div>
            </div>
        </div>
      </TailwindModal>
    </div>
  );
}

export default ClientsPage;
