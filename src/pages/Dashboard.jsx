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
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "clients"));
      const clientsList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setClients(clientsList);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const allOrders = clients.flatMap((c) => c.orders || []);
    let totalRevenue = 0;   
    let totalCollected = 0; 

    allOrders.forEach((o) => {
      totalRevenue += parseFloat(o.total) || 0;
      totalCollected += parseFloat(o.paidAmount) || 0;
    });

    const totalDebts = totalRevenue - totalCollected; 

    const currentYear = new Date().getFullYear();
    const salesPerMonth = Array(12).fill(0);
    
    allOrders.forEach((order) => {
      const orderDate = new Date(order.date);
      if (orderDate.getFullYear() === currentYear) {
        salesPerMonth[orderDate.getMonth()] += parseFloat(order.total) || 0;
      }
    });

    const topClients = [...clients]
      .map(c => ({
        ...c,
        totalSpent: (c.orders || []).reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    return {
      totalClients: clients.length,
      totalOrders: allOrders.length,
      totalRevenue,
      totalCollected,
      totalDebts,
      salesPerMonth,
      currentYear,
      topClients
    };
  }, [clients]);

  const months = ["يناير","فبراير","مارس","إبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  
  const salesData = {
    labels: months,
    datasets: [
      {
        label: `مبيعات ${stats.currentYear}`,
        data: stats.salesPerMonth,
        borderColor: "#4f46e5", 
        backgroundColor: "rgba(79, 70, 229, 0.15)", // تغميق بسيط لتليق مع الدارك
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
          // تم تعديل لون الشبكة ليتوافق مع الفاتح والغامق
          grid: { borderDash: [5, 5], color: "rgba(156, 163, 175, 0.2)" },
          ticks: { color: "#9ca3af", callback: (value) => value.toLocaleString() + " ج" }
      },
      x: { 
          grid: { display: false },
          ticks: { color: "#9ca3af" }
      }
    },
    plugins: {
      legend: { display: true, position: 'top', align: 'end', labels: { color: "#9ca3af", font: { family: 'Cairo, sans-serif', weight: 'bold' } } },
      tooltip: { rtl: true, titleFont: { family: 'Cairo' }, bodyFont: { family: 'Cairo' }, backgroundColor: 'rgba(0,0,0,0.8)' }
    },
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-blue-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-bold animate-pulse text-blue-600 dark:text-blue-400">جارٍ تحليل البيانات...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-gray-50/50 dark:bg-gray-900 min-h-screen font-sans transition-colors duration-300" dir="rtl">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-4">
          <div>
            <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight transition-colors">لوحة التحكم <span className="text-blue-600 dark:text-blue-500">الذكية</span></h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1 transition-colors">ملخص مالي وإحصائي لحركة المحل</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* الكارت 1 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-r-4 border-r-blue-500 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
              <div>
                  <h5 className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">حجم العمل (المبيعات)</h5>
                  <p className="text-2xl font-black text-gray-800 dark:text-white">{stats.totalRevenue.toLocaleString()} <span className="text-sm text-gray-400">ج</span></p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg text-blue-600 dark:text-blue-400 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              </div>
          </div>
        </div>

        {/* الكارت 2 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-r-4 border-r-green-500 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
              <div>
                  <h5 className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">المحصل بالخزينة</h5>
                  <p className="text-2xl font-black text-green-600 dark:text-green-400">{stats.totalCollected.toLocaleString()} <span className="text-sm text-green-400/70">ج</span></p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg text-green-600 dark:text-green-400 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
          </div>
        </div>

        {/* الكارت 3 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-r-4 border-r-red-500 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
              <div>
                  <h5 className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">ديون بالسوق (للمحل)</h5>
                  <p className="text-2xl font-black text-red-600 dark:text-red-400">{stats.totalDebts.toLocaleString()} <span className="text-sm text-red-400/70">ج</span></p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg text-red-600 dark:text-red-400 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
          </div>
        </div>

        {/* الكارت 4 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 border-r-4 border-r-purple-500 hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
              <div>
                  <h5 className="text-gray-500 dark:text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">عملاء / أوردرات</h5>
                  <p className="text-2xl font-black text-gray-800 dark:text-white">{stats.totalClients} <span className="text-sm font-bold text-gray-400">عميل</span> <span className="text-purple-300 dark:text-purple-600/50 mx-1">|</span> {stats.totalOrders} <span className="text-sm font-bold text-gray-400">فاتورة</span></p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg text-purple-600 dark:text-purple-400 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
          </div>
        </div>

      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* المخطط البياني */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-6 transition-colors duration-300">
          <div className="flex justify-between items-center mb-6">
            <h5 className="text-lg font-black text-gray-800 dark:text-white">مؤشر المبيعات الشهري</h5>
            <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-800/50">عام {stats.currentYear}</span>
          </div>
          <div className="h-[350px]">
            <Line data={salesData} options={salesOptions} />
          </div>
        </div>

        {/* قائمة أفضل العملاء */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 rounded-2xl p-6 flex flex-col transition-colors duration-300">
          <h5 className="text-lg font-black mb-6 text-gray-800 dark:text-white flex items-center gap-2">
            ⭐ أفضل العملاء (Top 5)
          </h5>
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <ul className="space-y-3">
                {stats.topClients.length === 0 ? (
                  <li className="text-center py-10 text-gray-400 dark:text-gray-500 font-bold">لا توجد بيانات حالياً</li>
                ) : (
                  stats.topClients.map((c, index) => (
                    <li key={c.id} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm 
                          ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' : 
                            index === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : 
                            index === 2 ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400' : 
                            'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                            {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-gray-100 text-sm">{c.name}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-sans mt-0.5">{c.phone}</p>
                        </div>
                      </div>
                      <div className="text-left">
                          <p className="text-sm font-black text-green-600 dark:text-green-400">{c.totalSpent.toLocaleString()} ج</p>
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">مسحوبات</p>
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
