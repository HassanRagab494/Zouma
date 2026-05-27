import React, { useRef } from "react";
import html2canvas from "html2canvas";
import TailwindModal from "./TailwindModal";
import InvoicePreview from "./InvoicePreview";
import { ORDER_STATUSES } from "../../constants/orderStatuses";

const OrderModal = ({ show, onClose, orderForm, setOrderForm, onSave, currentClientId, clients, availableProducts }) => {
  const invoiceRef = useRef(null);

  const subTotal = orderForm.items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
  const finalTotal = (subTotal * (1 - (parseFloat(orderForm.discountPercentage || 0) / 100))).toFixed(2);
  const remaining = (parseFloat(finalTotal) - parseFloat(orderForm.paidAmount || 0)).toFixed(2);
  const currentClient = clients.find((c) => c.id === currentClientId);

  const handleDownloadImage = async () => {
    if (invoiceRef.current) {
      const canvas = await html2canvas(invoiceRef.current);
      const link = document.createElement("a");
      link.download = `Invoice_Zouma_${currentClientId}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handlePrint = () => {
    if (invoiceRef.current) {
      const printContent = invoiceRef.current.innerHTML;
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html dir="rtl">
          <head>
            <title>Zouma Invoice - Print</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { font-family: sans-serif; padding: 20px; background: white; color: black; }
              @media print { body { padding: 0; } }
            </style>
          </head>
          <body onload="window.print();window.close()">
            <div class="max-w-sm mx-auto border-2 border-dashed border-gray-400 p-6 rounded-xl">
              ${printContent}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const footer = (
    <div className="flex gap-3 w-full font-bold">
      <button onClick={handlePrint} className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-xl flex-1 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all text-sm">طباعة 🖨️</button>
      <button onClick={handleDownloadImage} className="bg-gray-800 dark:bg-gray-600 text-white px-4 py-3 rounded-xl flex-1 hover:bg-black dark:hover:bg-gray-500 transition-all text-sm">تحميل 📸</button>
      <button onClick={onSave} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl flex-[2] shadow-md transition-all text-sm">حفظ الفاتورة ✅</button>
    </div>
  );

  return (
    <TailwindModal show={show} onClose={onClose} title="إنشاء / تعديل أوردر" footer={footer}>
      <div className="space-y-6">

        {/* حالة الأوردر */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
          <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mb-3 block uppercase tracking-widest">تحديد حالة الأوردر الحالية</label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(ORDER_STATUSES).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setOrderForm({ ...orderForm, status: key })}
                className={`p-2.5 rounded-xl text-[11px] font-black transition-all border-2 ${
                  orderForm.status === key
                    ? `${info.color} text-white border-transparent shadow-md scale-105`
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                {info.label}
              </button>
            ))}
          </div>
        </div>

        {/* قائمة الأصناف */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-center mb-5 border-b dark:border-gray-700 pb-3">
            <button
              onClick={() => setOrderForm((prev) => ({ ...prev, items: [...prev.items, { productId: "", name: "", price: "", qty: 1, searchQuery: "", showDropdown: false }] }))}
              className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 px-4 py-1.5 rounded-lg text-sm font-black transition-colors"
            >
              + صنف آخر
            </button>
            <span className="font-black text-gray-800 dark:text-white">تفاصيل المشتريات</span>
          </div>

          {orderForm.items.map((item, idx) => (
            <div key={idx} className="flex gap-2 mb-3 items-start relative bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl border border-gray-100 dark:border-gray-800">

              {/* البحث عن الصنف */}
              <div className="flex-[3] relative">
                <input
                  type="text"
                  className="w-full border-2 border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-right outline-none bg-white dark:bg-gray-800 font-bold text-gray-800 dark:text-gray-100 focus:border-blue-500 transition-colors"
                  placeholder="ابحث عن الصنف بالاسم..."
                  value={item.searchQuery !== undefined ? item.searchQuery : item.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newItems = [...orderForm.items];
                    newItems[idx].searchQuery = val;
                    newItems[idx].name = val;
                    newItems[idx].showDropdown = true;
                    const exactMatch = availableProducts.find(
                      (p) => p.name.trim().toLowerCase() === val.trim().toLowerCase()
                    );
                    if (exactMatch && exactMatch.stock > 0) {
                      newItems[idx].productId = exactMatch.id;
                      newItems[idx].unitPrice = exactMatch.sellingPrice;
                      newItems[idx].price = exactMatch.sellingPrice * (newItems[idx].qty || 1);
                    } else {
                      newItems[idx].productId = "";
                    }
                    setOrderForm({ ...orderForm, items: newItems });
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      const newItems = [...orderForm.items];
                      if (newItems[idx]) {
                        newItems[idx].showDropdown = false;
                        setOrderForm({ ...orderForm, items: newItems });
                      }
                    }, 200);
                  }}
                  onFocus={() => {
                    const newItems = [...orderForm.items];
                    newItems[idx].showDropdown = true;
                    setOrderForm({ ...orderForm, items: newItems });
                  }}
                />

                {item.showDropdown && (
                  <ul className="absolute z-50 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 shadow-xl w-full max-h-48 overflow-y-auto rounded-xl mt-1 text-right custom-scrollbar">
                    {availableProducts
                      .filter((p) => p.name.toLowerCase().includes((item.searchQuery || "").toLowerCase()))
                      .map((p) => (
                        <li
                          key={p.id}
                          className={`p-3 border-b dark:border-gray-700 cursor-pointer transition-colors text-sm font-bold flex justify-between items-center ${
                            p.stock <= 0
                              ? "bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-500 cursor-not-allowed"
                              : "hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-800 dark:text-gray-200"
                          }`}
                          onMouseDown={() => {
                            if (p.stock > 0) {
                              const newItems = [...orderForm.items];
                              newItems[idx] = {
                                ...newItems[idx],
                                productId: p.id,
                                name: p.name,
                                unitPrice: p.sellingPrice,
                                searchQuery: p.name,
                                qty: newItems[idx].qty || 1,
                                price: p.sellingPrice * (newItems[idx].qty || 1),
                                showDropdown: false,
                              };
                              setOrderForm({ ...orderForm, items: newItems });
                            }
                          }}
                        >
                          <span>{p.name}</span>
                          <div className="flex gap-2 items-center">
                            <span className="text-gray-400 dark:text-gray-500 text-[10px] bg-gray-100 dark:bg-gray-900 px-1.5 py-0.5 rounded">متاح: {p.stock}</span>
                            <span className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded">{p.sellingPrice}ج</span>
                          </div>
                        </li>
                      ))}
                    {availableProducts.filter((p) => p.name.toLowerCase().includes((item.searchQuery || "").toLowerCase())).length === 0 && (
                      <li className="p-4 text-center text-gray-400 dark:text-gray-500 text-xs font-bold bg-gray-50 dark:bg-gray-900/50">لا يوجد صنف مسجل بهذا الاسم</li>
                    )}
                  </ul>
                )}
              </div>

              {/* الكمية */}
              <div className="flex-1">
                <input
                  type="number"
                  min="1"
                  className="w-full border-2 border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-center outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:border-blue-500 font-bold"
                  placeholder="الكمية"
                  value={item.qty || 1}
                  onChange={(e) => {
                    const newQty = parseInt(e.target.value) || 1;
                    const newItems = [...orderForm.items];
                    newItems[idx].qty = newQty;
                    if (newItems[idx].unitPrice) {
                      newItems[idx].price = newItems[idx].unitPrice * newQty;
                    }
                    setOrderForm({ ...orderForm, items: newItems });
                  }}
                />
              </div>

              {/* السعر */}
              <div className="flex-1">
                <input
                  type="number"
                  className="w-full border-2 border-gray-200 dark:border-gray-700 p-2.5 rounded-lg text-sm text-center outline-none bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-black focus:border-blue-500"
                  placeholder="السعر"
                  value={item.price}
                  onChange={(e) => {
                    const newItems = [...orderForm.items];
                    newItems[idx].price = e.target.value;
                    setOrderForm({ ...orderForm, items: newItems });
                  }}
                />
              </div>

              {orderForm.items.length > 1 && (
                <button
                  onClick={() => setOrderForm((p) => ({ ...p, items: p.items.filter((_, i) => i !== idx) }))}
                  className="text-red-400 hover:text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-2 py-2.5 rounded-lg text-xs font-bold transition-colors"
                >
                  🗑️
                </button>
              )}
            </div>
          ))}

          {/* الخصومات والمدفوع */}
          <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 dark:border-gray-700 pt-5">
            <button
              onClick={() => setOrderForm({ ...orderForm, discountPercentage: 5 })}
              className={`flex-1 p-2.5 rounded-xl font-black text-xs border-2 transition-all ${
                Number(orderForm.discountPercentage) === 5
                  ? "border-orange-400 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              🥈 ميدالية 5% خصم
            </button>
            <button
              onClick={() => setOrderForm({ ...orderForm, discountPercentage: 10 })}
              className={`flex-1 p-2.5 rounded-xl font-black text-xs border-2 transition-all ${
                Number(orderForm.discountPercentage) === 10
                  ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              🥇 ميدالية 10% خصم
            </button>

            <div className="w-full flex gap-3 mt-1">
              <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 block text-right pr-1 mb-1">نسبة الخصم اليدوي %</label>
                <input
                  type="number"
                  className="w-full border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 rounded-lg text-center font-bold outline-none focus:border-blue-500 text-gray-800 dark:text-white"
                  value={orderForm.discountPercentage}
                  onChange={(e) => setOrderForm({ ...orderForm, discountPercentage: e.target.value })}
                />
              </div>
              <div className="flex-1 bg-green-50 dark:bg-green-900/10 p-2 rounded-xl border border-green-100 dark:border-green-900/30">
                <label className="text-[10px] font-bold text-green-600 dark:text-green-500 block text-right pr-1 mb-1">المدفوع من العميل (كاش)</label>
                <input
                  type="number"
                  className="w-full border-2 border-green-200 dark:border-green-800/50 bg-white dark:bg-gray-800 p-2 rounded-lg text-center font-black text-green-600 dark:text-green-400 outline-none focus:border-green-500"
                  value={orderForm.paidAmount}
                  onChange={(e) => setOrderForm({ ...orderForm, paidAmount: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* الملاحظات */}
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-200 dark:border-blue-800/50">
          <label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block text-right pr-1 mb-2">📝 ملحوظات العميل (اختياري)</label>
          <textarea
            className="w-full border-2 border-blue-200 dark:border-blue-800/50 bg-white dark:bg-gray-800 p-3 rounded-lg text-right font-medium text-gray-800 dark:text-gray-200 outline-none focus:border-blue-400 transition-colors resize-none"
            rows="3"
            placeholder="أكتب أي ملحوظات أو طلبات خاصة للعميل..."
            value={orderForm.notes || ""}
            onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
          />
        </div>

        {/* معاينة الفاتورة */}
        <InvoicePreview
          ref={invoiceRef}
          orderForm={orderForm}
          client={currentClient}
          subTotal={subTotal}
          finalTotal={finalTotal}
          remaining={remaining}
        />
      </div>
    </TailwindModal>
  );
};

export default OrderModal;