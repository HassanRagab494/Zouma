// Layout.jsx
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children }) {
  const [open, setOpen] = useState(true);
  console.log("Layout - setOpen (from useState):", setOpen); 
  console.log("Layout - Type of setOpen (from useState):", typeof setOpen);

  return (
    <div className="d-flex">
      <Sidebar open={open} setOpen={setOpen} />
    </div>
  );
}
export default Layout;