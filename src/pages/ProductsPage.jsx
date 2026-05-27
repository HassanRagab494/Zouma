import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";

// مكون الموديول الأساسي (تم تحديثه للدارك مود)
const TailwindModal = ({ show, onClose, title, children, footer }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 transition-all duration-300" dir="rtl">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-transparent dark:border-gray-700 transition-colors duration-300">
          <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-xl font-black text-gray-800 dark:text-white">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-2xl font-bold bg-gray-100 dark:bg-gray-800 w-8 h-8 rounded-full flex items-center justify-center pb-1 transition-colors">&times;</button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 text-right custom-scrollbar">{children}</div>
          {footer && (
            <div className="flex justify-end p-5 border-t border-gray-100 dark:border-gray-800 gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-2xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    );
};

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateProduct, setDuplicateProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    serial: "",
    name: "",
    wholesalePrice: "",
    sellingPrice: "",
    stock: "",
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "products"), orderBy("serial", "asc"));
      const querySnapshot = await getDocs(q);
      setProducts(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const executeSave = async (idToUpdate) => {
    try {
      const productData = {
        serial: Number(productForm.serial),
        name: productForm.name,
        wholesalePrice: Number(productForm.wholesalePrice),
        sellingPrice: Number(productForm.sellingPrice),
        stock: Number(productForm.stock), 
      };

      if (idToUpdate) {
        await updateDoc(doc(db, "products", idToUpdate), productData);
      } else {
        await addDoc(collection(db, "products"), productData);
      }
      
      closeAllAndRefresh();
    } catch (err) {
      alert("حدث خطأ أثناء الحفظ: " + err.message);
    }
  };

  const handleUpdateDuplicate = async () => {
    try {
      const combinedStock = Number(duplicateProduct.stock) + Number(productForm.stock);

      const updatedData = {
        serial: Number(duplicateProduct.serial), 
        name: productForm.name,
        wholesalePrice: Number(productForm.wholesalePrice), 
        sellingPrice: Number(productForm.sellingPrice),
        stock: combinedStock, 
      };

      await updateDoc(doc(db, "products", duplicateProduct.id), updatedData);
      closeAllAndRefresh();
    } catch (err) {
      alert("حدث خطأ أثناء التحديث: " + err.message);
    }
  };

  const closeAllAndRefresh = () => {
    setShowModal(false);
    setShowDuplicateModal(false);
    setProductForm({ serial: "", name: "", wholesalePrice: "", sellingPrice: "", stock: "" });
    setEditingId(null);
    setDuplicateProduct(null);
    fetchProducts();
  };

  const saveProduct = async () => {
    const existingProduct = products.find(
      (p) => p.name.trim() === productForm.name.trim()
    );

    if (existingProduct && existingProduct.id !== editingId) {
      setDuplicateProduct(existingProduct);
      setShowDuplicateModal(true); 
      return; 
    }
    await executeSave(editingId);
  };

  const deleteProduct = async (id, name) => {
    if (window.confirm(`هل أنت متأكد من حذف المنتج "${name}"؟`)) {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setProductForm(product);
      setEditingId(product.id);
    } else {
      const nextSerial = products.length > 0 ? Math.max(...products.map(p => p.serial)) + 1 : 1;
      setProductForm({ serial: nextSerial, name: "", wholesalePrice: "", sellingPrice: "", stock: "" });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.serial.toString().includes(searchTerm)
  );

  const lowStockCount = products.filter(p => p.stock <= 2).length;

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-[calc(100vh-100px)] transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-blue-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-xl font-bold animate-pulse text-blue-600 dark:text-blue-400">جارٍ جرد المخزون...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 min-h-screen transition-colors duration-300 bg-gray-50/50 dark:bg-gray-900 text-right" dir="rtl">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">المخزون <span className="text-blue-600 dark:text-blue-500">والبضاعة</span></h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1">إدارة المنتجات والتسعير</p>
          </div>
          <button onClick={() => openModal()} className="bg-blue-600 dark:bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 text-sm hover:bg-blue-700 transition-all whitespace-nowrap">
            + إضافة منتج جديد
          </button>
      </div>

      {lowStockCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-r-4 border-red-500 dark:border-red-500 text-red-700 dark:text-red-400 p-4 rounded-2xl mb-8 shadow-sm flex items-center gap-4 transition-colors duration-300">
            <span className="text-3xl animate-bounce">⚠️</span>
            <div>
                <p className="font-black text-lg mb-1">تنبيه هام بالنواقص!</p>
                <p className="text-sm font-bold">يوجد عدد <span className="font-black text-lg bg-red-200 dark:bg-red-800/50 text-red-900 dark:text-white px-2 py-0.5 rounded-md mx-1">{lowStockCount}</span> منتجات وصل مخزونها إلى 2 أو أقل، يرجى مراجعة الجدول.</p>
            </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 transition-colors duration-300">
          <input 
             type="text" 
             className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 text-right font-bold text-gray-800 dark:text-gray-100 placeholder-gray-400 transition-colors" 
             placeholder="ابحث باسم البضاعة أو رقم التسلسل..." 
             value={searchTerm} 
             onChange={(e) => setSearchTerm(e.target.value)} 
          />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right border-collapse min-w-[700px]">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                <tr>
                <th className="p-4 font-bold">التسلسل</th>
                <th className="p-4 font-bold">البضاعة (الاسم)</th>
                <th className="p-4 font-bold">سعر الجملة</th>
                <th className="p-4 font-bold">سعر البيع</th>
                <th className="p-4 font-bold">الكمية المتوفرة</th>
                <th className="p-4 font-bold text-center">الإجراءات</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                {filteredProducts.length === 0 ? (
                    <tr>
                        <td colSpan="6" className="text-center p-10 text-gray-400 dark:text-gray-500 font-bold">
                            <span className="text-3xl block mb-2">📦</span>
                            لا توجد منتجات مطابقة للبحث
                        </td>
                    </tr>
                ) : (
                    filteredProducts.map((p) => (
                    <tr key={p.id} className={`transition-colors ${p.stock <= 2 ? 'bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                        <td className="p-4 font-sans font-bold text-gray-400 dark:text-gray-500">#{p.serial}</td>
                        <td className="p-4 font-bold text-gray-800 dark:text-gray-200">{p.name}</td>
                        <td className="p-4 font-bold text-orange-600 dark:text-orange-400">{p.wholesalePrice} ج</td>
                        <td className="p-4 font-black text-green-600 dark:text-green-400">{p.sellingPrice} ج</td>
                        <td className="p-4">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-black shadow-sm border ${
                            p.stock <= 0 
                            ? 'bg-red-600 border-red-600 text-white' 
                            : p.stock <= 2 
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/50' 
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/50'
                        }`}>
                            {p.stock} حبة
                        </span>
                        </td>
                        <td className="p-4 flex justify-center gap-2">
                        <button onClick={() => openModal(p)} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all">تعديل</button>
                        <button onClick={() => deleteProduct(p.id, p.name)} className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-all">حذف</button>
                        </td>
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* ------------------ مودال إضافة وتعديل منتج ------------------ */}
      <TailwindModal show={showModal} onClose={() => setShowModal(false)} title={editingId ? "تعديل بيانات منتج" : "إضافة منتج جديد"}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">التسلسل (تلقائي)</label>
              <input type="number" className="w-full border-2 border-gray-100 dark:border-gray-700 p-3 rounded-xl outline-none font-bold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 transition-colors" value={productForm.serial} onChange={(e) => setProductForm({ ...productForm, serial: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400 mb-1.5 block">اسم البضاعة</label>
              <input className="w-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-xl outline-none font-black text-gray-800 dark:text-white focus:border-blue-500 dark:focus:border-blue-500 transition-colors" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="مثال: جراب أيفون 13" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t dark:border-gray-800 pt-5">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-orange-600 dark:text-orange-400 mb-1.5 block">سعر الجملة</label>
              <input type="number" className="w-full border-2 border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 rounded-xl outline-none text-center font-bold text-gray-800 dark:text-gray-200 focus:border-orange-400 transition-colors" value={productForm.wholesalePrice} onChange={(e) => setProductForm({ ...productForm, wholesalePrice: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-green-600 dark:text-green-400 mb-1.5 block">سعر البيع</label>
              <input type="number" className="w-full border-2 border-green-200 dark:border-green-800/50 p-3 rounded-xl outline-none text-center font-black text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/10 focus:border-green-500 transition-colors" value={productForm.sellingPrice} onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400 mb-1.5 block">الكمية (المخزون)</label>
              <input type="number" className="w-full border-2 border-blue-200 dark:border-blue-800/50 p-3 rounded-xl outline-none text-center font-black text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 focus:border-blue-500 transition-colors" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
            </div>
          </div>
          <button onClick={saveProduct} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 mt-4 hover:bg-blue-700 transition-all text-sm tracking-wide">
            حفظ المنتج في المخزن
          </button>
        </div>
      </TailwindModal>

      {/* ------------------ مودال التحذير من تكرار المنتج ------------------ */}
      <TailwindModal 
        show={showDuplicateModal} 
        onClose={() => setShowDuplicateModal(false)} 
        title="تنبيه: منتج مكرر!"
        footer={
            <>
                <button onClick={() => setShowDuplicateModal(false)} className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 text-sm transition-colors">
                    إلغاء
                </button>
                <button onClick={handleUpdateDuplicate} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 text-sm shadow-md transition-colors">
                    نعم، دمج مع المنتج
                </button>
            </>
        }
      >
        <div className="py-2">
            <p className="text-gray-700 dark:text-gray-200 font-bold text-lg">المنتج <strong className="text-blue-600 dark:text-blue-400">"{productForm.name}"</strong> موجود بالفعل في المخزون!</p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl mt-5 border border-blue-100 dark:border-blue-800/50 transition-colors">
                <p className="text-gray-800 dark:text-white font-black mb-3 text-sm">إذا قمت بالدمج سيحدث التالي:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-2 font-medium">
                    <li>سيتم جمع الكمية المدخلة (<span className="font-bold text-green-600 dark:text-green-400">{productForm.stock}</span>) مع المتوفرة حالياً (<span className="font-bold text-blue-600 dark:text-blue-400">{duplicateProduct?.stock}</span>).</li>
                    <li>الإجمالي الجديد سيصبح: <span className="font-black bg-green-200 dark:bg-green-800/50 px-2 py-0.5 rounded text-green-900 dark:text-white mx-1">{Number(productForm.stock) + Number(duplicateProduct?.stock)}</span>حبة.</li>
                    <li>سيتم تحديث الأسعار (سعر البيع والجملة) لتطابق المدخلات الجديدة.</li>
                </ul>
            </div>
        </div>
      </TailwindModal>

    </div>
  );
}

export default ProductsPage;
