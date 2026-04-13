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
  increment 
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import html2canvas from "html2canvas";

// ----------------- المودال المحدث للدارك مود -----------------
const TailwindModal = ({ show, onClose, title, children, footer }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2050] p-4 transition-all duration-300" dir="rtl">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-transparent dark:border-gray-700 transition-colors duration-300">
        <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-black text-gray-800 dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-2xl font-bold bg-gray-100 dark:bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center pb-1 transition-colors">&times;</button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 text-right custom-scrollbar">{children}</div>
        {footer && (
          <div className="flex justify-end p-5 border-t border-gray-100 dark:border-gray-800 gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const ORDER_STATUSES = {
  NEW: { label: "جديد", color: "bg-red-500 dark:bg-red-600", text: "text-red-500 dark:text-red-400" },
  PREPARING: { label: "تجهيز", color: "bg-yellow-500 dark:bg-yellow-600", text: "text-yellow-600 dark:text-yellow-500" },
  READY: { label: "جاهز", color: "bg-blue-500 dark:bg-blue-600", text: "text-blue-500 dark:text-blue-400" },
  DELIVERED: { label: "تم الاستلام", color: "bg-green-600 dark:bg-green-600", text: "text-green-600 dark:text-green-400" }
};

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showClientModal, setShowClientModal] = useState(false);
  const [modalClient, setModalClient] = useState(null);
  const [clientForm, setClientForm] = useState({ name: "", phone: "", phone2: "", address: "", dob: "" });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [modalOrder, setModalOrder] = useState(null);
  const [currentClientId, setCurrentClientId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(null);
  
  const invoiceRef = useRef(null);

  const [orderForm, setOrderForm] = useState({
    items: [{ productId: "", name: "", price: "", qty: 1, searchQuery: "", showDropdown: false }],
    discountPercentage: 0,
    paidAmount: 0,
    total: 0,
    status: "NEW",
    date: new Date().toISOString().split("T")[0],
    notes: "",
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

  const fetchProductsForOrder = async () => {
    try {
      const q = query(collection(db, "products"));
      const snapshot = await getDocs(q);
      setAvailableProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  useEffect(() => { 
    fetchClients(); 
    fetchProductsForOrder(); 
  }, [fetchClients]);

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
    if (!window.confirm("حذف الفاتورة؟ (سيتم إرجاع البضاعة للمخزون تلقائياً إذا لم يتم تسليمها)")) return;
    try {
      const clientRef = doc(db, "clients", clientId);
      const client = clients.find((c) => c.id === clientId);
      const orderToDelete = client.orders[orderIndex];

      if (orderToDelete.status !== "DELIVERED") {
        for (const item of orderToDelete.items) {
          if (item.productId && item.qty) {
             const productRef = doc(db, "products", item.productId);
             await updateDoc(productRef, {
               stock: increment(item.qty)
             });
          }
        }
      }

      const updatedOrders = client.orders.filter((_, i) => i !== orderIndex);
      await updateDoc(clientRef, { orders: updatedOrders });
      fetchClients();
      fetchProductsForOrder();
    } catch (err) { alert("خطأ في حذف الفاتورة"); }
  };

  const openWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
    window.open(`https://wa.me/${formattedPhone}`, '_blank', 'noopener,noreferrer');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const openOrderModal = useCallback((clientId, order = null, orderIndex = null) => {
    setCurrentClientId(clientId);
    setModalOrder(orderIndex !== null ? { ...order, index: orderIndex } : null);
    if (order) {
      const formattedItems = (order.items || [{ productId: "", name: "أوردر", price: order.total, qty: 1 }]).map(item => ({
        ...item, searchQuery: item.name || "", showDropdown: false
      }));
      setOrderForm({ 
        ...order, 
        paidAmount: order.paidAmount || 0,
        items: formattedItems,
        status: order.status || "NEW",
        date: order.date || new Date().toISOString().split("T")[0],
        notes: order.notes || ""
      });
    } else {
      setOrderForm({ items: [{ productId: "", name: "", price: "", qty: 1, searchQuery: "", showDropdown: false }], discountPercentage: 0, paidAmount: 0, total: 0, status: "NEW", date: new Date().toISOString().split("T")[0], notes: "" });
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
      
      const cleanItems = orderForm.items.map(i => {
        const { searchQuery, showDropdown, ...rest } = i;
        return rest;
      });

      const orderData = { ...orderForm, items: cleanItems, total: finalTotal };

      let updatedOrders = [...client.orders];
      
      if (!modalOrder) {
        for (const item of cleanItems) {
          if (item.productId && item.qty) {
             const productRef = doc(db, "products", item.productId);
             await updateDoc(productRef, {
               stock: increment(-item.qty) 
             });
          }
        }
        updatedOrders.push(orderData);
      } else {
        updatedOrders[modalOrder.index] = orderData;
      }

      await updateDoc(clientRef, { orders: updatedOrders });
      fetchClients(); 
      fetchProductsForOrder(); 
      setShowOrderModal(false);
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
        link.download = `Invoice_Zouma_${currentClientId}.png`; link.href = canvas.toDataURL(); link.click();
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
              body { font-family: sans-serif; padding: 20px; background: white; color: black; }
              @media print {
                .no-print { display: none; }
                body { padding: 0; }
              }
            </style>
          </head>
          <body onload="window.print();window.close()">
            <div class="max-w-sm mx-auto border-2 border-dashed border-gray-400 p-6 rounded-xl">
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

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-100px)] transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-blue-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-bold animate-pulse text-blue-600 dark:text-blue-400">جارٍ جلب البيانات...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 min-h-screen transition-colors duration-300 bg-gray-50/50 dark:bg-gray-900 text-right" dir="rtl">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight uppercase italic">Z O U M A <span className="text-blue-600 dark:text-blue-500 italic">Dashboard</span></h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1">إدارة الأوردرات والفواتير</p>
          </div>
      </div>

      {/* ----------------- فلاتر حالة الأوردر ----------------- */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <button onClick={() => setStatusFilter("ALL")} className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${statusFilter === "ALL" ? 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>الكل</button>
        {Object.entries(ORDER_STATUSES).map(([key, info]) => (
            <button key={key} onClick={() => setStatusFilter(key)} className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${statusFilter === key ? `${info.color} text-white shadow-md` : `bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600`}`}>
                {info.label}
            </button>
        ))}
      </div>

      {/* ----------------- البحث والترتيب ----------------- */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <input className="flex-1 border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3.5 rounded-xl outline-none focus:border-blue-500 dark:focus:border-blue-500 text-right font-bold text-gray-800 dark:text-white placeholder-gray-400 transition-colors" placeholder="ابحث باسم العميل، الهاتف أو الكود..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 text-gray-800 dark:text-white px-4 py-3 rounded-xl font-bold outline-none focus:border-blue-500 transition-colors cursor-pointer">
            <option value="recent">🕒 أحدث الأوردرات</option>
            <option value="allTime">🔝 أعلى مبيعات (الكل)</option>
            <option value="thisMonth">📅 مبيعات الشهر</option>
            <option value="threeMonths">🗓️ مبيعات 3 شهور</option>
          </select>
          <button onClick={() => { setModalClient(null); setClientForm({name:"", phone:"", phone2:"", address:"", dob:""}); setShowClientModal(true); }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-green-500/30 whitespace-nowrap transition-all">+ عميل جديد</button>
        </div>
      </div>

      {successMessage && <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-3 rounded-xl mb-6 text-center font-bold animate-pulse">{successMessage}</div>}

      {/* ----------------- كروت العملاء والأوردرات ----------------- */}
      <div className="grid gap-6">
        {processedClients.length === 0 ? (
           <div className="text-center text-gray-400 dark:text-gray-500 mt-10 font-bold bg-white dark:bg-gray-800 p-8 rounded-2xl border border-dashed dark:border-gray-700">لا توجد بيانات مطابقة للبحث</div>
        ) : (
        processedClients.map((client) => {
          const totalSpent = client.orders?.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0) || 0;
          const totalPaid = client.orders?.reduce((sum, o) => sum + (parseFloat(o.paidAmount) || 0), 0) || 0;
          const totalDebt = (totalSpent - totalPaid).toFixed(2);
          
          const has10Percent = client.orders?.some(o => parseFloat(o.discountPercentage) === 10);
          const has5Percent = client.orders?.some(o => parseFloat(o.discountPercentage) === 5);

          return (
            <div key={client.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
              {/* هيدر الكارت */}
              <div className="bg-gray-50/50 dark:bg-gray-800/50 p-5 flex flex-wrap justify-between items-center border-b border-gray-100 dark:border-gray-700 gap-4">
                <div className="flex-1 text-right min-w-[250px]">
                  <div className="flex items-center gap-2 mb-2 justify-start">
                    <h2 className="text-xl font-black text-gray-800 dark:text-white">
                        {client.name} 
                        {has10Percent && <span title="ميدالية ذهبية 10%" className="mr-2 text-xl">🥇</span>}
                        {has5Percent && !has10Percent && <span title="ميدالية فضية 5%" className="mr-2 text-xl">🥈</span>}
                    </h2>
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 rounded-md text-[10px] font-black border border-blue-200 dark:border-blue-800/50">#{client.clientCode}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm mt-2 justify-start items-center">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openWhatsApp(client.phone)} className="text-green-600 dark:text-green-400 font-bold hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800/50 transition-colors flex items-center gap-1.5"><span className="text-lg">🟢</span> {client.phone}</button>
                      <button onClick={() => copyToClipboard(client.phone)} className={`text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1.5 rounded-lg transition-colors ${copiedPhone === client.phone ? 'text-green-600 dark:text-green-400' : ''}`} title="نسخ رقم الهاتف">
                        {copiedPhone === client.phone ? '✓' : '📋'}
                      </button>
                    </div>
                    {client.phone2 && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openWhatsApp(client.phone2)} className="text-green-600 dark:text-green-400 font-bold hover:bg-green-50 dark:hover:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800/50 transition-colors flex items-center gap-1.5"><span className="text-lg">🟢</span> {client.phone2}</button>
                        <button onClick={() => copyToClipboard(client.phone2)} className={`text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1.5 rounded-lg transition-colors ${copiedPhone === client.phone2 ? 'text-green-600 dark:text-green-400' : ''}`} title="نسخ رقم الهاتف">
                          {copiedPhone === client.phone2 ? '✓' : '📋'}
                        </button>
                      </div>
                    )}
                    <span className="text-gray-500 dark:text-gray-400 font-bold bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">📍 {client.address || "بدون عنوان"}</span>
                    {client.dob && <span className="text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg border border-purple-100 dark:border-purple-800/50">🎂 {client.dob}</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-left border-l pl-4 border-gray-200 dark:border-gray-700 font-bold">
                     <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">المسحوبات</p>
                     <p className="text-base font-black text-blue-600 dark:text-blue-400">{totalSpent.toLocaleString()} ج</p>
                  </div>
                  <div className="text-left border-l pl-4 border-gray-200 dark:border-gray-700 font-bold">
                     <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest">المتبقي الكلي</p>
                     <p className={`text-base font-black ${parseFloat(totalDebt) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>{Number(totalDebt).toLocaleString()} ج</p>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => openOrderModal(client.id)} className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-purple-500/30 transition-all">أوردر جديد</button>
                      <button onClick={() => { setModalClient(client); setClientForm({...client}); setShowClientModal(true); }} className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold transition-all">تعديل</button>
                      <button onClick={() => deleteClient(client.id, client.name)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2.5 rounded-xl transition-all text-lg">🗑️</button>
                  </div>
                </div>
              </div>

              {/* جدول أوردرات العميل */}
              {client.orders && client.orders.length > 0 && (
                <div className="p-0 overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr className="text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                        <th className="px-5 py-3 font-bold">التاريخ</th>
                        <th className="px-5 py-3 font-bold">الأصناف</th>
                        <th className="px-5 py-3 font-bold">الحالة</th>
                        <th className="px-5 py-3 font-bold text-center">تغيير سريع</th>
                        <th className="px-5 py-3 font-bold text-center">الإجمالي</th>
                        <th className="px-5 py-3 font-bold text-center">المدفوع</th>
                        <th className="px-5 py-3 font-bold text-center">المتبقي</th>
                        <th className="px-5 py-3 font-bold text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800 text-sm">
                      {client.orders.slice().reverse().map((o, idx) => {
                        const originalIndex = client.orders.length - 1 - idx;
                        const statusInfo = ORDER_STATUSES[o.status || "NEW"];
                        const currentOrderTotal = parseFloat(o.total || 0);
                        const currentOrderPaid = parseFloat(o.paidAmount || 0);
                        const currentOrderRemaining = (currentOrderTotal - currentOrderPaid).toFixed(2);

                        return (
                          <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400 font-sans tracking-wide">{o.date}</td>
                            <td className="px-5 py-4 text-xs text-gray-700 dark:text-gray-300 font-bold max-w-[200px] truncate">
                                {o.items && o.items.length > 0 
                                  ? o.items.map(i => `${i.name} (x${i.qty || 1})`).filter(Boolean).join(" + ") 
                                  : "أوردر"}
                            </td>
                            <td className={`px-5 py-4 text-[11px] font-black ${statusInfo.text}`}>{statusInfo.label}</td>
                            <td className="px-5 py-4">
                                <div className="flex justify-center gap-1.5 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg w-fit mx-auto border dark:border-gray-700">
                                    {Object.entries(ORDER_STATUSES).map(([key, info]) => (
                                        <button key={key} onClick={() => updateStatusQuickly(client.id, originalIndex, key)} className={`px-2.5 py-1 rounded-md text-[9px] font-black transition-all ${o.status === key ? `${info.color} text-white shadow-sm scale-105` : 'text-gray-400 dark:text-gray-500 hover:bg-white dark:hover:bg-gray-800'}`}>{info.label}</button>
                                    ))}
                                </div>
                            </td>
                            <td className="px-5 py-4 text-center font-black text-gray-800 dark:text-gray-200">{Number(o.total).toLocaleString()} ج</td>
                            <td className="px-5 py-4 text-center font-black text-green-600 dark:text-green-400">{Number(o.paidAmount || 0).toLocaleString()} ج</td>
                            <td className={`px-5 py-4 text-center font-black ${parseFloat(currentOrderRemaining) > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                {Number(currentOrderRemaining).toLocaleString()} ج
                            </td>
                            <td className="px-5 py-4 text-center flex justify-center gap-2">
                              <button onClick={() => openOrderModal(client.id, o, originalIndex)} className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">تعديل / عرض</button>
                              <button onClick={() => deleteOrder(client.id, originalIndex)} className="text-red-400 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors">حذف</button>
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
        })
       )}
      </div>

      {/* ----------------- مودال العميل ----------------- */}
      <TailwindModal show={showClientModal} onClose={() => setShowClientModal(false)} title="بيانات العميل">
        <div className="space-y-4">
          <input className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl outline-none focus:border-blue-500 text-gray-800 dark:text-white font-bold transition-colors" placeholder="اسم العميل" value={clientForm.name} onChange={(e)=>setClientForm({...clientForm, name: e.target.value})} />
          <div>
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 pr-2 block mb-2">رقم الهاتف الأساسي</label>
            <input className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl outline-none focus:border-blue-500 text-gray-800 dark:text-white font-bold transition-colors" placeholder="رقم الهاتف الأساسي" value={clientForm.phone} onChange={(e)=>setClientForm({...clientForm, phone: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 pr-2 block mb-2">رقم هاتف ثاني (اختياري)</label>
            <input className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl outline-none focus:border-blue-500 text-gray-800 dark:text-white font-bold transition-colors" placeholder="رقم هاتف ثاني" value={clientForm.phone2 || ""} onChange={(e)=>setClientForm({...clientForm, phone2: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 pr-2 uppercase">تاريخ الميلاد</label>
            <input type="date" className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl outline-none focus:border-blue-500 text-gray-800 dark:text-white font-bold transition-colors" value={clientForm.dob} onChange={(e)=>setClientForm({...clientForm, dob: e.target.value})} />
          </div>
          <input className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3.5 rounded-xl outline-none focus:border-blue-500 text-gray-800 dark:text-white font-bold transition-colors" placeholder="العنوان" value={clientForm.address} onChange={(e)=>setClientForm({...clientForm, address: e.target.value})} />
          <button onClick={saveClient} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all mt-2">حفظ بيانات العميل</button>
        </div>
      </TailwindModal>

      {/* ----------------- مودال الأوردر (الفاتورة) ----------------- */}
      <TailwindModal show={showOrderModal} onClose={() => setShowOrderModal(false)} title="إنشاء / تعديل أوردر" footer={
        <div className="flex gap-3 w-full font-bold">
            <button onClick={handlePrint} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl flex-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all text-sm">طباعة 🖨️</button>
            <button onClick={handleDownloadImage} className="bg-gray-800 dark:bg-gray-600 text-white px-4 py-3 rounded-xl flex-1 hover:bg-black dark:hover:bg-gray-500 transition-all text-sm">تحميل 📸</button>
            <button onClick={saveOrder} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl flex-[2] shadow-md transition-all text-sm">حفظ الفاتورة ✅</button>
        </div>
      }>
        <div className="space-y-6">
            
            {/* حالة الأوردر */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-3 block uppercase tracking-widest">تحديد حالة الأوردر الحالية</label>
                <div className="grid grid-cols-4 gap-2">
                    {Object.entries(ORDER_STATUSES).map(([key, info]) => (
                        <button key={key} onClick={() => setOrderForm({...orderForm, status: key})} className={`p-2.5 rounded-xl text-[11px] font-black transition-all border-2 ${orderForm.status === key ? `${info.color} text-white border-transparent shadow-md scale-105` : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:bg-gray-600'}`}>{info.label}</button>
                    ))}
                </div>
            </div>

            {/* قائمة الأصناف */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-center mb-5 border-b dark:border-gray-700 pb-3">
                    <button onClick={() => setOrderForm(prev => ({...prev, items: [...prev.items, {productId: "", name:"", price:"", qty: 1, searchQuery:"", showDropdown: false}]}))} className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 px-4 py-1.5 rounded-lg text-sm font-black transition-colors">+ صنف آخر</button>
                    <span className="font-black text-gray-800 dark:text-white">تفاصيل المشتريات</span>
                </div>
                
                {orderForm.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-3 items-start relative bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                        
                        <div className="flex-[3] relative">
                        <input 
                            type="text"
                            className="w-full border-2 border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-right outline-none bg-white dark:bg-gray-800 font-bold text-gray-800 dark:text-gray-100 focus:border-blue-500 transition-colors"
                            placeholder="ابحث عن الصنف بالاسم..."
                            value={item.searchQuery !== undefined ? item.searchQuery : item.name}
                            onChange={(e) => {
                                const val = e.target.value;
                                const newItems = [...orderForm.items];
                                
                                newItems[idx].searchQuery = val;
                                newItems[idx].name = val; 
                                newItems[idx].showDropdown = true; 

                                const exactMatch = availableProducts.find(
                                    p => p.name.trim().toLowerCase() === val.trim().toLowerCase()
                                );

                                if (exactMatch && exactMatch.stock > 0) {
                                    newItems[idx].productId = exactMatch.id; 
                                    newItems[idx].unitPrice = exactMatch.sellingPrice;
                                    newItems[idx].price = exactMatch.sellingPrice * (newItems[idx].qty || 1);
                                } else {
                                    newItems[idx].productId = ""; 
                                }

                                setOrderForm({...orderForm, items: newItems});
                            }}
                            onBlur={() => {
                                setTimeout(() => {
                                    const newItems = [...orderForm.items];
                                    if (newItems[idx]) {
                                        newItems[idx].showDropdown = false;
                                        setOrderForm({...orderForm, items: newItems});
                                    }
                                }, 200);
                            }}
                            onFocus={() => {
                                const newItems = [...orderForm.items];
                                newItems[idx].showDropdown = true;
                                setOrderForm({...orderForm, items: newItems});
                            }}
                        />

                            {/* قائمة نتائج البحث (Dropdown) */}
                            {item.showDropdown && (
                                <ul className="absolute z-50 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-xl w-full max-h-48 overflow-y-auto rounded-xl mt-1 text-right custom-scrollbar">
                                    {availableProducts
                                        .filter(p => p.name.toLowerCase().includes((item.searchQuery || "").toLowerCase()))
                                        .map(p => (
                                            <li 
                                                key={p.id} 
                                                className={`p-3 border-b dark:border-gray-700 cursor-pointer transition-colors text-sm font-bold flex justify-between items-center
                                                    ${p.stock <= 0 
                                                        ? 'bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-500 cursor-not-allowed' 
                                                        : 'hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-800 dark:text-gray-200'}`}
                                                onMouseDown={() => { 
                                                    if (p.stock > 0) {
                                                        const newItems = [...orderForm.items];
                                                        newItems[idx] = { 
                                                            ...newItems[idx], 
                                                            productId: p.id, 
                                                            name: p.name, 
                                                            unitPrice: p.sellingPrice,
                                                            searchQuery: p.name, 
                                                            qty: newItems[idx].qty || 1,
                                                            price: p.sellingPrice * (newItems[idx].qty || 1),
                                                            showDropdown: false 
                                                        };
                                                        setOrderForm({...orderForm, items: newItems});
                                                    }
                                                }}
                                            >
                                                <span>{p.name}</span> 
                                                <div className="flex gap-2 items-center">
                                                    <span className="text-gray-400 dark:text-gray-500 text-[10px] bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded">متاح: {p.stock}</span>
                                                    <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">{p.sellingPrice}ج</span>
                                                </div>
                                            </li>
                                        ))
                                    }
                                    {availableProducts.filter(p => p.name.toLowerCase().includes((item.searchQuery || "").toLowerCase())).length === 0 && (
                                        <li className="p-4 text-center text-gray-400 dark:text-gray-500 text-xs font-bold bg-gray-50 dark:bg-gray-900/50">لا يوجد صنف مسجل بهذا الاسم</li>
                                    )}
                                </ul>
                            )}
                        </div>

                        <div className="flex-1">
                            <input type="number" min="1" className="w-full border-2 border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-center outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:border-blue-500 font-bold" placeholder="الكمية" 
                                value={item.qty || 1} 
                                onChange={(e) => {
                                    const newQty = parseInt(e.target.value) || 1;
                                    const newItems = [...orderForm.items]; 
                                    newItems[idx].qty = newQty;
                                    if(newItems[idx].unitPrice) {
                                        newItems[idx].price = newItems[idx].unitPrice * newQty;
                                    }
                                    setOrderForm({...orderForm, items: newItems});
                                }} 
                            />
                        </div>

                        <div className="flex-1">
                            <input type="number" className="w-full border-2 border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-center outline-none bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-black focus:border-blue-500" placeholder="السعر" 
                                value={item.price} 
                                onChange={(e) => {
                                    const newItems = [...orderForm.items]; 
                                    newItems[idx].price = e.target.value; 
                                    setOrderForm({...orderForm, items: newItems});
                                }} 
                            />
                        </div>

                        {orderForm.items.length > 1 && (
                            <button onClick={() => setOrderForm(p => ({...p, items: p.items.filter((_, i) => i !== idx)}))} className="text-red-400 hover:text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-2 py-2.5 rounded-lg text-xs font-bold transition-colors">🗑️</button>
                        )}
                    </div>
                ))}
                
                {/* الحسابات والخصومات */}
                <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 dark:border-gray-700 pt-5">
                    <button onClick={() => setOrderForm({...orderForm, discountPercentage: 5})} className={`flex-1 p-2.5 rounded-xl font-black text-xs border-2 transition-all ${Number(orderForm.discountPercentage) === 5 ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>🥈 ميدالية 5% خصم</button>
                    <button onClick={() => setOrderForm({...orderForm, discountPercentage: 10})} className={`flex-1 p-2.5 rounded-xl font-black text-xs border-2 transition-all ${Number(orderForm.discountPercentage) === 10 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>🥇 ميدالية 10% خصم</button>
                    
                    <div className="w-full flex gap-3 mt-1">
                         <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                             <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 block text-right pr-1 mb-1">نسبة الخصم اليدوي %</label>
                             <input type="number" className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 rounded-lg text-center font-bold outline-none focus:border-blue-500 text-gray-800 dark:text-white" value={orderForm.discountPercentage} onChange={(e)=>setOrderForm({...orderForm, discountPercentage: e.target.value})} />
                         </div>
                         <div className="flex-1 bg-green-50 dark:bg-green-900/10 p-2 rounded-xl border border-green-100 dark:border-green-900/30">
                             <label className="text-[10px] font-bold text-green-600 dark:text-green-500 block text-right pr-1 mb-1">المدفوع من العميل (كاش)</label>
                             <input type="number" className="w-full border-2 border-green-200 border-green-800/50 bg-white dark:bg-gray-800 p-2 rounded-lg text-center font-black text-green-600 dark:text-green-400 outline-none focus:border-green-500" value={orderForm.paidAmount} onChange={(e)=>setOrderForm({...orderForm, paidAmount: e.target.value})} />
                         </div>
                    </div>
                </div>
            </div>

            {/* خانة الملحوظات */}
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/50">
              <label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block text-right pr-1 mb-2">📝 ملحوظات العميل (اختياري)</label>
              <textarea 
                className="w-full border-2 border-blue-200 dark:border-blue-800/50 bg-white dark:bg-gray-800 p-3 rounded-lg text-right font-medium text-gray-800 dark:text-gray-200 outline-none focus:border-blue-400 transition-colors resize-none" 
                rows="3"
                placeholder="أكتب أي ملحوظات أو طلبات خاصة للعميل..."
                value={orderForm.notes || ""}
                onChange={(e) => setOrderForm({...orderForm, notes: e.target.value})}
              />
            </div>

            {/* معاينة الفاتورة */}
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-2xl flex justify-center">
              <div ref={invoiceRef} className="bg-white p-6 border-2 border-dashed border-gray-300 rounded-xl text-center shadow-md text-black" style={{ width: '350px' }}>
                  <h2 className="text-2xl font-black mb-1 text-gray-800 uppercase italic tracking-tighter">Z O U M A</h2>
                  <div className={`text-[10px] inline-block px-3 py-1 rounded-full text-white font-bold mb-4 shadow-sm ${ORDER_STATUSES[orderForm.status || "NEW"].color.split(' ')[0]}`}>{ORDER_STATUSES[orderForm.status || "NEW"].label}</div>
                  
                  <div className="text-right text-[11px] space-y-1 mb-4 border-b border-gray-200 pb-3 font-bold text-gray-700">
                      <p>العميل: <span className="text-black font-black">{clients.find(c=>c.id === currentClientId)?.name}</span></p>
                      <p>الكود: #{clients.find(c=>c.id === currentClientId)?.clientCode}</p>
                      <p>التاريخ: {orderForm.date}</p>
                  </div>
                  
                  <table className="w-full text-[12px] text-right mb-4 font-bold border-collapse text-gray-800">
                      <tbody className="divide-y divide-gray-100">
                          {orderForm.items.map((item, i) => (
                              <tr key={i}>
                                  <td className="py-2 leading-tight">{item.name || "-"} <span className="text-gray-400 text-[10px]">{item.qty > 1 ? `(x${item.qty})` : ''}</span></td>
                                  <td className="py-2 text-left font-black">{item.price || 0} ج</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  
                  <div className="border-t border-gray-200 pt-3 space-y-1.5 text-[13px] font-bold text-right">
                      <div className="flex justify-between text-gray-500"><span>الإجمالي:</span><span>{subTotalCalc} ج</span></div>
                      {parseFloat(orderForm.discountPercentage) > 0 && <div className="flex justify-between text-red-500 italic"><span>الخصم ({orderForm.discountPercentage}%):</span><span>-{(subTotalCalc * parseFloat(orderForm.discountPercentage) / 100).toFixed(2)} ج</span></div>}
                      
                      <div className="flex justify-between bg-gray-900 text-white p-2.5 rounded-lg mt-2 text-sm shadow-md"><span>الصافي المطلوب:</span><span className="font-black">{finalTotalCalc} ج</span></div>
                      <div className="flex justify-between text-green-600 px-1 pt-2 border-t border-dashed border-gray-200 mt-2"><span>تم دفع:</span><span className="font-black">{orderForm.paidAmount || 0} ج</span></div>
                      
                      <div className="flex justify-between text-red-600 bg-red-50 p-2 rounded-lg mt-1"><span>المتبقي :</span><span className="font-black text-sm">{remainingCalc} ج</span></div>
                  </div>
                  {orderForm.notes && (
                    <div className="mt-4 pt-3 border-t border-gray-200 text-[10px] text-right bg-blue-50 p-2 rounded-lg">
                      <p className="font-bold text-blue-600 mb-1">ملحوظات:</p>
                      <p className="text-gray-700">{orderForm.notes}</p>
                    </div>
                  )}
                  <p className="text-[9px] text-gray-400 mt-6 text-center italic">شكراً لتعاملكم مع Zouma Store</p>
              </div>
            </div>
        </div>
      </TailwindModal>
    </div>
  );
}

export default ClientsPage;
