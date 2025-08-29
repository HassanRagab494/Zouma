import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="d-flex">
      <div className={`sidebar-container ${open ? "open" : "collapsed"}`}>
        <Sidebar open={open} setOpen={setOpen} />
      </div>


      <div className="flex-grow-1">
        <Navbar setOpen={setOpen} />
        <main className="p-3">{children}</main>
      </div>
    </div>
  );
}
export default Layout;
