import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FaBell, FaGift, FaCalendarCheck, FaShoppingCart, FaBoxOpen } from "react-icons/fa"; // <-- تمت إضافة أيقونة الصندوق للإشعار
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    // دالة واحدة تجلب العملاء والمنتجات معاً
    const fetchData = async () => {
      try {
        const [clientsSnapshot, productsSnapshot] = await Promise.all([
          getDocs(collection(db, "clients")),
          getDocs(collection(db, "products"))
        ]);

        const clients = clientsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const products = productsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        
        generateNotifications(clients, products);
      } catch (err) {
        console.error(err);
      }
    };

    const generateNotifications = (clients, products) => {
      const today = new Date().toISOString().split("T")[0];
      const notes = [];

      // إشعارات العملاء والأوردرات
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
            notes.push({ type: "order", text: `يوجد أوردر جديد: ${order.name || "طلب"} للعميل ${client.name}` });
          }
        });
      });

      // <--- إضافة إشعارات نواقص المخزون --->
      products.forEach((product) => {
        if (product.stock <= 5) {
          notes.push({ 
             type: "stock", 
             text: `نواقص: "${product.name}" وصل مخزونه إلى ${product.stock} حبة فقط!` 
          });
        }
      });

      setNotifications(notes);
    };

    fetchData();
    // تحديث البيانات كل 30 ثانية
    const interval = setInterval(fetchData, 30000);
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
    // <--- أيقونة تحذير المخزون --->
    if (note.type === "stock") return <FaBoxOpen className="text-red-600 mr-2 animate-pulse" />;
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  return (
    <>
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
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full shadow">
                {notifications.length}
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 font-bold text-white text-sm px-3 py-1 rounded transition-colors"
          >
            تسجيل خروج
          </button>
        </div>

        {/* مودال الإشعارات */}
        {showModal && (
          <div className="fixed inset-0 z-[1050] bg-black/50 flex justify-center items-start sm:items-center overflow-auto pt-20 sm:pt-0" dir="rtl">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-4 md:p-6 mx-2 sm:mx-0">
              <div className="flex flex-col items-start mb-4 border-b pb-4">
                <div className="flex justify-between w-full items-center mb-3">
                   <h5 className="text-xl font-black text-gray-800">مركز الإشعارات</h5>
                   <button className="text-gray-400 hover:text-red-500 text-2xl font-bold" onClick={() => setShowModal(false)}>&times;</button>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3 w-full">
                  {/* <--- تمت إضافة زر فلترة للمخزون ---> */}
                  {["all", "order", "stock", "birthday", "anniversary"].map((type) => (
                    <button
                      key={type}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition-all ${
                        filterType === type
                          ? "bg-gray-800 text-white shadow-md"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      onClick={() => setFilterType(type)}
                    >
                      {type === "all"
                        ? "الكل"
                        : type === "order"
                        ? "🛒 الأوردرات"
                        : type === "stock"
                        ? "⚠️ المخزون"
                        : type === "birthday"
                        ? "🎂 أعياد الميلاد"
                        : "📅 ذكرى الشراء"}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="ابحث في الإشعارات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 font-bold text-gray-700"
                />
              </div>

              <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-2">
                {filteredNotifications.length === 0 && (
                  <p className="text-gray-400 font-bold text-center py-8">لا توجد إشعارات حالياً</p>
                )}
                {filteredNotifications.map((note, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg shadow-sm border-r-4 transition-all hover:translate-x-1 ${
                      note.type === "order"
                        ? "border-green-500 bg-green-50"
                        : note.type === "stock"
                        ? "border-red-600 bg-red-50"
                        : note.type === "birthday"
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-blue-500 bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center text-sm font-bold text-gray-700">
                        {getIcon(note)}
                        <span className="mt-0.5">{note.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="h-[57px] w-full shrink-0"></div>
    </>
  );
};

export default Navbar;