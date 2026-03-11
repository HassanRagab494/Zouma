import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";


const TailwindModal = ({ show, onClose, title, children, footer }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
          </div>
          <div className="p-4 overflow-y-auto flex-1 text-right">{children}</div>
          {footer && (
            <div className="flex justify-end p-4 border-t border-gray-200 gap-2">
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
        stock: Number(productForm.stock), // استبدال الكمية بالمدخلة
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

  if (loading) return <div className="text-center py-20 font-bold">جاري تحميل المخزون...</div>;

  return (
    <div className="container mx-auto px-4 py-8 text-right" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold uppercase italic text-gray-800">المخزون <span className="text-blue-600">والبضاعة</span></h1>
        <button onClick={() => openModal()} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg text-lg hover:bg-green-700 transition-all whitespace-nowrap">
          + إضافة منتج
        </button>
      </div>

      {lowStockCount > 0 && (
        <div className="bg-red-50 border-r-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 shadow-sm flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
                <p className="font-bold">تنبيه هام بالنواقص!</p>
                <p className="text-sm">يوجد عدد <span className="font-black text-lg bg-red-200 px-2 rounded">{lowStockCount}</span> منتجات وصل مخزونها إلى 2 أو أقل، يرجى مراجعة الجدول المظلل باللون الأحمر.</p>
            </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
          <input 
             type="text" 
             className="w-full border-2 border-gray-100 p-3 rounded-lg outline-none focus:border-blue-400 text-right font-bold text-gray-700" 
             placeholder="ابحث باسم البضاعة أو رقم التسلسل..." 
             value={searchTerm} 
             onChange={(e) => setSearchTerm(e.target.value)} 
          />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse min-w-[600px]">
            <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm border-b">
                <th className="p-4 font-bold">التسلسل</th>
                <th className="p-4 font-bold">البضاعة (الاسم)</th>
                <th className="p-4 font-bold">سعر الجملة</th>
                <th className="p-4 font-bold">سعر البيع</th>
                <th className="p-4 font-bold">الكمية المتوفرة</th>
                <th className="p-4 font-bold text-center">الإجراءات</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {filteredProducts.length === 0 ? (
                    <tr>
                        <td colSpan="6" className="text-center p-8 text-gray-400 font-bold">لا توجد منتجات مطابقة للبحث</td>
                    </tr>
                ) : (
                    filteredProducts.map((p) => (
                    <tr key={p.id} className={`transition-colors ${p.stock <= 2 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                        <td className="p-4 font-bold text-gray-500">#{p.serial}</td>
                        <td className="p-4 font-bold text-blue-700">{p.name}</td>
                        <td className="p-4 font-bold text-gray-600">{p.wholesalePrice} ج</td>
                        <td className="p-4 font-bold text-green-700">{p.sellingPrice} ج</td>
                        <td className="p-4">
                        <span className={`px-3 py-1 rounded-md text-xs font-black shadow-sm ${p.stock <= 0 ? 'bg-red-600 text-white' : p.stock <= 2 ? 'bg-red-200 text-red-800' : 'bg-green-100 text-green-700'}`}>
                            {p.stock} حبة
                        </span>
                        </td>
                        <td className="p-4 flex justify-center gap-3">
                        <button onClick={() => openModal(p)} className="bg-blue-100 text-blue-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-200 transition-all">تعديل</button>
                        <button onClick={() => deleteProduct(p.id, p.name)} className="bg-red-100 text-red-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-200 transition-all">حذف</button>
                        </td>
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>

      <TailwindModal show={showModal} onClose={() => setShowModal(false)} title={editingId ? "تعديل منتج" : "إضافة منتج جديد"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1 block">التسلسل</label>
              <input type="number" className="w-full border p-3 rounded-xl outline-none font-bold text-gray-700 bg-gray-50" value={productForm.serial} onChange={(e) => setProductForm({ ...productForm, serial: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1 block">اسم البضاعة</label>
              <input className="w-full border p-3 rounded-xl outline-none font-bold text-gray-800 focus:border-blue-400" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t pt-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1 block">سعر الجملة</label>
              <input type="number" className="w-full border p-3 rounded-xl outline-none text-center font-bold text-gray-600 focus:border-blue-400" value={productForm.wholesalePrice} onChange={(e) => setProductForm({ ...productForm, wholesalePrice: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-green-600 mb-1 block">سعر البيع</label>
              <input type="number" className="w-full border border-green-200 p-3 rounded-xl outline-none text-center font-bold text-green-700 bg-green-50 focus:border-green-400" value={productForm.sellingPrice} onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider font-bold text-blue-600 mb-1 block">الكمية (المخزون)</label>
              <input type="number" className="w-full border border-blue-200 p-3 rounded-xl outline-none text-center font-bold text-blue-700 bg-blue-50 focus:border-blue-400" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
            </div>
          </div>
          <button onClick={saveProduct} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg mt-6 hover:bg-blue-700 transition-all text-lg tracking-wide">حفظ المنتج</button>
        </div>
      </TailwindModal>

      <TailwindModal 
        show={showDuplicateModal} 
        onClose={() => setShowDuplicateModal(false)} 
        title="تنبيه: منتج مكرر!"
        footer={
            <>
                <button onClick={() => setShowDuplicateModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300">
                    إلغاء التعديل
                </button>
                <button onClick={handleUpdateDuplicate} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
                    نعم، دمج مع المنتج الموجود
                </button>
            </>
        }
      >
        <div className="py-2">
            <p className="text-gray-700 text-lg">المنتج <strong className="text-blue-700">"{productForm.name}"</strong> موجود بالفعل في المخزون!</p>
            
            <div className="bg-blue-50 p-4 rounded-lg mt-4 border border-blue-100">
                <p className="text-gray-800 font-bold mb-2">إذا قمت بالدمج سيحدث التالي:</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>سيتم جمع الكمية التي أدخلتها (<span className="font-bold text-green-600">{productForm.stock}</span>) مع الكمية المتوفرة حالياً (<span className="font-bold text-blue-600">{duplicateProduct?.stock}</span>) ليصبح الإجمالي <span className="font-black text-lg bg-green-200 px-2 rounded text-black">{Number(productForm.stock) + Number(duplicateProduct?.stock)}</span>.</li>
                    <li>سيتم تحديث الأسعار (سعر البيع والجملة) لتطابق الأسعار التي قمت بإدخالها الآن.</li>
                </ul>
            </div>
        </div>
      </TailwindModal>

    </div>
  );
}

export default ProductsPage;
