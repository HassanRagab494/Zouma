import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebaseConfig";

function ClientsPhoneBook() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("latest");
  const [copyCount, setCopyCount] = useState("all");
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClients(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  /* ---- helpers ---- */
  const getTotal = (orders) =>
    (orders || []).reduce((s, o) => s + Number(o.total || 0), 0);

  const getLastOrder = (orders) => {
    if (!orders || orders.length === 0) return null;
    const sorted = [...orders].sort((a, b) => {
      const da = a.date ? new Date(a.date) : new Date(0);
      const db_ = b.date ? new Date(b.date) : new Date(0);
      return db_ - da;
    });
    return sorted[0];
  };

  const sortedClients = [...clients].sort((a, b) => {
    if (sortBy === "topBuyer") return getTotal(b.orders) - getTotal(a.orders);
    if (sortBy === "lastOrder") {
      const la = getLastOrder(a.orders);
      const lb = getLastOrder(b.orders);
      const da = la?.date ? new Date(la.date) : new Date(0);
      const db_ = lb?.date ? new Date(lb.date) : new Date(0);
      return db_ - da;
    }
    return 0;
  });

  const filteredClients = sortedClients.filter(
    (c) =>
      !searchTerm ||
      (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.phone && c.phone.includes(searchTerm))
  );

  const displayLimit = copyCount === "all" ? filteredClients.length : Number(copyCount);
  const previewClients = filteredClients.slice(0, displayLimit);

  /* ---- select helpers ---- */
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === previewClients.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(previewClients.map((c) => c.id)));
    }
  };

  const handleCopy = (mode) => {
    let targets;
    if (mode === "selected") {
      targets = previewClients.filter((c) => selected.has(c.id));
    } else {
      targets = previewClients;
    }
   const lines = targets
  .map((c) => c.phone || "—")
  .join("\n");
    navigator.clipboard.writeText(lines).then(() => {
      setCopied(mode);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  /* ---- UI ---- */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-3" dir="rtl">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-blue-600 dark:text-blue-400 font-bold animate-pulse">جارٍ التحميل...</p>
      </div>
    );

  if (error)
    return (
      <p className="text-center text-red-600 font-bold bg-red-50 p-4 rounded-xl mt-8" dir="rtl">
        خطأ: {error}
      </p>
    );

  const allSelectedInView = selected.size === previewClients.length && previewClients.length > 0;

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gray-50/50 dark:bg-gray-900 text-right transition-colors duration-300" dir="rtl">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-800 dark:text-white">دفتر أرقام العملاء 📋</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 font-bold">{clients.length} عميل مسجل</p>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mb-5 shadow-sm space-y-4">

        {/* Search */}
        <input
          type="text"
          className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 outline-none transition text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 font-bold text-sm"
          placeholder="ابحث بالاسم أو الرقم..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Sort + Count */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">ترتيب:</span>
            <div className="flex gap-1.5">
              {[
                { value: "latest", label: "الأحدث" },
                { value: "topBuyer", label: "الأكثر شراءً" },
                { value: "lastOrder", label: "آخر طلب" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    sortBy === opt.value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Copy count */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">عرض:</span>
            <div className="flex gap-1.5">
              {["50", "100", "all"].map((opt) => (
                <button
                  key={opt}
                  onClick={() => setCopyCount(opt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                    copyCount === opt
                      ? "bg-green-600 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {opt === "all" ? "الكل" : opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 flex-wrap">
          {/* تفعيل وضع التحديد */}
          <button
            onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
            className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all border ${
              selectMode
                ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400"
                : "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {selectMode ? "✖ إلغاء التحديد" : "☑ تحديد يدوي"}
          </button>

          {/* نسخ الكل */}
          <button
            onClick={() => handleCopy("all")}
            className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm ${
              copied === "all"
                ? "bg-green-500 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {copied === "all"
              ? `✅ تم النسخ!`
              : `📋 نسخ الكل (${previewClients.length})`}
          </button>

          {/* نسخ المحدد */}
          {selectMode && (
            <button
              onClick={() => handleCopy("selected")}
              disabled={selected.size === 0}
              className={`flex-1 py-2.5 rounded-xl font-black text-sm transition-all shadow-sm ${
                copied === "selected"
                  ? "bg-green-500 text-white"
                  : selected.size === 0
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
            >
              {copied === "selected"
                ? `✅ تم النسخ!`
                : `📌 نسخ المحدد (${selected.size})`}
            </button>
          )}
        </div>
      </div>

      {/* Summary strip */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-3 mb-4 flex flex-wrap gap-4 text-sm font-bold text-blue-700 dark:text-blue-300">
        <span>📊 يُعرض: <strong>{previewClients.length}</strong> عميل</span>
        <span>💰 إجمالي الكل: <strong>{clients.reduce((s, c) => s + getTotal(c.orders), 0).toLocaleString()} ج</strong></span>
        {selectMode && selected.size > 0 && (
          <span>☑ محدد: <strong className="text-purple-600 dark:text-purple-400">{selected.size}</strong></span>
        )}
      </div>

      {/* Select All bar */}
      {selectMode && (
        <div className="mb-3 flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 rounded-xl px-4 py-2.5">
          <input
            type="checkbox"
            checked={allSelectedInView}
            onChange={toggleSelectAll}
            className="w-4 h-4 accent-orange-500 cursor-pointer"
          />
          <span className="text-sm font-black text-orange-700 dark:text-orange-400">
            {allSelectedInView ? "إلغاء تحديد الكل" : `تحديد الكل (${previewClients.length})`}
          </span>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {previewClients.length > 0 ? (
          previewClients.map((client, idx) => {
            const total = getTotal(client.orders);
            const lastOrder = getLastOrder(client.orders);
            const ordersCount = (client.orders || []).length;
            const isSelected = selected.has(client.id);

            return (
              <div
                key={client.id}
                onClick={() => selectMode && toggleSelect(client.id)}
                className={`bg-white dark:bg-gray-800 border rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all ${
                  selectMode ? "cursor-pointer" : ""
                } ${
                  isSelected
                    ? "border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                    : "border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-gray-600"
                }`}
              >
                {/* Checkbox */}
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(client.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 accent-purple-500 cursor-pointer shrink-0"
                  />
                )}

                {/* Rank */}
                <span className="text-xs font-black text-gray-300 dark:text-gray-600 w-5 text-center shrink-0">
                  {idx + 1}
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-gray-800 dark:text-white text-sm truncate">
                      {client.name || "—"}
                    </span>
                    {client.code && (
                      <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800/40 shrink-0">
                        #{client.code}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold font-sans mt-0.5">
                    {client.phone || "—"}
                  </p>

                  {/* Last order */}
                  {lastOrder ? (
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30 px-2 py-0.5 rounded-lg font-black">
                        🕒 آخر طلب: {lastOrder.date || "—"}
                      </span>
                      {lastOrder.items && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold truncate max-w-[160px]">
                          {lastOrder.items.map((i) => i.name).join(" + ")}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-300 dark:text-gray-600 font-bold mt-1 block">لا يوجد طلبات</span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs font-black text-green-600 dark:text-green-400">
                    {total.toLocaleString()} ج
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                    {ordersCount} أوردر
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-400 dark:text-gray-500 py-10 font-bold bg-white dark:bg-gray-800 rounded-2xl border border-dashed dark:border-gray-700">
            🔍 لا توجد نتائج مطابقة
          </div>
        )}
      </div>

      {filteredClients.length > displayLimit && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-4 font-bold">
          يُعرض {displayLimit} من أصل {filteredClients.length} — غيّر العرض لرؤية المزيد
        </p>
      )}
    </div>
  );
}

export default ClientsPhoneBook;