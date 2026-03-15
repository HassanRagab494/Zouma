import React, { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc
} from "firebase/firestore";

import { db } from "../firebaseConfig";

function UsersAdminPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [permissions, setPermissions] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const usersPerPage = 5;

  // =======================
  // PERMISSIONS LIST
  // =======================
  const permissionsList = [
    { key: "dashboard", label: "الرئيسية" },
    { key: "clients", label: "العملاء" },
    { key: "profits", label: "الأرباح" },
    { key: "orders", label: "الطلبات" },
    { key: "products", label: "المخزون" }
  ];

  const usersCollection = collection(db, "users");

  // =======================
  // GET USERS
  // =======================
  const getUsers = useCallback(async () => {
    const data = await getDocs(usersCollection);
    const list = data.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id
    }));
    setUsers(list);
    setFilteredUsers(list);
  }, [usersCollection]);

  // =======================
  // LOAD USERS
  // =======================
  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // =======================
  // PERMISSION CHANGE
  // =======================
  const handlePermissionChange = (perm) => {
    if (permissions.includes(perm)) {
      setPermissions(permissions.filter((p) => p !== perm));
    } else {
      setPermissions([...permissions, perm]);
    }
  };

  // =======================
  // ADD USER
  // =======================
  const addUser = async (e) => {
    e.preventDefault();
    await addDoc(usersCollection, {
      name,
      email,
      password,
      permissions,
      role: "employee"
    });
    resetForm();
    getUsers();
  };

  // =======================
  // UPDATE USER
  // =======================
  const updateUser = async (e) => {
    e.preventDefault();
    const userRef = doc(db, "users", editingUser);
    await updateDoc(userRef, {
      name,
      email,
      password,
      permissions
    });
    resetForm();
    getUsers();
  };

  // =======================
  // DELETE USER
  // =======================
  const deleteUser = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;
    const userRef = doc(db, "users", id);
    await deleteDoc(userRef);
    getUsers();
  };

  // =======================
  // EDIT USER
  // =======================
  const editUser = (user) => {
    setEditingUser(user.id);
    setName(user.name);
    setEmail(user.email);
    setPassword(user.password);
    setPermissions(user.permissions || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // =======================
  // RESET FORM
  // =======================
  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setPermissions([]);
    setEditingUser(null);
  };

  // =======================
  // SEARCH
  // =======================
  useEffect(() => {
    const result = users.filter(
      (user) =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredUsers(result);
    setCurrentPage(1);
  }, [search, users]);

  // =======================
  // PAGINATION
  // =======================
  const indexLast = currentPage * usersPerPage;
  const indexFirst = indexLast - usersPerPage;
  const currentUsers = filteredUsers.slice(indexFirst, indexLast);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // =======================
  // UI
  // =======================
  return (
    <div className="p-4 md:p-8 min-h-screen transition-colors duration-300 bg-gray-50/50 dark:bg-gray-900 text-right" dir="rtl">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 mt-2">
          <div>
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">إدارة المستخدمين </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-bold mt-1">التحكم في حسابات الموظفين وصلاحيات الوصول</p>
          </div>
      </div>

      {/* ================= FORM ================= */}
      <form
        onSubmit={editingUser ? updateUser : addUser}
        className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8 transition-colors duration-300"
      >
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">
            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </span>
            <h2 className="font-black text-xl text-gray-800 dark:text-white">
            {editingUser ? "تعديل بيانات المستخدم" : "إضافة مستخدم جديد"}
            </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            <input
            className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl outline-none focus:border-purple-500 dark:focus:border-purple-500 text-gray-800 dark:text-gray-100 font-bold transition-colors"
            placeholder="اسم الموظف"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            />
            <input
            type="email"
            className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl outline-none focus:border-purple-500 dark:focus:border-purple-500 text-gray-800 dark:text-gray-100 font-bold transition-colors"
            placeholder="البريد الإلكتروني (الإيميل)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            />
            <input
            type="text"
            className="w-full border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 rounded-xl outline-none focus:border-purple-500 dark:focus:border-purple-500 text-gray-800 dark:text-gray-100 font-bold transition-colors tracking-widest"
            placeholder="كلمة المرور (الباسورد)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            />
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 mb-8">
            <p className="font-black mb-4 text-gray-800 dark:text-gray-200">الصلاحيات الممنوحة:</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {permissionsList.map((perm) => (
                <label key={perm.key} className="flex items-center gap-3 cursor-pointer bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 transition-colors shadow-sm">
                    <input
                    type="checkbox"
                    className="w-5 h-5 accent-purple-600 cursor-pointer"
                    checked={permissions.includes(perm.key)}
                    onChange={() => handlePermissionChange(perm.key)}
                    />
                    <span className="font-bold text-sm text-gray-700 dark:text-gray-300">
                    {perm.label}
                    </span>
                </label>
                ))}
            </div>
        </div>

        <div className="flex gap-3">
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-purple-500/30 transition-all text-sm">
                {editingUser ? "حفظ التعديلات" : "+ إضافة المستخدم"}
            </button>
            {editingUser && (
            <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold px-8 py-3 rounded-xl transition-all text-sm"
            >
                إلغاء
            </button>
            )}
        </div>
      </form>

      {/* ================= SEARCH ================= */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex items-center gap-3 transition-colors duration-300">
        <span className="text-gray-400 pr-2">🔍</span>
        <input
          placeholder="ابحث عن موظف بالاسم أو الإيميل..."
          className="w-full bg-transparent outline-none text-gray-800 dark:text-gray-100 font-bold placeholder-gray-400 py-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-center whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-[11px] uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                <tr>
                <th className="p-4 font-bold">اسم الموظف</th>
                <th className="p-4 font-bold">البريد الإلكتروني</th>
                <th className="p-4 font-bold">الصلاحيات</th>
                <th className="p-4 font-bold">تعديل</th>
                <th className="p-4 font-bold">حذف</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                {currentUsers.length === 0 ? (
                    <tr>
                        <td colSpan="5" className="p-10 text-gray-400 dark:text-gray-500 font-bold">لا يوجد مستخدمين مسجلين</td>
                    </tr>
                ) : (
                    currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="p-4 font-bold text-gray-800 dark:text-gray-200">
                        {user.name}
                        {user.role === "super_admin" && <span className="ml-2 text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-black">مدير نظام</span>}
                        </td>
                        <td className="p-4 text-gray-500 dark:text-gray-400 font-sans">{user.email}</td>
                        <td className="p-4 text-xs">
                        <div className="flex flex-wrap justify-center gap-1.5">
                            {user.role === "super_admin" ? (
                                <span className="bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 px-3 py-1 rounded-lg font-bold">كل الصلاحيات</span>
                            ) : (
                                user.permissions?.map((p) => {
                                    const permLabel = permissionsList.find((x) => x.key === p)?.label;
                                    return (
                                    <span key={p} className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50 px-2.5 py-1 rounded-lg font-bold">
                                        {permLabel}
                                    </span>
                                    );
                                })
                            )}
                        </div>
                        </td>
                        <td className="p-4">
                        <button
                            onClick={() => editUser(user)}
                            className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                        >
                            تعديل
                        </button>
                        </td>
                        <td className="p-4">
                        <button
                            onClick={() => deleteUser(user.id)}
                            disabled={user.role === "super_admin"}
                            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${user.role === "super_admin" ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40'}`}
                        >
                            حذف
                        </button>
                        </td>
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* ================= PAGINATION ================= */}
      {totalPages > 1 && (
        <div className="flex gap-2 mt-6 justify-center">
            {Array.from({ length: totalPages }).map((_, i) => (
            <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-colors shadow-sm ${
                currentPage === i + 1
                    ? "bg-purple-600 text-white"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
                {i + 1}
            </button>
            ))}
        </div>
      )}

    </div>
  );
}

export default UsersAdminPage;
