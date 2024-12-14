import React, { createContext, useEffect, useState } from "react";
import { backend_url } from "../App";

export const ShopContext = createContext(null);

export const ShopContextProvider = (props) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getDefaultCart = () => {
    let cart = {};
    for (let i = 0; i < 300; i++) {
      cart[i] = 0;
    }
    return cart;
  };

  const [cartItems, setCartItems] = useState(getDefaultCart());

  useEffect(() => {
    const fetchProductsAndCart = async () => {
      const productsData = await fetch(`${backend_url}/allproducts`).then(res => res.json());
      setProducts(productsData);
      setLoading(false); // Les produits sont chargés

      if (localStorage.getItem("auth-token")) {
        const cartData = await fetch(`${backend_url}/getcart`, {
          method: 'POST',
          headers: {
            'auth-token': `${localStorage.getItem("auth-token")}`,
            'Content-Type': 'application/json',
          },
        }).then(resp => resp.json());
        setCartItems(cartData);
      }
    };
  
    fetchProductsAndCart();
  }, []);

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        try {
          let itemInfo = products.find((product) => product.id === Number(item));
          totalAmount += cartItems[item] * itemInfo.new_price;
        } catch (error) {}
      }
    }
    return totalAmount;
  };

  const getTotalCartItems = () => {
    let totalItem = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        try {
          let itemInfo = products.find((product) => product.id === Number(item));
          totalItem += itemInfo ? cartItems[item] : 0 ;
        } catch (error) {}
      }
    }
    return totalItem;
  };

  const addToCart = (itemId) => {
    if (!localStorage.getItem("auth-token")) {
      alert("Please Login");
      return;
    }
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
    if (localStorage.getItem("auth-token")) {
      fetch(`${backend_url}/addtocart`, {
        method: 'POST',
        headers: {
          Accept: 'application/form-data',
          'auth-token': `${localStorage.getItem("auth-token")}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "itemId": itemId }),
      })
    }
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
    if (localStorage.getItem("auth-token")) {
      fetch(`${backend_url}/removefromcart`, {
        method: 'POST',
        headers: {
          Accept: 'application/form-data',
          'auth-token': `${localStorage.getItem("auth-token")}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "itemId": itemId }),
      })
    }
  };

  const clearCart = () => {
    const newCart = getDefaultCart();
    setCartItems(newCart);
    // Optionnel : vider le panier côté serveur si connecté
    if (localStorage.getItem("auth-token")) {
      fetch(`${backend_url}/clearcart`, {
        method: 'POST',
        headers: {
          'auth-token': `${localStorage.getItem("auth-token")}`,
          'Content-Type': 'application/json',
        }
      })
    }
  };
  const contextValue = { products, loading, getTotalCartItems, cartItems, addToCart, removeFromCart, getTotalCartAmount, clearCart  };
  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
