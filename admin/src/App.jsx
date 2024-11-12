import { BrowserRouter } from "react-router-dom";
import Footer from "./Components/Footer/Footer";
import Navbar from "./Components/Navbar/Navbar";
import Admin from "./Pages/Admin";
import React from "react";

export const backend_url = 'http://localhost:8888/api';
export const currency = '\u20AC';

function App() {

  return (
    <>
    <BrowserRouter>
      <div>
        <Navbar />
        <Admin />
        <Footer />
      </div>
    </BrowserRouter>
    </>
  )
}

export default App
