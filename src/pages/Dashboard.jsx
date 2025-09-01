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
  Legend
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalClients = clients.length;
  const allOrders = clients.flatMap((c) => c.orders || []);
  const totalSales = allOrders.length;
  const totalProfit = allOrders.reduce((sum, o) => sum + (o.profit || 0), 0);

  const latestClients = clients.slice(-5).reverse();

  const months = ["يناير","فبراير","مارس","إبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const salesPerMonth = Array(12).fill(0);
  allOrders.forEach((order) => {
    const month = new Date(order.date).getMonth();
    salesPerMonth[month] += order.total || 0;
  });

  const salesData = {
    labels: months,
    datasets: [
      {
        label: "المبيعات (ج)",
        data: salesPerMonth,
        borderColor: "#0d6efd",
        backgroundColor: "rgba(13,110,253,0.2)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const salesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
  };

  if (loading) return <p className="text-center mt-10 text-gray-600">جارٍ تحميل البيانات...</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">لوحة التحكم</h2>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-blue-600 text-white p-4 rounded shadow h-full flex flex-col justify-between">
          <h5 className="text-lg font-semibold">العملاء</h5>
          <p className="text-3xl font-bold">{totalClients}</p>
        </div>
        <div className="bg-green-600 text-white p-4 rounded shadow h-full flex flex-col justify-between">
          <h5 className="text-lg font-semibold">عدد الأوردرات</h5>
          <p className="text-3xl font-bold">{totalSales}</p>
        </div>
        <div className="bg-yellow-400 text-black p-4 rounded shadow h-full flex flex-col justify-between">
          <h5 className="text-lg font-semibold">إجمالي الأرباح</h5>
          <p className="text-3xl font-bold">{totalProfit.toFixed(2)} ج</p>
        </div>
      </div>

      {/* المخطط والآخر العملاء */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white shadow rounded p-4" style={{ minHeight: "350px" }}>
          <h5 className="text-lg font-semibold mb-2">مخطط المبيعات حسب الشهر</h5>
          <div className="h-[300px]">
            <Line data={salesData} options={salesOptions} />
          </div>
        </div>
        <div className="bg-white shadow rounded p-4">
          <h5 className="text-lg font-semibold mb-2">آخر العملاء</h5>
          <ul className="divide-y divide-gray-200">
            {latestClients.length === 0 && (
              <li className="py-2 text-gray-500">لا يوجد عملاء</li>
            )}
            {latestClients.map((c) => (
              <li key={c.id} className="py-2">{c.name} - {c.phone}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
