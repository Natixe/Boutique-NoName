import { useContext, useState, useEffect } from 'react';
import { PaypalButton } from "../Paymentmethode/PayPalButtoncheckout/PaypalButton";
import { ShopContext } from "../../Context/ShopContext";
import "./checkout.css";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CartItemInfoCheckout } from "./cart-itemInfoCheckout";

export const Checkout = () => {
  const { cartItems, getTotalCartAmount, products } = useContext(ShopContext);
  const totalAmount = getTotalCartAmount();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 500);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 500);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <motion.div>
        {totalAmount > 0 ? (
          <motion.div className='CheckoutContainer'>
            {isMobile ? (
              <>
                <div className='InformationCardContainer'>
                  <div className='cartInformation'>
                    {products.map((product) => {
                      if (cartItems[product.id] > 0) {
                        return <CartItemInfoCheckout key={product.id} data={product} />;
                      }
                      return null;
                    })}
                    <div className='ContainerTotalInfo'>
                      <div className='TotalInfo'>
                        <div className='TotalInfotext'>Total : </div>
                        <div className='EuroInfotext'>{totalAmount} €</div>
                      </div>
                    </div>
                    <div className='MethodPayment'>
                      <div className='PayPalButton'>
                        <PaypalButton />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className='BOXLEFTContainer'></div>
                <div className='ContainerMethodInfo'>
                  <div className='ContainerPayment'>
                    <div className='BOXLEFTMethodPayment'></div>
                    <div className='MethodPayment'>
                      <div className='PayPalButton'>
                        <PaypalButton />
                      </div>
                    </div>
                    <div className='BOXRIGHTMethodPayment'></div>
                  </div>
                  <div className='InformationCardContainer'>
                    <div className='cartInformation'>
                      {products.map((product) => {
                        if (cartItems[product.id] > 0) {
                          return <CartItemInfoCheckout key={product.id} data={product} />;
                        }
                        return null;
                      })}
                      <div className='ContainerTotalInfo'>
                        <div className='TotalInfo'>
                          <div className='TotalInfotext'>Total : </div>
                          <div className='EuroInfotext'>{totalAmount} €</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='BOXRIGHTContainer'></div>
              </>
            )}
          </motion.div>
        ) : (
          <h1>Votre panier est vide</h1>
        )}
      </motion.div>
    </>
  );
};