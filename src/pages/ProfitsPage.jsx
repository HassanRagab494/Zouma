// src/ProfitsPage.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "bootstrap/dist/css/bootstrap.min.css";

function ProfitsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "clients"));
      const clientsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsList);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // جمع كل الأوردرات
  const allOrders = clients.flatMap(c => (c.orders || []));

  // تطبيق فلتر حسب التاريخ
  const filteredOrders = filterDate
    ? allOrders.filter(o => o.date === filterDate)
    : allOrders;

  // حساب الأرباح
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalCost = filteredOrders.reduce((sum, o) => sum + (o.cost || 0), 0);
  const totalProfit = filteredOrders.reduce((sum, o) => sum + (o.profit || 0), 0);
  const totalDiscount = filteredOrders.reduce((sum, o) => sum + (o.discount || 0), 0);

  if (loading) return <p className="text-center mt-5">جارٍ تحميل البيانات...</p>;
  if (error) return <p className="text-danger text-center mt-5">{error}</p>;

  return (
    <div className="container mt-4">
      <h1 className="mb-4 text-center">صفحة الأرباح</h1>

      {/* فلتر حسب التاريخ */}
      <div className="mb-4 d-flex justify-content-start align-items-center">
        <label className="me-2">فلتر حسب التاريخ:</label>
        <input
          type="date"
          className="form-control w-auto"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
        />
        <button className="btn btn-secondary ms-2" onClick={() => setFilterDate("")}>مسح الفلتر</button>
      </div>

      {/* كارتات الملخص */}
      <div className="row mb-4">
        <div className="col-md-3 mb-2">
          <div className="card text-white bg-primary shadow-sm">
            <div className="card-body">
              <h5 className="card-title">إجمالي الإيرادات</h5>
              <p className="card-text fs-4">{totalRevenue.toFixed(2)} ج</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-2">
          <div className="card text-white bg-success shadow-sm">
            <div className="card-body">
              <h5 className="card-title">إجمالي الربح</h5>
              <p className="card-text fs-4">{totalProfit.toFixed(2)} ج</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-2">
          <div className="card text-white bg-warning shadow-sm">
            <div className="card-body">
              <h5 className="card-title">إجمالي التكلفة</h5>
              <p className="card-text fs-4">{totalCost.toFixed(2)} ج</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-2">
          <div className="card text-white bg-danger shadow-sm">
            <div className="card-body">
              <h5 className="card-title">إجمالي الخصومات</h5>
              <p className="card-text fs-4">{totalDiscount.toFixed(2)} ج</p>
            </div>
          </div>
        </div>
      </div>

      {/* جدول الأوردرات */}
      <div className="table-responsive shadow-sm">
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>اسم العميل</th>
              <th>الطلب</th>
              <th>تكلفة البضاعة</th>
              <th>المكسب</th>
              <th>الخصم</th>
              <th>السعر الكلي</th>
              <th>تاريخ الأوردر</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, idx) => {
                const client = clients.find(c => (c.orders || []).includes(order));
                return (
                  <tr key={idx}>
                    <td>{client?.name || "-"}</td>
                    <td>{order.name}</td>
                    <td>{order.cost?.toFixed(2)}</td>
                    <td>{order.profit?.toFixed(2)}</td>
                    <td>{order.discount?.toFixed(2)}</td>
                    <td>{order.total?.toFixed(2)}</td>
                    <td>{order.date}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-muted">لا توجد بيانات</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProfitsPage;
