import { BrowserRouter, Routes, Route } from "react-router-dom";
import Footer from "./Components/Footer/Footer.jsx";
import Navbar from "./Components/Navbar/Navbar.jsx";
import Admin from "./Pages/Admin.jsx";
import Login from "./Pages/Login.jsx";
import ProtectedRoute from "./Components/ProtectedRoute/ProtectedRoute.jsx";


export const backend_url = '/api';
export const currency = '\u20AC';

function App() {
  return (
    <>
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/admin/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Footer />
    </BrowserRouter>
    </>
  );
}

export default App;
