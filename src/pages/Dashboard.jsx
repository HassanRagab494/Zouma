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
        borderColor: "#4f46e5", // Indigo color
        backgroundColor: "rgba(79, 70, 229, 0.1)",
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
          grid: { borderDash: [5, 5], color: "#f3f4f6" },
          ticks: { callback: (value) => value.toLocaleString() + " ج" }
      },
      x: { grid: { display: false } }
    },
    plugins: {
      legend: { display: true, position: 'top', align: 'end', labels: { font: { family: 'Cairo, sans-serif', weight: 'bold' } } },
      tooltip: { rtl: true, titleFont: { family: 'Cairo' }, bodyFont: { family: 'Cairo' }, backgroundColor: 'rgba(0,0,0,0.8)' }
    },
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-bold animate-pulse text-blue-600">جارٍ تحليل البيانات...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-gray-50/50 min-h-screen font-sans" dir="rtl">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-4">
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tight">لوحة التحكم </h2>
            <p className="text-sm text-gray-500 font-bold mt-1">ملخص مالي وإحصائي لحركة المحل</p>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-r-4 border-r-blue-500 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start">
              <div>
                  <h5 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">حجم العمل (المبيعات)</h5>
                  <p className="text-2xl font-black text-gray-800">{stats.totalRevenue.toLocaleString()} <span className="text-sm text-gray-400">ج</span></p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-r-4 border-r-green-500 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start">
              <div>
                  <h5 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">المحصل بالخزينة</h5>
                  <p className="text-2xl font-black text-green-600">{stats.totalCollected.toLocaleString()} <span className="text-sm text-green-400">ج</span></p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-r-4 border-r-red-500 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start">
              <div>
                  <h5 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">ديون بالسوق (للمحل)</h5>
                  <p className="text-2xl font-black text-red-600">{stats.totalDebts.toLocaleString()} <span className="text-sm text-red-400">ج</span></p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-red-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-r-4 border-r-purple-500 hover:-translate-y-1 transition-transform duration-300">
          <div className="flex justify-between items-start">
              <div>
                  <h5 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">عملاء / أوردرات</h5>
                  <p className="text-2xl font-black text-gray-800">{stats.totalClients} <span className="text-sm font-bold text-gray-400">عميل</span> <span className="text-purple-300 mx-1">|</span> {stats.totalOrders} <span className="text-sm font-bold text-gray-400">فاتورة</span></p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg text-purple-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
          </div>
        </div>

      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h5 className="text-lg font-black text-gray-800">مؤشر المبيعات الشهري</h5>
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">عام {stats.currentYear}</span>
          </div>
          <div className="h-[350px]">
            <Line data={salesData} options={salesOptions} />
          </div>
        </div>

        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6 flex flex-col">
          <h5 className="text-lg font-black mb-6 text-gray-800 flex items-center gap-2">
             أفضل العملاء (Top 5)
          </h5>
          <div className="flex-1 overflow-y-auto pr-1">
              <ul className="space-y-3">
                {stats.topClients.length === 0 ? (
                  <li className="text-center py-10 text-gray-400 font-bold">لا توجد بيانات حالياً</li>
                ) : (
                  stats.topClients.map((c, index) => (
                    <li key={c.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>
                            {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-sm">{c.name}</p>
                          <p className="text-[10px] text-gray-400 font-sans mt-0.5">{c.phone}</p>
                        </div>
                      </div>
                      <div className="text-left">
                          <p className="text-sm font-black text-green-600">{c.totalSpent.toLocaleString()} ج</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">مسحوبات</p>
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
