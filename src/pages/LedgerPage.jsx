import React, { useEffect, useMemo, useState } from "react";
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

const emptyForm = { title: "", type: "expense", amount: "", note: "" };

function formatDate(value) {
  const date = value?.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ar-EG");
}

export default function LedgerPage() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "ledger"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      setLoading(false);
    }, () => setLoading(false));
  }, []);

  const titles = useMemo(() => [...new Set(entries.map((entry) => entry.title).filter(Boolean))], [entries]);
  const visibleEntries = filter === "ALL" ? entries : entries.filter((entry) => entry.title === filter);
  const income = entries.filter((entry) => entry.type === "income").reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const expenses = entries.filter((entry) => entry.type === "expense").reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  const saveEntry = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || Number(form.amount) <= 0) return;
    await addDoc(collection(db, "ledger"), {
      title: form.title.trim(), type: form.type, amount: Number(form.amount), note: form.note.trim(),
      source: "manual", createdAt: serverTimestamp(),
    });
    setForm(emptyForm);
  };

  return <div className="p-4 md:p-8 min-h-screen bg-gray-50/50 dark:bg-gray-900 text-right" dir="rtl">
    <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
      <div><h1 className="text-3xl font-black text-gray-800 dark:text-white">الدفتر</h1><p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1">كل حركة دخل أو مصروف بالتاريخ والوقت</p></div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl p-3 font-bold text-gray-700 dark:text-gray-200">
        <option value="ALL">كل البنود</option>{titles.map((title) => <option key={title} value={title}>{title}</option>)}
      </select>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-2xl border border-green-100 dark:border-green-800"><span className="text-sm font-bold text-green-700 dark:text-green-400">إجمالي الداخل</span><strong className="block text-2xl text-green-700 dark:text-green-300">{income.toLocaleString()} ج</strong></div>
      <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-2xl border border-red-100 dark:border-red-800"><span className="text-sm font-bold text-red-700 dark:text-red-400">إجمالي الخارج</span><strong className="block text-2xl text-red-700 dark:text-red-300">{expenses.toLocaleString()} ج</strong></div>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-2xl border border-blue-100 dark:border-blue-800"><span className="text-sm font-bold text-blue-700 dark:text-blue-400">الرصيد</span><strong className="block text-2xl text-blue-700 dark:text-blue-300">{(income - expenses).toLocaleString()} ج</strong></div>
    </div>
    <form onSubmit={saveEntry} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
      <input required placeholder="البند (مثال: بضاعة)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 font-bold" />
      <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 font-bold"><option value="expense">مصروف / خارج</option><option value="income">دخل / داخل</option></select>
      <input required min="0.01" step="0.01" type="number" placeholder="المبلغ" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 font-bold" />
      <input placeholder="ملاحظات" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 font-bold" />
      <button className="bg-blue-600 text-white rounded-xl font-black p-3 hover:bg-blue-700">إضافة للدفتر</button>
    </form>
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-x-auto">
      {loading ? <p className="p-8 text-center font-bold">جاري تحميل الدفتر...</p> : <table className="w-full min-w-[700px] text-center"><thead className="bg-gray-50 dark:bg-gray-900/50"><tr><th className="p-4">البند</th><th>النوع</th><th>المبلغ</th><th>التاريخ والوقت</th><th>ملاحظات</th><th></th></tr></thead><tbody className="divide-y dark:divide-gray-700">{visibleEntries.map((entry) => <tr key={entry.id}><td className="p-4 font-black">{entry.title}</td><td className={entry.type === "income" ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{entry.type === "income" ? "داخل" : "خارج"}</td><td className="font-black">{Number(entry.amount || 0).toLocaleString()} ج</td><td className="text-sm">{formatDate(entry.createdAt)}</td><td>{entry.note || "—"}</td><td>{entry.source === "manual" && <button onClick={() => deleteDoc(doc(db, "ledger", entry.id))} className="text-red-500 font-bold">حذف</button>}</td></tr>)}</tbody></table>}
    </div>
  </div>;
}
