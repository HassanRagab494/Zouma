import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FaBell, FaGift, FaCalendarCheck, FaShoppingCart } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "clients"));
        const clients = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        generateNotifications(clients);
      } catch (err) {
        console.error(err);
      }
    };

    const generateNotifications = (clients) => {
      const today = new Date().toISOString().split("T")[0];
      const notes = [];
      clients.forEach((client) => {
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
        (client.orders || []).forEach((order) => {
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

  const filteredNotifications = notifications.filter(
    (n) =>
      (filterType === "all" || n.type === filterType) &&
      n.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (note) => {
    if (note.type === "birthday")
      return (
        <a
          href={`https://wa.me/${note.phone}?text=${encodeURIComponent(
            `كل سنة وانت طيب يا ${note.text.replace("اليوم عيد ميلاد ", "")}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-yellow-500 mr-2"
        >
          <FaGift />
        </a>
      );
    if (note.type === "anniversary") return <FaCalendarCheck className="text-blue-500 mr-2" />;
    if (note.type === "order") return <FaShoppingCart className="text-green-500 mr-2" />;
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1030] bg-[#f5f5dc] text-black shadow-sm h-[57px] flex items-center px-3 justify-between">
      <img
        src="https://f.top4top.io/p_3528e1g670.png"
        alt="Logo"
        className="h-10 object-contain"
      />

      <div className="flex items-center gap-2">
        <div className="relative cursor-pointer" onClick={() => setShowModal(true)}>
          <FaBell size={24} />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
              {notifications.length}
            </span>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded"
        >
          تسجيل خروج
        </button>
      </div>

      {/* مودال الإشعارات */}
      {showModal && (
        <div className="fixed inset-0 z-[1050] bg-black/50 flex justify-center items-start sm:items-center overflow-auto pt-20 sm:pt-0"> {/* z-index: 1050 */}
          <div className="bg-white rounded-lg w-full max-w-3xl p-4 md:p-6 mx-2 sm:mx-0">
            <div className="flex flex-col items-start mb-4">
              <h5 className="text-lg font-semibold mb-2">الإشعارات</h5>
              <div className="flex flex-wrap gap-2 mb-2">
                {["all", "order", "birthday", "anniversary"].map((type) => (
                  <button
                    key={type}
                    className={`text-sm px-2 py-1 rounded ${
                      filterType === type
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 text-gray-700"
                    }`}
                    onClick={() => setFilterType(type)}
                  >
                    {type === "all"
                      ? "الكل"
                      : type === "order"
                      ? "أوردرات"
                      : type === "birthday"
                      ? "أعياد الميلاد"
                      : "ذكرى أول شراء"}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="ابحث في الإشعارات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              />
            </div>
            <div className="flex flex-col gap-2">
              {filteredNotifications.length === 0 && (
                <p className="text-gray-500">لا توجد إشعارات</p>
              )}
              {filteredNotifications.map((note, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded shadow-sm border-l-4 ${
                    note.type === "order"
                      ? "border-green-500"
                      : note.type === "birthday"
                      ? "border-yellow-500"
                      : "border-blue-500"
                  }`}
                >
                  <div className="flex items-center">{getIcon(note)}<span>{note.text}</span></div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-black px-3 py-1 rounded"
                onClick={() => setShowModal(false)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;