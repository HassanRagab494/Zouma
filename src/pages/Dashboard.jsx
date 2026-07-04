import React, { useEffect, useState, useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function Dashboard() {
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastBackup, setLastBackup] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    let clientsLoaded = false;
    let productsLoaded = false;

    const saved = localStorage.getItem("lastBackupDate");
    if (saved) setLastBackup(new Date(saved));

    const updateLoading = () => {
      if (clientsLoaded && productsLoaded) {
        setLoading(false);
      }
    };

    const unsubscribeClients = onSnapshot(
      collection(db, "clients"),
      (snapshot) => {
        const clientsList = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((item) => !item.isDeleted);
        setClients(clientsList);
        clientsLoaded = true;
        updateLoading();
      },
      (err) => {
        console.error("Error fetching dashboard clients:", err);
        clientsLoaded = true;
        updateLoading();
      }
    );

    const unsubscribeProducts = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const productsList = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((item) => !item.isDeleted);
        setProducts(productsList);
        productsLoaded = true;
        updateLoading();
      },
      (err) => {
        console.error("Error fetching dashboard products:", err);
        productsLoaded = true;
        updateLoading();
      }
    );

    return () => {
      unsubscribeClients();
      unsubscribeProducts();
    };
  }, []);

  const handleExport = async () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        clients,
        products,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zouma-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const now = new Date();
      setLastBackup(now);
      localStorage.setItem("lastBackupDate", now.toISOString());
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      alert("Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø§Ù„ØªØµØ¯ÙŠØ±");
    }
  };

  const daysSinceBackup = lastBackup
    ? Math.floor((new Date() - lastBackup) / (1000 * 60 * 60 * 24))
    : null;

  const showBackupWarning = daysSinceBackup === null || daysSinceBackup >= 1;

  const stats = useMemo(() => {
    const allOrders = clients.flatMap((c) => c.orders || []);
    let totalRevenue = 0;
    let totalCollected = 0;

    allOrders.forEach((o) => {
      totalRevenue += parseFloat(o.total) || 0;
      totalCollected += parseFloat(o.paidAmount) || 0;
    });

    const totalDebts = totalRevenue - totalCollected;

    // Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø®Ø²ÙˆÙ† = Ø³Ø¹Ø± Ø§Ù„Ø¬Ù…Ù„Ø© Ã— Ø§Ù„ÙƒÙ…ÙŠØ©
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + (parseFloat(p.wholesalePrice) || 0) * (parseInt(p.stock) || 0),
      0
    );

    const currentYear = new Date().getFullYear();
    const salesPerMonth = Array(12).fill(0);
    allOrders.forEach((order) => {
      const orderDate = new Date(order.date);
      if (orderDate.getFullYear() === currentYear) {
        salesPerMonth[orderDate.getMonth()] += parseFloat(order.total) || 0;
      }
    });

    const topClients = [...clients]
      .map((c) => ({
        ...c,
        totalSpent: (c.orders || []).reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0),
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      totalClients: clients.length,
      totalOrders: allOrders.length,
      totalRevenue,
      totalCollected,
      totalDebts,
      totalInventoryValue,
      salesPerMonth,
      currentYear,
      topClients,
    };
  }, [clients, products]);

  const months = ["ÙŠÙ†Ø§ÙŠØ±","ÙØ¨Ø±Ø§ÙŠØ±","Ù…Ø§Ø±Ø³","Ø¥Ø¨Ø±ÙŠÙ„","Ù…Ø§ÙŠÙˆ","ÙŠÙˆÙ†ÙŠÙˆ","ÙŠÙˆÙ„ÙŠÙˆ","Ø£ØºØ³Ø·Ø³","Ø³Ø¨ØªÙ…Ø¨Ø±","Ø£ÙƒØªÙˆØ¨Ø±","Ù†ÙˆÙÙ…Ø¨Ø±","Ø¯ÙŠØ³Ù…Ø¨Ø±"];

  const salesData = {
    labels: months,
    datasets: [
      {
        label: `Ù…Ø¨ÙŠØ¹Ø§Øª ${stats.currentYear}`,
        data: stats.salesPerMonth,
        borderColor: "#4f46e5",
        backgroundColor: "rgba(79, 70, 229, 0.15)",
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "#4f46e5",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const salesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: { borderDash: [5, 5], color: "rgba(156, 163, 175, 0.2)" },
        ticks: { color: "#9ca3af", callback: (value) => value.toLocaleString() + " Ø¬" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#9ca3af" },
      },
    },
    plugins: {
      legend: { display: true, position: "top", align: "end", labels: { color: "#9ca3af", font: { family: "Cairo, sans-serif", weight: "bold" } } },
      tooltip: { rtl: true, titleFont: { family: "Cairo" }, bodyFont: { family: "Cairo" }, backgroundColor: "rgba(0,0,0,0.8)" },
    },
  };

  if (loading)
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-blue-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-bold animate-pulse text-blue-600 dark:text-blue-400">Ø¬Ø§Ø±Ù ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª...</p>
      </div>
    );

  return (
    <div className="p-4 md:p-8 bg-gray-50/50 dark:bg-gray-900 min-h-screen font-sans transition-colors duration-300" dir="rtl">

      {/* ØªÙ†Ø¨ÙŠÙ‡ Ø§Ù„Ø¨Ø§Ùƒ Ø§Ø¨ */}
      {showBackupWarning && (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">âš ï¸</span>
            <div>
              <p className="font-black text-amber-800 dark:text-amber-400 text-sm">
                {daysSinceBackup === null ? "Ù„Ù… ÙŠØªÙ… Ø¹Ù…Ù„ Ø¨Ø§Ùƒ Ø§Ø¨ Ø¨Ø¹Ø¯!" : `Ø¢Ø®Ø± Ø¨Ø§Ùƒ Ø§Ø¨ Ù…Ù†Ø° ${daysSinceBackup} ÙŠÙˆÙ…`}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 font-bold mt-0.5">ÙŠÙÙ†ØµØ­ Ø¨Ø¹Ù…Ù„ Ø¨Ø§Ùƒ Ø§Ø¨ ÙŠÙˆÙ…ÙŠ Ù„Ø­Ù…Ø§ÙŠØ© Ø¨ÙŠØ§Ù†Ø§ØªÙƒ</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm whitespace-nowrap ${
              exportSuccess
                ? "bg-green-500 text-white"
                : "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30"
            }`}
          >
            {exportSuccess ? "âœ… ØªÙ… Ø§Ù„ØªØµØ¯ÙŠØ±!" : "ðŸ’¾ Ø¹Ù…Ù„ Ø¨Ø§Ùƒ Ø§Ø¨ Ø§Ù„Ø¢Ù†"}
          </button>
        </div>
      )}

      {/* Ø§Ù„Ù‡ÙŠØ¯Ø± */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-4">
        <div>
          <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight transition-colors">Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1 transition-colors">Ù…Ù„Ø®Øµ Ù…Ø§Ù„ÙŠ ÙˆØ¥Ø­ØµØ§Ø¦ÙŠ Ù„Ø­Ø±ÙƒØ© Ø§Ù„Ù…Ø­Ù„</p>
        </div>
        <button
          onClick={handleExport}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
            exportSuccess
              ? "bg-green-500 text-white"
              : "bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white"
          }`}
        >
          {exportSuccess ? "âœ… ØªÙ… Ø§Ù„ØªØµØ¯ÙŠØ±!" : "ðŸ’¾ ØªØµØ¯ÙŠØ± Ø¨Ø§Ùƒ Ø§Ø¨"}
        </button>
      </div>

      {/* Ø§Ù„ÙƒØ±ÙˆØª */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">

        {/* Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-r-4 border-r-blue-500 hover:-translate-y-1 transition-all duration-300">
          <h5 className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Ø­Ø¬Ù… Ø§Ù„Ø¹Ù…Ù„ (Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª)</h5>
          <p className="text-2xl font-black text-gray-800 dark:text-white">{stats.totalRevenue.toLocaleString()} <span className="text-sm text-gray-400">Ø¬</span></p>
        </div>

        {/* Ø§Ù„Ù…Ø­ØµÙ„ */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-r-4 border-r-green-500 hover:-translate-y-1 transition-all duration-300">
          <h5 className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Ø§Ù„Ù…Ø­ØµÙ„ Ø¨Ø§Ù„Ø®Ø²ÙŠÙ†Ø©</h5>
          <p className="text-2xl font-black text-green-600 dark:text-green-400">{stats.totalCollected.toLocaleString()} <span className="text-sm text-green-400/70">Ø¬</span></p>
        </div>

        {/* Ø§Ù„Ø¯ÙŠÙˆÙ† */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-r-4 border-r-red-500 hover:-translate-y-1 transition-all duration-300">
          <h5 className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Ø¯ÙŠÙˆÙ† Ø¨Ø§Ù„Ø³ÙˆÙ‚ (Ù„Ù„Ù…Ø­Ù„)</h5>
          <p className="text-2xl font-black text-red-600 dark:text-red-400">{stats.totalDebts.toLocaleString()} <span className="text-sm text-red-400/70">Ø¬</span></p>
        </div>

        {/* Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ ÙˆØ§Ù„Ø£ÙˆØ±Ø¯Ø±Ø§Øª */}
        <div className="xl:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-r-4 border-r-purple-500 hover:-translate-y-1 transition-all duration-300">
          <h5 className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Ø¹Ù…Ù„Ø§Ø¡ / Ø£ÙˆØ±Ø¯Ø±Ø§Øª</h5>
          <p className="text-2xl font-black text-gray-800 dark:text-white">
            {stats.totalClients} <span className="text-sm font-bold text-gray-400">Ø¹Ù…ÙŠÙ„</span>
            <span className="text-purple-300 dark:text-purple-600/50 mx-2">|</span>
            {stats.totalOrders} <span className="text-sm font-bold text-gray-400">ÙØ§ØªÙˆØ±Ø©</span>
          </p>
        </div>

        {/* Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø®Ø²ÙˆÙ† */}
        <div className="xl:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-r-4 border-r-orange-500 hover:-translate-y-1 transition-all duration-300">
          <h5 className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø®Ø²ÙˆÙ† Ø§Ù„Ø­Ø§Ù„ÙŠØ©</h5>
          <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{stats.totalInventoryValue.toLocaleString()} <span className="text-sm text-orange-400/70">Ø¬</span></p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mt-1">Ø³Ø¹Ø± Ø§Ù„Ø¬Ù…Ù„Ø© Ã— Ø§Ù„ÙƒÙ…ÙŠØ©</p>
        </div>

      </div>

      <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Ø§Ù„Ù…Ø®Ø·Ø· Ø§Ù„Ø¨ÙŠØ§Ù†ÙŠ */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-6 transition-colors duration-300">
          <div className="flex justify-between items-center mb-6">
            <h5 className="text-lg font-black text-gray-800 dark:text-white">Ù…Ø¤Ø´Ø± Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª Ø§Ù„Ø´Ù‡Ø±ÙŠ</h5>
            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-800/50">Ø¹Ø§Ù… {stats.currentYear}</span>
          </div>
          <div className="h-[350px]">
            <Line data={salesData} options={salesOptions} />
          </div>
        </div>

        {/* Ø£ÙØ¶Ù„ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-6 flex flex-col transition-colors duration-300">
          <h5 className="text-lg font-black mb-6 text-gray-800 dark:text-white flex items-center gap-2">â­ Ø£ÙØ¶Ù„ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ (Top 5)</h5>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
            <ul className="space-y-3">
              {stats.topClients.length === 0 ? (
                <li className="text-center py-10 text-gray-400 dark:text-gray-500 font-bold">Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ø­Ø§Ù„ÙŠØ§Ù‹</li>
              ) : (
                stats.topClients.map((c, index) => (
                  <li key={c.id} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400" :
                        index === 1 ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300" :
                        index === 2 ? "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400" :
                        "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{c.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-sans mt-0.5">{c.phone}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-green-600 dark:text-green-400">{c.totalSpent.toLocaleString()} Ø¬</p>
                      <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Ù…Ø³Ø­ÙˆØ¨Ø§Øª</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
