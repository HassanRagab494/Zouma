import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { FaBell, FaGift, FaCalendarCheck, FaShoppingCart, FaBoxOpen, FaMoon, FaSun } from "react-icons/fa"; // تمت إضافة أيقونات القمر والشمس
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const navigate = useNavigate();

  // ستيت للدارك مود
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // التحقق من حالة الدارك مود الحالية عند تحميل النافبار
    setIsDarkMode(document.documentElement.classList.contains("dark"));

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
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // دالة تبديل الدارك مود
  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (html.classList.contains("dark")) {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

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
    if (note.type === "stock") return <FaBoxOpen className="text-red-600 mr-2 animate-pulse" />;
    return null;
  };

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  return (
    <>
      {/* تم إضافة dark:bg-gray-800 و dark:text-white */}
      <nav className="fixed top-0 left-0 right-0 z-[1030] bg-[#f5f5dc] dark:bg-gray-800 text-black dark:text-white shadow-sm h-[57px] flex items-center px-4 justify-between transition-colors duration-300">
        
        {/* اللوجو يفضل أن يكون له ظل خفيف أو فلتر أبيض في الدارك مود إذا لزم الأمر */}
        <img
          src="https://f.top4top.io/p_3528e1g670.png"
          alt="Logo"
          className="h-10 object-contain drop-shadow-sm"
        />

        <div className="flex items-center gap-4">
          
          {/* زر تبديل الدارك مود */}
          <button 
            onClick={toggleDarkMode} 
            className="text-gray-600 dark:text-yellow-400 hover:text-gray-900 dark:hover:text-yellow-300 transition-colors"
            title={isDarkMode ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الليلي"}
          >
            {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>

          <div className="relative cursor-pointer text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors" onClick={() => setShowModal(true)}>
            <FaBell size={22} />
            {notifications.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full shadow border-2 border-[#f5f5dc] dark:border-gray-800">
                {notifications.length}
              </span>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 font-bold text-white text-xs px-4 py-1.5 rounded-lg shadow-sm transition-all"
          >
            خروج
          </button>
        </div>

        {/* مودال الإشعارات */}
        {showModal && (
          <div className="fixed inset-0 z-[1050] bg-black/60 backdrop-blur-sm flex justify-center items-start sm:items-center overflow-auto pt-20 sm:pt-0 transition-all" dir="rtl">
            {/* ألوان المودال في الدارك مود */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl p-4 md:p-6 mx-2 sm:mx-0 border dark:border-gray-700 transition-colors duration-300">
              <div className="flex flex-col items-start mb-4 border-b dark:border-gray-700 pb-4">
                <div className="flex justify-between w-full items-center mb-4">
                   <h5 className="text-xl font-black text-gray-800 dark:text-gray-100">مركز الإشعارات</h5>
                   <button className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-2xl font-bold bg-gray-100 dark:bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center pb-1" onClick={() => setShowModal(false)}>&times;</button>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4 w-full">
                  {["all", "order", "stock", "birthday", "anniversary"].map((type) => (
                    <button
                      key={type}
                      className={`text-[11px] font-bold px-4 py-1.5 rounded-full transition-all border ${
                        filterType === type
                          ? "bg-gray-800 dark:bg-blue-600 text-white border-transparent shadow-md"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setFilterType(type)}
                    >
                      {type === "all" ? "الكل" : type === "order" ? "🛒 الأوردرات" : type === "stock" ? "⚠️ المخزون" : type === "birthday" ? "🎂 أعياد الميلاد" : "📅 ذكرى الشراء"}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="ابحث في الإشعارات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 dark:focus:border-blue-500 font-bold text-gray-700 dark:text-gray-200 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {filteredNotifications.length === 0 && (
                  <p className="text-gray-400 dark:text-gray-500 font-bold text-center py-10 text-lg">لا توجد إشعارات حالياً</p>
                )}
                {filteredNotifications.map((note, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl shadow-sm border-r-4 transition-all hover:-translate-x-1 ${
                      note.type === "order"
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : note.type === "stock"
                        ? "border-red-600 bg-red-50 dark:bg-red-900/20"
                        : note.type === "birthday"
                        ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                        : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    }`}
                  >
                    <div className="flex items-center text-sm font-bold text-gray-700 dark:text-gray-200">
                        <span className="text-lg bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm mr-3 ml-2 border dark:border-gray-700">{getIcon(note)}</span>
                        <span className="mt-1 leading-relaxed">{note.text}</span>
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
