import React, { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import "bootstrap/dist/css/bootstrap.min.css";

function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalClient, setModalClient] = useState(null);

  const [clientForm, setClientForm] = useState({
    name: "",
    phone: "",
    address: "",
    birthDate: "",
  });

  const [newOrder, setNewOrder] = useState({
    name: "",
    cost: 0,
    profit: 0,
    quantity: 1,
    discount: 0,
    total: 0,
    date: new Date().toISOString().split("T")[0],
  });

  const [addingOrderClientId, setAddingOrderClientId] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  const [successMessage, setSuccessMessage] = useState("");

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const clientsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClients(clientsList);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleOpenModal = (client = null) => {
    setModalClient(client);
    if (client) {
      setClientForm({
        name: client.name || "",
        phone: client.phone || "",
        address: client.address || "",
        birthDate: client.birthDate || "",
      });
    } else {
      setClientForm({ name: "", phone: "", address: "", birthDate: "" });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalClient(null);
    setSuccessMessage("");
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    setSuccessMessage("");

    try {
      if (modalClient) {
        const clientRef = doc(db, "clients", modalClient.id);
        await updateDoc(clientRef, { ...clientForm });
        setSuccessMessage("تم تعديل العميل بنجاح!");
      } else {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        const clientDataToAdd = {
          ...clientForm,
          code,
          orders: [],
          createdAt: new Date().toISOString(),
          firstOrderDate: null,
          lastOrderDate: null,
        };
        await addDoc(collection(db, "clients"), clientDataToAdd);
        setSuccessMessage("تم إضافة العميل بنجاح!");
      }
      fetchClients();
      handleCloseModal();
    } catch (err) {
      console.error("Error saving client:", err);
      setError(err.message);
    }
  };

  const handleDeleteClient = async (clientId) => {
    if (
      !window.confirm(
        "هل أنت متأكد من حذف هذا العميل؟ سيتم حذف جميع الأوردرات المرتبطة به."
      )
    ) {
      return;
    }
    try {
      await deleteDoc(doc(db, "clients", clientId));
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      setSuccessMessage("تم حذف العميل بنجاح!");
    } catch (err) {
      console.error("Error deleting client:", err);
      setError(err.message);
    }
  };

  const calculateTotal = (cost, profit, quantity, discount) => {
    const parsedCost = parseFloat(cost) || 0;
    const parsedProfit = parseFloat(profit) || 0;
    const parsedQuantity = parseInt(quantity) || 1;
    const parsedDiscount = parseFloat(discount) || 0;
    return (parsedCost + parsedProfit) * parsedQuantity - parsedDiscount;
  };

  const handleAddOrderForClient = async (e, clientId) => {
    e.preventDefault();
    setSuccessMessage("");

    if (!newOrder.name) {
      alert("الرجاء إدخال اسم الأوردر.");
      return;
    }

    const orderToAdd = {
      ...newOrder,
      total: calculateTotal(
        newOrder.cost,
        newOrder.profit,
        newOrder.quantity,
        newOrder.discount
      ),
    };

    try {
      const clientRef = doc(db, "clients", clientId);
      const clientToUpdate = clients.find((c) => c.id === clientId);

      const updateData = {
        orders: arrayUnion(orderToAdd),
        lastOrderDate: orderToAdd.date,
      };

      if (!clientToUpdate.firstOrderDate) {
        updateData.firstOrderDate = orderToAdd.date;
      }

      await updateDoc(clientRef, updateData);
      setNewOrder({
        name: "",
        cost: 0,
        profit: 0,
        quantity: 1,
        discount: 0,
        total: 0,
        date: new Date().toISOString().split("T")[0],
      });
      fetchClients();
      setAddingOrderClientId(null);
      setSuccessMessage("تم إضافة الطلب بنجاح!");
    } catch (err) {
      console.error("Error adding order:", err);
      setError(err.message);
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    setSuccessMessage("");

    const { clientId, orderIndex, orderData } = editingOrder;
    const clientRef = doc(db, "clients", clientId);
    const clientToUpdate = clients.find((c) => c.id === clientId);
    const updatedOrders = [...clientToUpdate.orders];

    updatedOrders[orderIndex] = {
      ...orderData,
      total: calculateTotal(
        orderData.cost,
        orderData.profit,
        orderData.quantity,
        orderData.discount
      ),
    };

    try {
      await updateDoc(clientRef, {
        orders: updatedOrders,
        lastOrderDate: orderData.date,
      });
      fetchClients();
      setEditingOrder(null);
      setSuccessMessage("تم تعديل الأوردر بنجاح!");
    } catch (err) {
      console.error("Error updating order:", err);
      setError(err.message);
    }
  };

  const handleDeleteOrder = async (clientId, orderIndex) => {
    if (!window.confirm("هل تريد حذف هذا الأوردر؟")) return;

    try {
      const clientRef = doc(db, "clients", clientId);
      const clientToUpdate = clients.find((c) => c.id === clientId);
      const updatedOrders = clientToUpdate.orders.filter(
        (_, i) => i !== orderIndex
      );

      const updateData = { orders: updatedOrders };

      if (updatedOrders.length === 0) {
        updateData.firstOrderDate = null;
        updateData.lastOrderDate = null;
      } else {
        const newLastOrderDate = updatedOrders.reduce((latestDate, order) => {
          return order.date > latestDate ? order.date : latestDate;
        }, "");
        updateData.lastOrderDate = newLastOrderDate;
      }

      await updateDoc(clientRef, updateData);
      fetchClients();
      setSuccessMessage("تم حذف الأوردر بنجاح!");
    } catch (err) {
      console.error("Error deleting order:", err);
      setError(err.message);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.code && c.code.includes(searchTerm))
  );

  const getTotalOrdersAmount = (orders) =>
    (orders || []).reduce((sum, o) => sum + (o.total || 0), 0);

  const hasOneYearPassedSinceFirstOrder = (firstOrderDate) => {
    if (!firstOrderDate) return false;
    const today = new Date();
    const firstOrder = new Date(firstOrderDate);
    const oneYearAgo = new Date(today.setFullYear(today.getFullYear() - 1));
    return firstOrder <= oneYearAgo;
  };

  if (loading)
    return <p className="text-center mt-5">جارٍ تحميل البيانات...</p>;
  if (error) return <p className="text-danger text-center mt-5">{error}</p>;

  return (
    <div className="container mt-4">
      <h1 className="mb-4 text-center">نظام إدارة العملاء</h1>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
        <p className="my-2">
          إجمالي العملاء: <strong>{clients.length}</strong>
        </p>
        <button
          className="btn btn-success my-2"
          onClick={() => handleOpenModal(null)}
        >
          إضافة عميل جديد
        </button>
      </div>

      {successMessage && (
        <div className="alert alert-success mt-3">{successMessage}</div>
      )}

      <input
        type="text"
        className="form-control mb-4"
        placeholder="ابحث باسم العميل أو رقم الهاتف أو الكود..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {filteredClients.length === 0 && searchTerm !== "" && (
        <p className="text-center text-muted">
          لا يوجد عملاء يطابقون معايير البحث.
        </p>
      )}
      {filteredClients.length === 0 && searchTerm === "" && (
        <p className="text-center text-muted">
          لا يوجد عملاء لعرضهم. ابدأ بإضافة عميل جديد.
        </p>
      )}

      {/* عرض قائمة العملاء */}
      {filteredClients.map((client) => {
        const totalOrders = getTotalOrdersAmount(client.orders);
        const isOneYearAnniversary = hasOneYearPassedSinceFirstOrder(
          client.firstOrderDate
        );
        return (
          <div key={client.id} className="card mb-3 shadow-sm">
            <div className="card-header d-flex flex-wrap justify-content-between align-items-center py-2">
              <span className="fw-bold fs-5 my-1">
                {client.name} {client.phone && `(${client.phone})`}{" "}
                {client.code && `[${client.code}]`}
              </span>
              <div className="d-flex flex-wrap my-1">
                {isOneYearAnniversary && (
                  <span className="badge bg-warning text-dark me-1 mb-1 p-2">
                    <i className="bi bi-gift-fill me-1"></i>مر عام على أول أوردر!
                  </span>
                )}
                <button
                  className="btn btn-info btn-sm me-1 mb-1"
                  onClick={() => handleOpenModal(client)}
                >
                  تعديل
                </button>
                <button
                  className="btn btn-primary btn-sm me-1 mb-1"
                  onClick={() =>
                    setAddingOrderClientId(
                      addingOrderClientId === client.id ? null : client.id
                    )
                  }
                >
                  {addingOrderClientId === client.id
                    ? "إلغاء إضافة أوردر"
                    : "إضافة أوردر"}
                </button>
                <button
                  className="btn btn-danger btn-sm mb-1"
                  onClick={() => handleDeleteClient(client.id)}
                >
                  حذف
                </button>
              </div>
            </div>
            <div className="card-body">
              <p className="mb-1">
                <strong>العنوان:</strong> {client.address || "غير محدد"}
              </p>
              {client.birthDate && (
                <p className="mb-1">
                  <strong>تاريخ الميلاد:</strong> {client.birthDate}
                </p>
              )}
              {client.firstOrderDate && (
                <p className="mb-1">
                  <strong>تاريخ أول أوردر:</strong> {client.firstOrderDate}
                </p>
              )}
              {client.lastOrderDate && (
                <p className="mb-1">
                  <strong>تاريخ آخر أوردر:</strong> {client.lastOrderDate}
                </p>
              )}
              <p className="fw-bold mb-3">
                <strong>إجمالي مبلغ الأوردرات:</strong>{" "}
                {totalOrders.toFixed(2)} ج
              </p>

              <h6 className="mt-3 mb-2">الأوردرات:</h6>
              {client.orders && client.orders.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-sm table-bordered table-hover caption-top">
                    <thead>
                      <tr>
                        <th>اسم الطلب</th>
                        <th>تكلفة</th>
                        <th>مكسب</th>
                        <th>كمية</th>
                        <th>خصم</th>
                        <th>إجمالي</th>
                        <th>تاريخ</th>
                        <th>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {client.orders.map((o, idx) => (
                        <tr key={idx}>
                          <td>{o.name}</td>
                          <td>{o.cost?.toFixed(2) || "0.00"}</td>
                          <td>{o.profit?.toFixed(2) || "0.00"}</td>
                          <td>{o.quantity || 1}</td>
                          <td>{o.discount?.toFixed(2) || "0.00"}</td>
                          <td>{o.total?.toFixed(2) || "0.00"}</td>
                          <td>{o.date}</td>
                          <td className="d-flex flex-nowrap">
                            <button
                              className="btn btn-sm btn-warning me-1 px-2 py-1"
                              onClick={() =>
                                setEditingOrder({
                                  clientId: client.id,
                                  orderIndex: idx,
                                  orderData: { ...o },
                                })
                              }
                            >
                              تعديل
                            </button>
                            <button
                              className="btn btn-sm btn-danger px-2 py-1"
                              onClick={() => handleDeleteOrder(client.id, idx)}
                            >
                              حذف
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">لا يوجد أوردرات حتى الآن.</p>
              )}
            </div>
          </div>
        );
      })}

      {/* مودال إضافة/تعديل العميل */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            {" "}
            {/* Added modal-lg for larger modal */}
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalClient ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseModal}
                  aria-label="إغلاق"
                ></button>
              </div>
              <form onSubmit={handleSaveClient}>
                <div className="modal-body">
                  <div className="mb-2">
                    <label htmlFor="clientName" className="form-label">
                      اسم العميل:
                    </label>
                    <input
                      type="text"
                      id="clientName"
                      placeholder="اسم العميل"
                      className="form-control"
                      value={clientForm.name}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="clientPhone" className="form-label">
                      رقم الهاتف:
                    </label>
                    <input
                      type="text"
                      id="clientPhone"
                      placeholder="رقم الهاتف"
                      className="form-control"
                      value={clientForm.phone}
                      onChange={(e) =>
                        setClientForm({ ...clientForm, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="clientAddress" className="form-label">
                      العنوان:
                    </label>
                    <input
                      type="text"
                      id="clientAddress"
                      placeholder="العنوان"
                      className="form-control"
                      value={clientForm.address}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="clientBirthDate" className="form-label">
                      تاريخ الميلاد:
                    </label>
                    <input
                      type="date"
                      id="clientBirthDate"
                      className="form-control"
                      value={clientForm.birthDate}
                      onChange={(e) =>
                        setClientForm({
                          ...clientForm,
                          birthDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                  >
                    إلغاء
                  </button>
                  <button type="submit" className="btn btn-success">
                    {modalClient ? "حفظ التعديل" : "إضافة العميل"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* مودال إضافة أوردر */}
      {addingOrderClientId && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  إضافة أوردر لـ{" "}
                  {clients.find((c) => c.id === addingOrderClientId)?.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setAddingOrderClientId(null)}
                  aria-label="إغلاق"
                ></button>
              </div>
              <form
                onSubmit={(e) => handleAddOrderForClient(e, addingOrderClientId)}
              >
                <div className="modal-body">
                  <div className="mb-2">
                    <label htmlFor="orderName" className="form-label">
                      اسم الطلب:
                    </label>
                    <input
                      type="text"
                      id="orderName"
                      placeholder="اسم الطلب"
                      className="form-control"
                      value={newOrder.name}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="orderCost" className="form-label">
                      تكلفة البضاعة:
                    </label>
                    <input
                      type="number"
                      id="orderCost"
                      placeholder="تكلفة البضاعة"
                      className="form-control"
                      value={newOrder.cost}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 0;
                        setNewOrder((prev) => ({
                          ...prev,
                          cost,
                          total: calculateTotal(
                            cost,
                            prev.profit,
                            prev.quantity,
                            prev.discount
                          ),
                        }));
                      }}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="orderProfit" className="form-label">
                      المكسب:
                    </label>
                    <input
                      type="number"
                      id="orderProfit"
                      placeholder="المكسب"
                      className="form-control"
                      value={newOrder.profit}
                      onChange={(e) => {
                        const profit = parseFloat(e.target.value) || 0;
                        setNewOrder((prev) => ({
                          ...prev,
                          profit,
                          total: calculateTotal(
                            prev.cost,
                            profit,
                            prev.quantity,
                            prev.discount
                          ),
                        }));
                      }}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="orderQuantity" className="form-label">
                      الكمية:
                    </label>
                    <input
                      type="number"
                      id="orderQuantity"
                      placeholder="الكمية"
                      className="form-control"
                      value={newOrder.quantity}
                      onChange={(e) => {
                        const quantity = parseInt(e.target.value) || 1;
                        setNewOrder((prev) => ({
                          ...prev,
                          quantity,
                          total: calculateTotal(
                            prev.cost,
                            prev.profit,
                            quantity,
                            prev.discount
                          ),
                        }));
                      }}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="orderDiscount" className="form-label">
                      الخصم:
                    </label>
                    <input
                      type="number"
                      id="orderDiscount"
                      placeholder="الخصم"
                      className="form-control"
                      value={newOrder.discount}
                      onChange={(e) => {
                        const discount = parseFloat(e.target.value) || 0;
                        setNewOrder((prev) => ({
                          ...prev,
                          discount,
                          total: calculateTotal(
                            prev.cost,
                            prev.profit,
                            prev.quantity,
                            discount
                          ),
                        }));
                      }}
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="orderTotal" className="form-label">
                      السعر الكلي:
                    </label>
                    <input
                      type="number"
                      id="orderTotal"
                      placeholder="السعر الكلي"
                      className="form-control"
                      value={newOrder.total.toFixed(2)}
                      disabled
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="orderDate" className="form-label">
                      تاريخ الأوردر:
                    </label>
                    <input
                      type="date"
                      id="orderDate"
                      className="form-control"
                      value={newOrder.date}
                      onChange={(e) =>
                        setNewOrder({ ...newOrder, date: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setAddingOrderClientId(null)}
                  >
                    إلغاء
                  </button>
                  <button type="submit" className="btn btn-primary">
                    إضافة الأوردر
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* مودال تعديل أوردر */}
      {editingOrder && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">تعديل أوردر</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditingOrder(null)}
                  aria-label="إغلاق"
                ></button>
              </div>
              <form onSubmit={handleUpdateOrder}>
                <div className="modal-body">
                  <div className="mb-2">
                    <label htmlFor="editOrderName" className="form-label">
                      اسم الطلب:
                    </label>
                    <input
                      type="text"
                      id="editOrderName"
                      className="form-control"
                      placeholder="اسم الطلب"
                      value={editingOrder.orderData.name}
                      onChange={(e) =>
                        setEditingOrder((prev) => ({
                          ...prev,
                          orderData: { ...prev.orderData, name: e.target.value },
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="editOrderCost" className="form-label">
                      تكلفة البضاعة:
                    </label>
                    <input
                      type="number"
                      id="editOrderCost"
                      className="form-control"
                      placeholder="تكلفة البضاعة"
                      value={editingOrder.orderData.cost}
                      onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 0;
                        setEditingOrder((prev) => ({
                          ...prev,
                          orderData: {
                            ...prev.orderData,
                            cost,
                            total: calculateTotal(
                              cost,
                              prev.orderData.profit,
                              prev.orderData.quantity,
                              prev.orderData.discount
                            ),
                          },
                        }));
                      }}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="editOrderProfit" className="form-label">
                      المكسب:
                    </label>
                    <input
                      type="number"
                      id="editOrderProfit"
                      className="form-control"
                      placeholder="المكسب"
                      value={editingOrder.orderData.profit}
                      onChange={(e) => {
                        const profit = parseFloat(e.target.value) || 0;
                        setEditingOrder((prev) => ({
                          ...prev,
                          orderData: {
                            ...prev.orderData,
                            profit,
                            total: calculateTotal(
                              prev.orderData.cost,
                              profit,
                              prev.orderData.quantity,
                              prev.orderData.discount
                            ),
                          },
                        }));
                      }}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="editOrderQuantity" className="form-label">
                      الكمية:
                    </label>
                    <input
                      type="number"
                      id="editOrderQuantity"
                      className="form-control"
                      placeholder="الكمية"
                      value={editingOrder.orderData.quantity}
                      onChange={(e) => {
                        const quantity = parseInt(e.target.value) || 1;
                        setEditingOrder((prev) => ({
                          ...prev,
                          orderData: {
                            ...prev.orderData,
                            quantity,
                            total: calculateTotal(
                              prev.orderData.cost,
                              prev.orderData.profit,
                              quantity,
                              prev.orderData.discount
                            ),
                          },
                        }));
                      }}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="editOrderDiscount" className="form-label">
                      الخصم:
                    </label>
                    <input
                      type="number"
                      id="editOrderDiscount"
                      className="form-control"
                      placeholder="الخصم"
                      value={editingOrder.orderData.discount}
                      onChange={(e) => {
                        const discount = parseFloat(e.target.value) || 0;
                        setEditingOrder((prev) => ({
                          ...prev,
                          orderData: {
                            ...prev.orderData,
                            discount,
                            total: calculateTotal(
                              prev.orderData.cost,
                              prev.orderData.profit,
                              prev.orderData.quantity,
                              discount
                            ),
                          },
                        }));
                      }}
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="editOrderTotal" className="form-label">
                      السعر الكلي:
                    </label>
                    <input
                      type="number"
                      id="editOrderTotal"
                      className="form-control"
                      placeholder="السعر الكلي"
                      value={editingOrder.orderData.total.toFixed(2)}
                      disabled
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="editOrderDate" className="form-label">
                      تاريخ الأوردر:
                    </label>
                    <input
                      type="date"
                      id="editOrderDate"
                      className="form-control"
                      value={editingOrder.orderData.date}
                      onChange={(e) =>
                        setEditingOrder((prev) => ({
                          ...prev,
                          orderData: { ...prev.orderData, date: e.target.value },
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingOrder(null)}
                  >
                    إلغاء
                  </button>
                  <button type="submit" className="btn btn-success">
                    حفظ التعديل
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientsPage;