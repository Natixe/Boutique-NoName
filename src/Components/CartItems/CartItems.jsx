import React, { useContext } from "react";
import "./CartItems.css";
import cross_icon from "../Assets/cart_cross_icon.png";
import { ShopContext } from "../../Context/ShopContext";
import { backend_url, currency } from "../../App";
import { Link } from 'react-router-dom'

const CartItems = () => {
  const {products} = useContext(ShopContext);
  const {cartItems,removeFromCart,getTotalCartAmount} = useContext(ShopContext);

  const handleRemoveFromCart = async (productId) => {
    // Mise à jour du contexte local
    removeFromCart(productId);
  
    // Appel à l'API backend pour mettre à jour le panier
    await fetch(`${backend_url}/api/cart/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId, action: 'remove' }),
    });
  };

  return (
    <div className="cartitems">
      <div className="cartitems-format-main">
        <p>Products</p>
        <p>Title</p>
        <p>Price</p>
        <p>Quantity</p>
        <p>Total</p>
        <p>Remove</p>
      </div>
      <hr />
      {products.map((e) => {
        if (cartItems[e.id] !== 0) {
          return (
            <div>
               <div className="cartitems-format-main cartitems-format">
                 <img className="cartitems-product-icon" src={backend_url+e.image} alt="" />
                 <p cartitems-product-title>{e.name}</p>
                 <p>{currency}{e.new_price}</p>
                 <button className="cartitems-quantity">{cartItems[e.id]}</button>
                 <p>{currency}{e.new_price*cartItems[e.id]}</p>
                 <img onClick={()=>{handleRemoveFromCart(e.id)}} className="cartitems-remove-icon" src={cross_icon} alt="" />
               </div>
                <hr />
            </div>
          );
          } else {
            return null;
          }
        })}
      
      <div className="cartitems-down">
        <div className="cartitems-total">
          <h1>Cart Totals</h1>
          <div>
            <div className="cartitems-total-item">
              <p>Subtotal</p>
              <p>{currency}{getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <p>Shipping Fee</p>
              <p>Free</p>
            </div>
            <hr />
            <div className="cartitems-total-item">
              <h3>Total</h3>
              <h3>{currency}{getTotalCartAmount()}</h3>
            </div>
          </div>
          <Link to='/checkout' style={{ textDecoration: 'none' }}>
            PROCEED TO CHECKOUT
          </Link>
        </div>
        <div className="cartitems-promocode">
          <p>If you have a promo code, Enter it here</p>
          <div className="cartitems-promobox">
            <input type="text" placeholder="promo code" />
            <button>Submit</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItems;
