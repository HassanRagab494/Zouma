import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  collection, getDocs, addDoc, doc, updateDoc,
  deleteDoc, query, orderBy, increment,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

import OrdersHeader   from "../components/orders/OrdersHeader";
import ClientCard     from "../components/orders/ClientCard";
import ClientModal    from "../components/orders/ClientModal";
import OrderModal     from "../components/orders/OrderModal";
import NotesModal     from "../components/orders/NotesModal";

const EMPTY_ORDER_FORM = {
  items: [{ productId: "", name: "", price: "", qty: 1, searchQuery: "", showDropdown: false }],
  discountPercentage: 0,
  paidAmount: 0,
  total: 0,
  status: "NEW",
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

function OrdersPage() {
  const [clients, setClients]                 = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading]                 = useState(true);

  const [searchTerm, setSearchTerm]           = useState("");
  const [sortBy, setSortBy]                   = useState("recent");
  const [statusFilter, setStatusFilter]       = useState("ALL");

  const [showClientModal, setShowClientModal] = useState(false);
  const [modalClient, setModalClient]         = useState(null);
  const [clientForm, setClientForm]           = useState({ name: "", phone: "", phone2: "", address: "", dob: "" });

  const [showOrderModal, setShowOrderModal]   = useState(false);
  const [modalOrder, setModalOrder]           = useState(null);
  const [currentClientId, setCurrentClientId] = useState(null);
  const [orderForm, setOrderForm]             = useState(EMPTY_ORDER_FORM);

  const [notesModal, setNotesModal]           = useState({ show: false, notes: "", clientName: "", orderDate: "" });
  const [successMessage, setSuccessMessage]   = useState("");
  const [copiedPhone, setCopiedPhone]         = useState(null);

  /* ─── fetch ─── */
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setClients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const fetchProducts = async () => {
    try {
      const snap = await getDocs(query(collection(db, "products")));
      setAvailableProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchClients(); fetchProducts(); }, [fetchClients]);

  /* ─── helpers ─── */
  const showSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(""), 2000); };

  const openWhatsApp = (phone) => {
    const clean = phone.replace(/\D/g, "");
    const formatted = clean.startsWith("0") ? "2" + clean : clean;
    window.open(`https://wa.me/${formatted}`, "_blank", "noopener,noreferrer");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  /* ─── client actions ─── */
  const openNewClientModal = () => {
    setModalClient(null);
    setClientForm({ name: "", phone: "", phone2: "", address: "", dob: "" });
    setShowClientModal(true);
  };

  const openEditClientModal = (client) => {
    setModalClient(client);
    setClientForm({ ...client });
    setShowClientModal(true);
  };

  const saveClient = async () => {
    try {
      if (modalClient) {
        await updateDoc(doc(db, "clients", modalClient.id), { ...clientForm });
        await fetchClients();
        setShowClientModal(false);
      } else {
        const ref = await addDoc(collection(db, "clients"), {
          ...clientForm,
          clientCode: Math.floor(1000 + Math.random() * 9000).toString(),
          orders: [],
          createdAt: new Date().toISOString(),
        });
        await fetchClients();
        setShowClientModal(false);
        openOrderModal(ref.id);
      }
    } catch (err) { alert(err.message); }
  };

  const deleteClient = async (clientId, clientName) => {
    if (!window.confirm(`هل أنت متأكد من حذف العميل "${clientName}"؟`)) return;
    try {
      await deleteDoc(doc(db, "clients", clientId));
      fetchClients();
    } catch (err) { alert("خطأ في الحذف"); }
  };

  /* ─── order actions ─── */
  const openOrderModal = useCallback((clientId, order = null, orderIndex = null) => {
    setCurrentClientId(clientId);
    setModalOrder(orderIndex !== null ? { ...order, index: orderIndex } : null);
    if (order) {
      const formattedItems = (order.items || [{ productId: "", name: "أوردر", price: order.total, qty: 1 }])
        .map((i) => ({ ...i, searchQuery: i.name || "", showDropdown: false }));
      setOrderForm({ ...order, paidAmount: order.paidAmount || 0, items: formattedItems, status: order.status || "NEW", date: order.date || new Date().toISOString().split("T")[0], notes: order.notes || "" });
    } else {
      setOrderForm(EMPTY_ORDER_FORM);
    }
    setShowOrderModal(true);
  }, []);

  const saveOrder = async () => {
    try {
      const clientRef  = doc(db, "clients", currentClientId);
      const client     = clients.find((c) => c.id === currentClientId);
      const subTotal   = orderForm.items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
      const finalTotal = (subTotal - subTotal * (parseFloat(orderForm.discountPercentage) / 100)).toFixed(2);
      const cleanItems = orderForm.items.map(({ searchQuery, showDropdown, ...rest }) => rest);
      const orderData  = { ...orderForm, items: cleanItems, total: finalTotal };
      const updatedOrders = [...client.orders];

      if (!modalOrder) {
        for (const item of cleanItems) {
          if (item.productId && item.qty)
            await updateDoc(doc(db, "products", item.productId), { stock: increment(-item.qty) });
        }
        updatedOrders.push(orderData);
      } else {
        updatedOrders[modalOrder.index] = orderData;
      }

      await updateDoc(clientRef, { orders: updatedOrders });
      fetchClients();
      fetchProducts();
      setShowOrderModal(false);
    } catch (err) { alert(err.message); }
  };

  const deleteOrder = async (clientId, orderIndex) => {
    if (!window.confirm("حذف الفاتورة؟ (سيتم إرجاع البضاعة للمخزون تلقائياً إذا لم يتم تسليمها)")) return;
    try {
      const clientRef   = doc(db, "clients", clientId);
      const client      = clients.find((c) => c.id === clientId);
      const orderToDelete = client.orders[orderIndex];
      if (orderToDelete.status !== "DELIVERED") {
        for (const item of orderToDelete.items) {
          if (item.productId && item.qty)
            await updateDoc(doc(db, "products", item.productId), { stock: increment(item.qty) });
        }
      }
      await updateDoc(clientRef, { orders: client.orders.filter((_, i) => i !== orderIndex) });
      fetchClients();
      fetchProducts();
    } catch (err) { alert("خطأ في حذف الفاتورة"); }
  };

  const updateStatusQuickly = async (clientId, orderIndex, newStatus) => {
    try {
      const client = clients.find((c) => c.id === clientId);
      const updated = [...client.orders];
      updated[orderIndex].status = newStatus;
      await updateDoc(doc(db, "clients", clientId), { orders: updated });
      fetchClients();
      showSuccess("تم تحديث حالة الأوردر");
    } catch { alert("خطأ في التحديث"); }
  };

  /* ─── processed clients ─── */
  const processedClients = useMemo(() => {
    let filtered = clients.filter(
      (c) =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        (c.clientCode && c.clientCode.includes(searchTerm))
    );
    if (statusFilter !== "ALL")
      filtered = filtered.filter((c) => c.orders?.some((o) => o.status === statusFilter));

    const now = new Date();
    const startOfMonth   = new Date(now.getFullYear(), now.getMonth(), 1);
    const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(now.getMonth() - 3);

    return [...filtered].sort((a, b) => {
      const sum = (c, limit) => c.orders?.filter((o) => !limit || new Date(o.date) >= limit).reduce((s, o) => s + parseFloat(o.total || 0), 0) || 0;
      if (sortBy === "thisMonth")   return sum(b, startOfMonth) - sum(a, startOfMonth);
      if (sortBy === "threeMonths") return sum(b, threeMonthsAgo) - sum(a, threeMonthsAgo);
      if (sortBy === "allTime")     return sum(b, null) - sum(a, null);
      if (sortBy === "recent") {
        const da = a.orders?.length ? new Date(a.orders[a.orders.length - 1].date).getTime() : 0;
        const db_ = b.orders?.length ? new Date(b.orders[b.orders.length - 1].date).getTime() : 0;
        return db_ - da;
      }
      return 0;
    });
  }, [clients, searchTerm, sortBy, statusFilter]);

  /* ─── render ─── */
  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-100px)] transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-blue-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-xl font-bold animate-pulse text-blue-600 dark:text-blue-400">جارٍ جلب البيانات...</p>
      </div>
    );

  return (
    <div className="p-4 md:p-8 min-h-screen transition-colors duration-300 bg-gray-50/50 dark:bg-gray-900 text-right" dir="rtl">

      <OrdersHeader
        searchTerm={searchTerm}   setSearchTerm={setSearchTerm}
        sortBy={sortBy}           setSortBy={setSortBy}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        onNewClient={openNewClientModal}
      />

      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 p-3 rounded-xl mb-6 text-center font-bold animate-pulse">
          {successMessage}
        </div>
      )}

      {/* كروت العملاء */}
      <div className="grid gap-6">
        {processedClients.length === 0 ? (
          <div className="text-center text-gray-400 dark:text-gray-500 mt-10 font-bold bg-white dark:bg-gray-800 p-8 rounded-2xl border border-dashed dark:border-gray-700">
            لا توجد بيانات مطابقة للبحث
          </div>
        ) : (
          processedClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              copiedPhone={copiedPhone}
              onCopyPhone={copyToClipboard}
              onOpenWhatsApp={openWhatsApp}
              onEditClient={openEditClientModal}
              onDeleteClient={deleteClient}
              onNewOrder={(id) => openOrderModal(id)}
              onEditOrder={openOrderModal}
              onDeleteOrder={deleteOrder}
              onUpdateStatus={updateStatusQuickly}
              onShowNotes={({ notes, clientName, orderDate }) =>
                setNotesModal({ show: true, notes, clientName, orderDate })
              }
            />
          ))
        )}
      </div>

      {/* المودالات */}
      <ClientModal
        show={showClientModal}
        onClose={() => setShowClientModal(false)}
        modalClient={modalClient}
        clientForm={clientForm}
        setClientForm={setClientForm}
        onSave={saveClient}
      />

      <OrderModal
        show={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        orderForm={orderForm}
        setOrderForm={setOrderForm}
        onSave={saveOrder}
        currentClientId={currentClientId}
        clients={clients}
        availableProducts={availableProducts}
      />

      <NotesModal
        show={notesModal.show}
        onClose={() => setNotesModal({ show: false, notes: "", clientName: "", orderDate: "" })}
        notes={notesModal.notes}
        clientName={notesModal.clientName}
        orderDate={notesModal.orderDate}
      />
    </div>
  );
}

export default OrdersPage;