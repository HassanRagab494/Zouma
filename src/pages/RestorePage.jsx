import React, { useState } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

function RestorePage() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null); // null | "loading" | "success" | "error"
  const [log, setLog] = useState([]);
  const [stats, setStats] = useState(null);

  const addLog = (msg) => setLog((prev) => [...prev, msg]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setLog([]);
    setStats(null);
    setStatus(null);
  };

  const handleRestore = async () => {
    if (!file) return alert("اختار ملف الباك اب أول!");

    setStatus("loading");
    setLog([]);
    setStats(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      let clientsAdded = 0;
      let clientsSkipped = 0;
      let productsAdded = 0;
      let productsSkipped = 0;

      // ── استرجاع العملاء ──
      if (data.clients && data.clients.length > 0) {
        addLog(`📋 بدء استرجاع ${data.clients.length} عميل...`);

        for (const client of data.clients) {
          try {
            // تحقق إذا العميل موجود بنفس الكود
            const q = query(
              collection(db, "clients"),
              where("code", "==", client.code || client.clientCode || "")
            );
            const existing = await getDocs(q);

            if (!existing.empty) {
              clientsSkipped++;
              addLog(`⏭️ تم تخطي العميل: ${client.name} (موجود مسبقاً)`);
            } else {
              const { id, ...clientData } = client;
              await addDoc(collection(db, "clients"), {
                ...clientData,
                restoredAt: new Date().toISOString(),
              });
              clientsAdded++;
              addLog(`✅ تم إضافة العميل: ${client.name}`);
            }
          } catch (err) {
            addLog(`❌ خطأ في العميل ${client.name}: ${err.message}`);
          }
        }
      }

      // ── استرجاع المنتجات ──
      if (data.products && data.products.length > 0) {
        addLog(`📦 بدء استرجاع ${data.products.length} منتج...`);

        for (const product of data.products) {
          try {
            const q = query(
              collection(db, "products"),
              where("name", "==", product.name)
            );
            const existing = await getDocs(q);

            if (!existing.empty) {
              productsSkipped++;
              addLog(`⏭️ تم تخطي المنتج: ${product.name} (موجود مسبقاً)`);
            } else {
              const { id, ...productData } = product;
              await addDoc(collection(db, "products"), {
                ...productData,
                restoredAt: new Date().toISOString(),
              });
              productsAdded++;
              addLog(`✅ تم إضافة المنتج: ${product.name}`);
            }
          } catch (err) {
            addLog(`❌ خطأ في المنتج ${product.name}: ${err.message}`);
          }
        }
      }

      setStats({ clientsAdded, clientsSkipped, productsAdded, productsSkipped });
      setStatus("success");
      addLog("🎉 اكتمل الاستيراد بنجاح!");
    } catch (err) {
      setStatus("error");
      addLog(`❌ خطأ في قراءة الملف: ${err.message}`);
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50/50 dark:bg-gray-900 transition-colors duration-300" dir="rtl">

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
          استرجاع البيانات 🔄
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1">
          ارفع ملف الباك اب لاسترجاع العملاء والمنتجات
        </p>
      </div>

      {/* تحذير */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 mb-8 flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div>
          <p className="font-black text-amber-800 dark:text-amber-400 text-sm">تنبيه مهم</p>
          <p className="text-xs text-amber-700 dark:text-amber-500 font-bold mt-1">
            الاستيراد لن يحذف أي بيانات موجودة — فقط يضيف الجديد. العملاء والمنتجات الموجودة مسبقاً سيتم تخطيها تلقائياً.
          </p>
        </div>
      </div>

      {/* رفع الملف */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 mb-6">
        <label className="block mb-6">
          <span className="text-sm font-black text-gray-700 dark:text-gray-300 mb-3 block">اختار ملف الباك اب (.json)</span>
          <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
            />
            <label htmlFor="fileInput" className="cursor-pointer">
              <span className="text-4xl block mb-3">📂</span>
              {file ? (
                <p className="font-black text-blue-600 dark:text-blue-400">{file.name}</p>
              ) : (
                <p className="font-bold text-gray-400 dark:text-gray-500">اضغط لاختيار ملف JSON</p>
              )}
            </label>
          </div>
        </label>

        <button
          onClick={handleRestore}
          disabled={!file || status === "loading"}
          className={`w-full py-4 rounded-xl font-black text-sm transition-all shadow-sm ${
            status === "loading"
              ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              : status === "success"
              ? "bg-green-500 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30"
          }`}
        >
          {status === "loading" ? "⏳ جارٍ الاستيراد..." : status === "success" ? "✅ تم الاستيراد بنجاح!" : "🔄 ابدأ الاستيراد"}
        </button>
      </div>

      {/* الإحصائيات */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-green-600 dark:text-green-400">{stats.clientsAdded}</p>
            <p className="text-xs font-bold text-green-700 dark:text-green-500 mt-1">عميل تم إضافته</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-gray-500 dark:text-gray-400">{stats.clientsSkipped}</p>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-500 mt-1">عميل تم تخطيه</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.productsAdded}</p>
            <p className="text-xs font-bold text-blue-700 dark:text-blue-500 mt-1">منتج تم إضافته</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-gray-500 dark:text-gray-400">{stats.productsSkipped}</p>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-500 mt-1">منتج تم تخطيه</p>
          </div>
        </div>
      )}

      {/* السجل */}
      {log.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-black text-gray-800 dark:text-white mb-4">سجل العمليات</h3>
          <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar">
            {log.map((entry, i) => (
              <p key={i} className="text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-3 py-2 rounded-lg">
                {entry}
              </p>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default RestorePage;