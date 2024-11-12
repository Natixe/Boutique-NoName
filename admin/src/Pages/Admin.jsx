import React from "react";
import { Route, Routes } from "react-router-dom";
import "./CSS/Admin.css";




import Sidebar from "../Components/Sidebar/Sidebar";
import ListProduct from "../Components/ListProduct/ListProduct";
import AddProduct from "../Components/AddProduct/AddProduct";
import DashBoard from "../Components/DashBoard/DashBoard";

const Admin = () => {

  return (
    <div className="admin">
      <Sidebar />
      <Routes>
        <Route path="/" element={<DashBoard />} />
        <Route path="/addproduct" element={<AddProduct />} />
        <Route path="/listproduct" element={<ListProduct />} />
      </Routes>
    </div>
  );
};

export default Admin;
