import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Route, Routes } from "react-router-dom";
import "./CSS/Admin.css";

//import Login from "./Login";


import Sidebar from "../Components/Sidebar/Sidebar";
import ListProduct from "../Components/ListProduct/ListProduct";
import AddProduct from "../Components/AddProduct/AddProduct";
import NombreDeVisit from "../Components/DashBoard/Graphique/NombreDeVisit";
import DashBoard from "../Components/DashBoard/DashBoard";

const Admin = () => {
  //const navigate = useNavigate();
//
  //useEffect(() => {
  //  const token = localStorage.getItem('token');
  //  if (!token) {
  //    navigate('/admin/login');
  //  }
  //}, [navigate]);

  return (
    <div className="admin">
      <Sidebar />
      <Routes>
        {/*<Route path="/admin/login" element={<Login />} />*/}
        <Route path="/admin/" element={<DashBoard />} />
        <Route path="/admin/addproduct" element={<AddProduct />} />
        <Route path="/admin/nombredevisit" element={<NombreDeVisit />} />
        <Route path="/admin/listproduct" element={<ListProduct />} />
      </Routes>
    </div>
  );
};

export default Admin;
