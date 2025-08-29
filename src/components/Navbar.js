import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Bell, Gift, CalendarCheck, Cart } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";

function Navbar({ toggleSidebar }) {
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "clients"));
        const clients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        generateNotifications(clients);
      } catch (err) {
        console.error(err);
      }
    };

    const generateNotifications = (clients) => {
      const today = new Date().toISOString().split("T")[0];
      const notes = [];
      clients.forEach(client => {
        if (client.birthDate === today) {
          notes.push({ type: "birthday", text: `اليوم عيد ميلاد ${client.name}`, phone: client.phone || "" });
        }
        if (client.firstPurchaseDate) {
          const firstPurchase = new Date(client.firstPurchaseDate);
          const oneYearLater = new Date(firstPurchase);
          oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
          if (oneYearLater.toISOString().split("T")[0] === today) {
            notes.push({ type: "anniversary", text: `مر سنة على أول شراء للعميل ${client.name}` });
          }
        }
        (client.orders || []).forEach(order => {
          if (order.date === today) {
            notes.push({ type: "order", text: `يوجد أوردر جديد: ${order.name} للعميل ${client.name}` });
          }
        });
      });
      setNotifications(notes);
    };

    fetchClients();
    const interval = setInterval(fetchClients, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredNotifications = notifications.filter(n =>
    (filterType === "all" || n.type === filterType) &&
    n.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (note) => {
    if (note.type === "birthday") return (
      <a href={`https://wa.me/${note.phone}?text=كل سنة وانت طيب ${encodeURIComponent(note.text)}`} target="_blank" rel="noopener noreferrer">
        <Gift className="text-warning me-2" />
      </a>
    );
    if (note.type === "anniversary") return <CalendarCheck className="text-info me-2" />;
    if (note.type === "order") return <Cart className="text-success me-2" />;
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated"); 
    navigate("/login"); 
  };

  return (
    <>
      <nav
        className="navbar shadow-sm px-3 d-flex justify-content-between"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1030,
          background: "#f5f5dc",
          color: "#000",
        }}
      >
        {/* زرار القائمة يظهر بس على الموبايل */}
        <button
          className="btn btn-light d-md-none me-2"
          onClick={toggleSidebar}
        >
          <FaBars />
        </button>

        {/* اللوجو */}
        <img 
          src="https://f.top4top.io/p_3528e1g670.png" 
          alt="Logo" 
          className="img-fluid"
          style={{ maxHeight: "40px", objectFit: "contain" }} 
        />

        {/* الأزرار */}
        <div className="d-flex align-items-center gap-2">
          <div className="position-relative" style={{ cursor: "pointer" }} onClick={() => setShowModal(true)}>
            <Bell size={24} />
            {notifications.length > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {notifications.length}
              </span>
            )}
          </div>
          <button onClick={handleLogout} className="btn btn-danger btn-sm">
            تسجيل خروج
          </button>
        </div>
      </nav>

      <div style={{ paddingTop: "70px" }} />

      {/* المودال */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-scrollable modal-lg modal-fullscreen-sm-down">
            <div className="modal-content">
              <div className="modal-header d-flex flex-column align-items-start">
                <h5 className="modal-title mb-2">الإشعارات</h5>
                <div className="btn-group mb-2 flex-wrap">
                  {["all", "order", "birthday", "anniversary"].map(type => (
                    <button
                      key={type}
                      className={`btn btn-sm ${filterType === type ? "btn-primary" : "btn-outline-secondary"}`}
                      onClick={() => setFilterType(type)}
                    >
                      {type === "all" ? "الكل" : type === "order" ? "أوردرات" : type === "birthday" ? "أعياد الميلاد" : "ذكرى أول شراء"}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ابحث في الإشعارات..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="modal-body">
                {filteredNotifications.length === 0 && <p className="text-muted">لا توجد إشعارات</p>}
                <div className="d-flex flex-column gap-2 text-wrap">
                  {filteredNotifications.map((note, idx) => (
                    <div key={idx} className={`card p-2 shadow-sm ${note.type === "order" ? "border-success" : note.type === "birthday" ? "border-warning" : "border-info"}`}>
                      <div className="d-flex align-items-center">
                        {getIcon(note)}
                        <span>{note.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>إغلاق</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
