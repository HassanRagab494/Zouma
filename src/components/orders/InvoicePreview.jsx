import React from "react";
import { ORDER_STATUSES } from "../../constants/orderStatuses";

const InvoicePreview = React.forwardRef(
  ({ orderForm, client, subTotal, finalTotal, remaining }, ref) => {
    return (
      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-2xl flex justify-center">
        <div
          ref={ref}
          className="bg-white p-6 border-2 border-dashed border-gray-300 rounded-xl text-center shadow-md text-black"
          style={{ width: "350px" }}
        >
          <h2 className="text-2xl font-black mb-1 text-gray-800 uppercase italic tracking-tighter">
            Z O U M A
          </h2>
          <div
            className={`text-[10px] inline-block px-3 py-1 rounded-full text-white font-bold mb-4 shadow-sm ${
              ORDER_STATUSES[orderForm.status || "NEW"].color.split(" ")[0]
            }`}
          >
            {ORDER_STATUSES[orderForm.status || "NEW"].label}
          </div>

          <div className="text-right text-[11px] space-y-1 mb-4 border-b border-gray-200 pb-3 font-bold text-gray-700">
            <p>العميل: <span className="text-black font-black">{client?.name}</span></p>
            <p>الكود: #{client?.clientCode}</p>
            <p>التاريخ: {orderForm.date}</p>
          </div>

          <table className="w-full text-[12px] text-right mb-4 font-bold border-collapse text-gray-800">
            <tbody className="divide-y divide-gray-100">
              {orderForm.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2 leading-tight">
                    {item.name || "-"}{" "}
                    <span className="text-gray-400 text-[10px]">
                      {item.qty > 1 ? `(x${item.qty})` : ""}
                    </span>
                  </td>
                  <td className="py-2 text-left font-black">{item.price || 0} ج</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-gray-200 pt-3 space-y-1.5 text-[13px] font-bold text-right">
            <div className="flex justify-between text-gray-500">
              <span>الإجمالي:</span>
              <span>{subTotal} ج</span>
            </div>
            {parseFloat(orderForm.discountPercentage) > 0 && (
              <div className="flex justify-between text-red-500 italic">
                <span>الخصم ({orderForm.discountPercentage}%):</span>
                <span>-{(subTotal * parseFloat(orderForm.discountPercentage) / 100).toFixed(2)} ج</span>
              </div>
            )}
            <div className="flex justify-between bg-gray-900 text-white p-2.5 rounded-lg mt-2 text-sm shadow-md">
              <span>الصافي المطلوب:</span>
              <span className="font-black">{finalTotal} ج</span>
            </div>
            <div className="flex justify-between text-green-600 px-1 pt-2 border-t border-dashed border-gray-200 mt-2">
              <span>تم دفع:</span>
              <span className="font-black">{orderForm.paidAmount || 0} ج</span>
            </div>
            <div className="flex justify-between text-red-600 bg-red-50 p-2 rounded-lg mt-1">
              <span>المتبقي:</span>
              <span className="font-black text-sm">{remaining} ج</span>
            </div>
          </div>

          {orderForm.notes && (
            <div className="mt-4 pt-3 border-t border-gray-200 text-[10px] text-right bg-blue-50 p-2 rounded-lg">
              <p className="font-bold text-blue-600 mb-1">ملحوظات:</p>
              <p className="text-gray-700">{orderForm.notes}</p>
            </div>
          )}

          <p className="text-[9px] text-gray-400 mt-6 text-center italic">
            شكراً لتعاملكم مع Zouma Store
          </p>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = "InvoicePreview";
export default InvoicePreview;