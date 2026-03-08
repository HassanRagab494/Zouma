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

const [users,setUsers]=useState([])
const [filteredUsers,setFilteredUsers]=useState([])

const [name,setName]=useState("")
const [email,setEmail]=useState("")
const [password,setPassword]=useState("")

const [permissions,setPermissions]=useState([])

const [editingUser,setEditingUser]=useState(null)

const [search,setSearch]=useState("")
const [currentPage,setCurrentPage]=useState(1)

const usersPerPage=5

// =======================
// PERMISSIONS LIST
// =======================

const permissionsList=[

{key:"dashboard",label:"الرئيسية"},
{key:"clients",label:"العملاء"},
{key:"profits",label:"الأرباح"},
{key:"orders",label:"الطلبات"},
{key:"products",label:"المخزون"}

]

const usersCollection=collection(db,"users")

// =======================
// GET USERS
// =======================

const getUsers=useCallback(async()=>{

const data=await getDocs(usersCollection)

const list=data.docs.map((doc)=>({

...doc.data(),
id:doc.id

}))

setUsers(list)
setFilteredUsers(list)

},[usersCollection])

// =======================
// LOAD USERS
// =======================

useEffect(()=>{
getUsers()
},[getUsers])

// =======================
// PERMISSION CHANGE
// =======================

const handlePermissionChange=(perm)=>{

if(permissions.includes(perm)){

setPermissions(permissions.filter(p=>p!==perm))

}else{

setPermissions([...permissions,perm])

}

}

// =======================
// ADD USER
// =======================

const addUser=async(e)=>{

e.preventDefault()

await addDoc(usersCollection,{
name,
email,
password,
permissions,
role:"employee"
})

resetForm()
getUsers()

}

// =======================
// UPDATE USER
// =======================

const updateUser=async(e)=>{

e.preventDefault()

const userRef=doc(db,"users",editingUser)

await updateDoc(userRef,{
name,
email,
password,
permissions
})

resetForm()
getUsers()

}

// =======================
// DELETE USER
// =======================

const deleteUser=async(id)=>{

if(!window.confirm("هل تريد حذف المستخدم ؟")) return

const userRef=doc(db,"users",id)

await deleteDoc(userRef)

getUsers()

}

// =======================
// EDIT USER
// =======================

const editUser=(user)=>{

setEditingUser(user.id)

setName(user.name)
setEmail(user.email)
setPassword(user.password)

setPermissions(user.permissions || [])

window.scrollTo({top:0,behavior:"smooth"})

}

// =======================
// RESET FORM
// =======================

const resetForm=()=>{

setName("")
setEmail("")
setPassword("")
setPermissions([])
setEditingUser(null)

}

// =======================
// SEARCH
// =======================

useEffect(()=>{

const result=users.filter((user)=>

user.name?.toLowerCase().includes(search.toLowerCase()) ||

user.email?.toLowerCase().includes(search.toLowerCase())

)

setFilteredUsers(result)
setCurrentPage(1)

},[search,users])

// =======================
// PAGINATION
// =======================

const indexLast=currentPage*usersPerPage
const indexFirst=indexLast-usersPerPage

const currentUsers=filteredUsers.slice(indexFirst,indexLast)

const totalPages=Math.ceil(filteredUsers.length/usersPerPage)

// =======================
// UI
// =======================

return(

<div className="p-6" dir="rtl">

<h1 className="text-2xl font-bold mb-6">
إدارة المستخدمين
</h1>

{/* ================= FORM ================= */}

<form
onSubmit={editingUser ? updateUser : addUser}
className="bg-white p-6 rounded-xl shadow mb-8"
>

<h2 className="font-bold mb-4 text-lg">

{editingUser ? "تعديل مستخدم" : "إضافة مستخدم"}

</h2>

<input
className="border p-2 w-full mb-3 rounded"
placeholder="الاسم"
value={name}
onChange={(e)=>setName(e.target.value)}
required
/>

<input
className="border p-2 w-full mb-3 rounded"
placeholder="الإيميل"
value={email}
onChange={(e)=>setEmail(e.target.value)}
required
/>

<input
className="border p-2 w-full mb-3 rounded"
placeholder="الباسورد"
value={password}
onChange={(e)=>setPassword(e.target.value)}
required
/>

<p className="font-bold mb-2">
الصلاحيات
</p>

<div className="grid grid-cols-2 gap-2 mb-4">

{permissionsList.map((perm)=>(

<label key={perm.key} className="flex items-center gap-2">

<input
type="checkbox"
checked={permissions.includes(perm.key)}
onChange={()=>handlePermissionChange(perm.key)}
/>

<span>
{perm.label}
</span>

</label>

))}

</div>

<div className="flex gap-2">

<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">

{editingUser ? "تحديث" : "إضافة"}

</button>

{editingUser && (

<button
type="button"
onClick={resetForm}
className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
>

إلغاء

</button>

)}

</div>

</form>

{/* ================= SEARCH ================= */}

<div className="relative mb-4">

<span className="absolute right-3 top-2.5 text-gray-500">
🔍
</span>

<input
placeholder="بحث عن مستخدم..."
className="border pr-9 p-2 w-full rounded"
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

</div>

{/* ================= TABLE ================= */}

<div className="bg-white rounded-xl shadow overflow-hidden">

<table className="w-full">

<thead>

<tr className="bg-gray-100 text-sm">

<th className="p-3">الاسم</th>
<th className="p-3">الإيميل</th>
<th className="p-3">الصلاحيات</th>
<th className="p-3">تعديل</th>
<th className="p-3">حذف</th>

</tr>

</thead>

<tbody>

{currentUsers.map((user)=>(

<tr key={user.id} className="text-center border-t hover:bg-gray-50">

<td className="p-3">
{user.name}
</td>

<td className="p-3">
{user.email}
</td>

<td className="p-3 text-xs">

{user.permissions
?.map(p=>permissionsList.find(x=>x.key===p)?.label)
.join(" , ")}

</td>

<td>

<button
onClick={()=>editUser(user)}
className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
>

تعديل

</button>

</td>

<td>

<button
onClick={()=>deleteUser(user.id)}
className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
>

حذف

</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

{/* ================= PAGINATION ================= */}

<div className="flex gap-2 mt-4 justify-center">

{Array.from({length:totalPages}).map((_,i)=>(

<button
key={i}
onClick={()=>setCurrentPage(i+1)}
className={`px-3 py-1 rounded ${
currentPage===i+1
? "bg-blue-600 text-white"
: "bg-gray-200 hover:bg-gray-300"
}`}
>

{i+1}

</button>

))}

</div>

</div>

)

}

export default UsersAdminPage