import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
//import "dotenv/config";
import React from "react";
import Navbar  from "./Components/Navbar/Navbar.jsx";
import Shop from "./Pages/Shop.jsx";
import Cart from "./Pages/Cart.jsx";
import Product from "./Pages/Product.jsx";
import Footer from "./Components/Footer/Footer.jsx";
import ShopCategory from "./Pages/ShopCategory.jsx";
import women_banner from "./Components/Assets/banner_women.png";
import men_banner from "./Components/Assets/banner_mens.png";
import kid_banner from "./Components/Assets/banner_kids.png";
import LoginSignup from "./Pages/LoginSignup.jsx";

export const backend_url = `/api`;
export const currency = '$';

function App() {

  return (
    <>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<Shop gender="all" />} />
            <Route path="/mens" element={<ShopCategory banner={men_banner} category="men" />} />
            <Route path="/womens" element={<ShopCategory banner={women_banner} category="women" />} />
            <Route path="/kids" element={<ShopCategory banner={kid_banner} category="kid" />} />
            <Route path='/product' element={<Product />}>
              <Route path=':productId' element={<Product />} />
            </Route>
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<LoginSignup/>} />
          </Routes>
          <Footer />
        </Router>
    </>
  )
}

export default App
