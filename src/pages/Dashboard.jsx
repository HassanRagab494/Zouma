import React, { useEffect, useState } from "react";
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

  // حسابات الإحصائيات
  const totalClients = clients.length;
  const allOrders = clients.flatMap((c) => c.orders || []);
  const totalSalesCount = allOrders.length;
  
  // إجمالي الدخل (مجموع خانات الـ total في الأوردرات)
  const totalRevenue = allOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

  // معالجة بيانات المخطط للسنة الحالية فقط
  const currentYear = new Date().getFullYear();
  const months = ["يناير","فبراير","مارس","إبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const salesPerMonth = Array(12).fill(0);

  allOrders.forEach((order) => {
    const orderDate = new Date(order.date);
    // نتحقق أن الأوردر في السنة الحالية وأن التاريخ صحيح
    if (orderDate.getFullYear() === currentYear) {
      const monthIndex = orderDate.getMonth();
      salesPerMonth[monthIndex] += parseFloat(order.total) || 0;
    }
  });

  const salesData = {
    labels: months,
    datasets: [
      {
        label: `مبيعات سنة ${currentYear} (جنية)`,
        data: salesPerMonth,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4, // لجعل الخط منحني بشكل انسيابي
        fill: true,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#fff",
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
        ticks: {
            callback: (value) => value + " ج"
        }
      }
    },
    plugins: {
      legend: { display: true, position: 'top', align: 'end', labels: { font: { family: 'Arial' } } },
      tooltip: { rtl: true }
    },
  };

  const latestClients = [...clients]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
        <p className="text-xl font-bold animate-pulse text-blue-600">جارٍ تحليل البيانات...</p>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans" dir="rtl">
      <h2 className="text-3xl font-black mb-8 mt-10 text-gray-800">لوحة المراقبة <span className="text-blue-600 text-sm font-normal">| إحصائيات عامة</span></h2>

      {/* كروت الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-r-4 border-blue-500 flex flex-col justify-between">
          <h5 className="text-gray-500 font-bold text-sm uppercase">إجمالي العملاء</h5>
          <p className="text-4xl font-black text-gray-800 mt-2">{totalClients}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-r-4 border-purple-500 flex flex-col justify-between">
          <h5 className="text-gray-500 font-bold text-sm uppercase">عدد العمليات</h5>
          <p className="text-4xl font-black text-gray-800 mt-2">{totalSalesCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border-r-4 border-green-500 flex flex-col justify-between">
          <h5 className="text-gray-500 font-bold text-sm uppercase">إجمالي المبيعات</h5>
          <p className="text-4xl font-black text-green-600 mt-2 font-sans tracking-tighter">{totalRevenue.toLocaleString()} <span className="text-sm">ج</span></p>
        </div>
      </div>

      {/* المخطط وآخر العملاء */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* المخطط البياني */}
        <div className="lg:col-span-2 bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
          <h5 className="text-lg font-bold mb-6 text-gray-700">تطور المبيعات الشهري</h5>
          <div className="h-[350px]">
            <Line data={salesData} options={salesOptions} />
          </div>
        </div>

        {/* قائمة آخر العملاء */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
          <h5 className="text-lg font-bold mb-6 text-gray-700">آخر المنضمين</h5>
          <ul className="space-y-4">
            {latestClients.length === 0 ? (
              <li className="text-center py-10 text-gray-400">لا يوجد بيانات حالياً</li>
            ) : (
              latestClients.map((c) => (
                <li key={c.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div>
                    <p className="font-bold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400 font-sans">{c.phone}</p>
                  </div>
                  <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded-md font-bold italic">NEW</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
