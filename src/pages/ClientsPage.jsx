import React, { useEffect, useState } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "bootstrap/dist/css/bootstrap.min.css";
import { Modal, Button } from "react-bootstrap";
import { FaWhatsapp, FaPhone } from "react-icons/fa";

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => { fetchClients(); }, []);

  const fetchClients = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "clients"));
      const clientsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClients(clientsList);
    } catch (err) {
      console.error(err); setError(err.message);
    } finally { setLoading(false); }
  };

  const handleDeleteClient = async (clientId) => {
    if (!window.confirm("هل أنت متأكد أنك تريد حذف هذا العميل؟")) return;
    try {
      await deleteDoc(doc(db, "clients", clientId));
      setClients(prev => prev.filter(c => c.id !== clientId));
    } catch (err) { console.error(err); alert("حدث خطأ أثناء حذف العميل"); }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.code && c.code.includes(searchTerm))
  );

  const getTotalOrdersAmount = (orders) => (orders || []).reduce((sum, o) => sum + (o.total || 0), 0);

  if (loading) return <p className="text-center mt-5">جارٍ تحميل البيانات...</p>;
  if (error) return <p className="text-danger text-center mt-5">{error}</p>;

  const countryCode = "+20"; 

  return (
    <div className="container mt-4">
      <h1 className="mb-4 text-center">لوحة العملاء</h1>
      <p className="text-end">إجمالي العملاء: <strong>{clients.length}</strong></p>

      <input
        type="text"
        className="form-control mb-4"
        placeholder="ابحث باسم، رقم الهاتف أو الكود..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />

      {filteredClients.length > 0 ? filteredClients.map(client => {
        const totalOrdersAmount = getTotalOrdersAmount(client.orders);
        return (
          <div
            key={client.id}
            className="card mb-3 shadow-sm"
            style={{
              cursor: "pointer",
              borderRadius: "10px",
              transition: "0.3s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            onClick={() => setSelectedClient(client)}
          >
            <div className="card-body d-flex flex-wrap justify-content-between align-items-center">
              <div className="mb-2 mb-md-0">
                <strong>{client.name}</strong>
                <p className="mb-0">الهاتف: {client.phone}</p>
                <p className="mb-0">إجمالي المشتريات: <strong className="text-success">{totalOrdersAmount.toFixed(2)} ج</strong></p>
              </div>
              <div className="d-flex flex-wrap align-items-center gap-3">
                {client.phone && (
                  <a
                    href={`https://wa.me/${countryCode}${client.phone.replace(/^0/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-success fs-5"
                    title="واتساب"
                  >
                    <FaWhatsapp />
                  </a>
                )}
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="text-primary fs-5"
                    title="اتصال"
                  >
                    <FaPhone />
                  </a>
                )}
                <span className="badge bg-primary fs-6">{client.code}</span>
              </div>
            </div>
          </div>
        );
      }) : (
        <div className="alert alert-info text-center mt-5">لا يوجد عملاء لعرضهم أو لا توجد نتائج للبحث.</div>
      )}

      {/* مودال تفاصيل العميل */}
      <Modal show={!!selectedClient} onHide={() => setSelectedClient(null)} size="lg">
        <Modal.Header closeButton><Modal.Title>تفاصيل العميل</Modal.Title></Modal.Header>
        <Modal.Body>
          {selectedClient && <>
            <p><strong>الاسم:</strong> {selectedClient.name}</p>
            <p><strong>الهاتف:</strong> {selectedClient.phone}</p>
            <p><strong>العنوان:</strong> {selectedClient.address || "غير محدد"}</p>
            {selectedClient.birthDate && <p><strong>تاريخ الميلاد:</strong> {new Date(selectedClient.birthDate).toLocaleDateString()}</p>}
            {selectedClient.firstPurchaseDate && <p><strong>أول شراء:</strong> {new Date(selectedClient.firstPurchaseDate).toLocaleDateString()}</p>}

            <h5 className="mt-3">تفاصيل الأوردرات:</h5>
            {selectedClient.orders && selectedClient.orders.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-bordered table-hover table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>الطلب</th>
                      <th>تكلفة البضاعة</th>
                      <th>المكسب</th>
                      <th>السعر الكلي</th>
                      <th>تاريخ الطلب</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClient.orders.map((order, idx) => (
                      <tr key={idx}>
                        <td>{order.name || 'غير محدد'}</td>
                        <td>{order.cost?.toFixed(2)}</td>
                        <td>{order.profit?.toFixed(2)}</td>
                        <td>{order.total?.toFixed(2)}</td>
                        <td>{order.date ? new Date(order.date).toLocaleDateString() : 'غير محدد'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-muted">لا يوجد أوردرات لهذا العميل حتى الآن.</p>}
          </>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={() => { handleDeleteClient(selectedClient.id); setSelectedClient(null); }}>حذف العميل</Button>
          <Button variant="secondary" onClick={() => setSelectedClient(null)}>إغلاق</Button>
        </Modal.Footer>
      </Modal>

      {/* CSS للريسبونسيف */}
      <style>
        {`
          @media (max-width: 768px) {
            .card-body {
              flex-direction: column !important;
              align-items: flex-start !important;
            }
            .card-body .d-flex {
              width: 100%;
              justify-content: flex-start !important;
            }
          }
        `}
      </style>
    </div>
  );
}

export default ClientsPage;
