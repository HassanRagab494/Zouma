import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
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

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "clients"));
      const clientsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalClients = clients.length;
  const allOrders = clients.flatMap(c => c.orders || []);
  const totalSales = allOrders.length;
  const totalProfit = allOrders.reduce((sum, o) => sum + (o.profit || 0), 0);

  const latestClients = clients.slice(-5).reverse();

  const months = ["يناير","فبراير","مارس","إبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const salesPerMonth = Array(12).fill(0);

  allOrders.forEach(order => {
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

  if (loading) return <p className="text-center mt-5">جارٍ تحميل البيانات...</p>;

  return (
    <div className="container-fluid p-4">
      <h2 className="mb-4">لوحة التحكم</h2>

      <div className="row g-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card text-white bg-primary shadow h-100">
            <div className="card-body">
              <h5 className="card-title">العملاء</h5>
              <p className="card-text fs-4">{totalClients}</p>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card text-white bg-success shadow h-100">
            <div className="card-body">
              <h5 className="card-title">عدد الأوردرات</h5>
              <p className="card-text fs-4">{totalSales}</p>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card text-white bg-warning shadow h-100">
            <div className="card-body">
              <h5 className="card-title">إجمالي الأرباح</h5>
              <p className="card-text fs-4">{totalProfit.toFixed(2)} ج</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-5 g-4">
        <div className="col-12 col-lg-8">
          <div className="card shadow h-100">
            <div className="card-body" style={{ minHeight: "350px" }}>
              <h5 className="card-title">مخطط المبيعات حسب الشهر</h5>
              <div style={{ height: "300px" }}>
                <Line data={salesData} options={salesOptions} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card shadow h-100">
            <div className="card-body">
              <h5 className="card-title">آخر العملاء</h5>
              <ul className="list-group">
                {latestClients.map(c => (
                  <li key={c.id} className="list-group-item">
                    {c.name} - {c.phone}
                  </li>
                ))}
                {latestClients.length === 0 && (
                  <li className="list-group-item text-muted">لا يوجد عملاء</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
