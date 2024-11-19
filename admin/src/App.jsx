import { BrowserRouter } from "react-router-dom";
import Footer from "./Components/Footer/Footer.jsx";
import Navbar from "./Components/Navbar/Navbar.jsx";
import Admin from "./Pages/Admin.jsx";
export const backend_url = '/api';
export const currency = '\u20AC';

function App() {
  return (
    <>
      <BrowserRouter>
        <Navbar />
        <Admin />
        <Footer />
      </BrowserRouter>
    </>
  );
}

export default App;
