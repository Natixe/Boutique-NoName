import React, { useContext, useState, useRef, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { ShopContext } from "../../../Context/ShopContext";
import { backend_url } from "../../../App"; // Import du backend_url
import "./PaypalButton.css";

function Message({ content }) {
  return <p>{content}</p>;
}

export const PaypalButton = () => {
  const { cartItems, products, loading } = useContext(ShopContext);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const emailRef = useRef("");
  const nameRef = useRef("");
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState(false);
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [isValidName, setIsValidName] = useState(false);

  const initialOptions = {
    "client-id": import.meta.env.PAYPAL_CLIENT_ID,
    currency: "EUR",
    components: "buttons",
    intent: "capture", // Ajoutez l'intention si nécessaire
  };

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9.!#$%&'*+/?^_`|~-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,64}$/;
    return regex.test(email);
  };

  const validateName = (name) => {
    const regex = /^[a-zA-ZàáâäãåçèéêëìíîïñòóôöõùúûüýÿÀÁÂÄÃÅÇÈÉÊËÌÍÎÏÑÒÓÔÖÕÙÚÛÜÝŸ' -]{2,20}$/;
    return regex.test(name);
  };

  const handleBlurEmail = () => {
    setTouched(true);
    const isValid = validateEmail(email);
    setIsValidEmail(isValid);
  };

  const handleBlurName = () => {
    setTouched(true);
    setIsValidName(validateName(nameRef.current));
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    emailRef.current = e.target.value;
    if (touched) {
      setIsValidEmail(validateEmail(e.target.value));
    }
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    nameRef.current = e.target.value;
    if (touched) {
      setIsValidName(validateName(e.target.value));
    }
  };

  const handleBeforeCreateOrder = () => {
    const validEmail = validateEmail(emailRef.current);
    const validName = validateName(nameRef.current);

    if (!validName && !validEmail) {
      setMessage("Veuillez saisir un nom et une adresse mail valides.");
      return false;
    } else if (!validName) {
      setMessage("Veuillez saisir un nom valide.");
      return false;
    } else if (!validEmail) {
      setMessage("Veuillez saisir une adresse mail valide.");
      return false;
    } else {
      setMessage("");
      return true;
    }
  };

  useEffect(() => {
    Object.keys(cartItems).forEach(id => {
      const exists = products.some(product => product.id === Number(id));
      if (!exists && cartItems[id] > 0) {
        console.warn(`Produit avec ID ${id} manquant dans la liste des produits.`);
      }
    });
  }, [cartItems, products]);

  const createOrderData = () => {
    return products
      .filter(product => cartItems[product.id] > 0)
      .map(product => ({
        name: product.name,
        unit_amount: {
          currency_code: 'EUR',
          value: parseFloat(product.new_price).toFixed(2),
        },
        quantity: cartItems[product.id],
      }));
  };

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <>
      <div>
        <label className="ContainerInput">
          <div className="EnterName">
            <div className="ContactMailText">Contact :</div>
            <input
              className={`InputName ${!isValidName && touched ? "invalid" : ""}`}
              placeholder=" Nom * "
              type="text"
              onChange={handleNameChange}
              onBlur={handleBlurName}
              value={name}
            />
            {!isValidName && touched && <p className="error-message">Entrez un nom valide</p>}
          </div>
          <div className="EnterMail">
            <input
              className={`InputMail ${!isValidEmail && touched ? "invalid" : ""}`}
              placeholder=" Adresse e-mail *"
              type="email"
              onChange={handleEmailChange}
              onBlur={handleBlurEmail}
              value={email}
            />
            {!isValidEmail && touched && <p className="error-message">Entrez une adresse e-mail valide</p>}
          </div>
        </label>
      </div>
      <div className="App">
        <PayPalScriptProvider options={initialOptions}>
          <PayPalButtons
            style={{ 
              shape: "rect", 
              layout: "vertical", 
              color: "silver", 
              label: "buynow", 
            }}
            onClick={(data, actions) => {
              if (!handleBeforeCreateOrder()) {
                return actions.reject();
              }
              return actions.resolve();
            }}
            createOrder={() => {
              const cart = createOrderData();
              return fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cart }),
              })
              .then(res => res.json())
              .then(data => data.id);
            }}
            onApprove={data => {
              const orderDetails = products
                .filter(product => cartItems[product.id] > 0)
                .map(product => ({
                  name: product.name,
                  quantity: cartItems[product.id],
                  unit_amount: {
                    value: parseFloat(product.new_price).toFixed(2),
                  },
                }));
            
              return fetch(`/api/orders/${data.orderID}/capture`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, cartItems: orderDetails }),
              })
                .then(res => res.json())
                .then(() => alert('Commande confirmée !'));
            }}
          />
        </PayPalScriptProvider>
        {message && <Message content={message} />}
      </div>
    </>
  );
};