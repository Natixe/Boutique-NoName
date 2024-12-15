import React, { useContext, useState, useRef, useEffect } from "react";
import {
  PayPalScriptProvider,
  PayPalButtons,
  PayPalCardFieldsProvider,
  PayPalNameField,
  PayPalNumberField,
  PayPalExpiryField,
  PayPalCVVField,
  usePayPalCardFields,
} from "@paypal/react-paypal-js";
import { ShopContext } from "../../../Context/ShopContext";
import { backend_url } from "../../../App";
import "./PaypalButton.css";

function Message({ content }) {
  return <p>{content}</p>;
}

const SubmitPayment = ({ isPaying, setIsPaying, billingAddress }) => {
  const { cardFieldsForm } = usePayPalCardFields();

  const handleClick = async () => {
    if (!cardFieldsForm) {
      alert("Les champs de paiement ne sont pas disponibles.");
      return;
    }
    const formState = await cardFieldsForm.getState();

    if (!formState.isFormValid) {
      alert("Le formulaire de paiement est invalide.");
      return;
    }
    setIsPaying(true);

    cardFieldsForm.submit({ billingAddress }).catch((err) => {
      console.error("Erreur lors du paiement :", err);
      setIsPaying(false);
    });
  };

  return (
    <button
      className={isPaying ? "btn" : "btn btn-primary"}
      style={{ float: "right" }}
      onClick={handleClick}
    >
      {isPaying ? <div className="spinner tiny" /> : "Payer"}
    </button>
  );
};

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
  const [isPaying, setIsPaying] = useState(false);

  const [billingAddress, setBillingAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    adminArea1: "",
    adminArea2: "",
    countryCode: "",
    postalCode: "",
  });

  const initialOptions = {
    "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
    "enable-funding": "venmo",
    "disable-funding": "",
    currency: "EUR",
    "data-page-type": "product-details",
    components: "buttons,card-fields",
    "data-sdk-integration-source": "developer-studio",
    intent: "capture",
  };

  const validateEmail = (email) => {
    const regex = /^[a-zA-Z0-9.!#$%&'*+/?^_`|~-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,64}$/;
    return regex.test(email);
  };

  const validateName = (name) => {
    const regex =
      /^[a-zA-ZàáâäãåçèéêëìíîïñòóôöõùúûüýÿÀÁÂÄÃÅÇÈÉÊËÌÍÎÏÑÒÓÔÖÕÙÚÛÜÝŸ' -]{2,20}$/;
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

  const handleBillingAddressChange = (field, value) => {
    setBillingAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
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
    Object.keys(cartItems).forEach((id) => {
      const exists = products.some((product) => product.id === Number(id));
      if (!exists && cartItems[id] > 0) {
        console.warn(
          `Produit avec ID ${id} manquant dans la liste des produits.`
        );
      }
    });
  }, [cartItems, products]);

  const createOrderData = () => {
    return products
      .filter((product) => cartItems[product.id] > 0)
      .map((product) => ({
        name: product.name,
        unit_amount: {
          currency_code: "EUR",
          value: parseFloat(product.new_price).toFixed(2),
        },
        quantity: cartItems[product.id],
      }));
  };

  const createOrder = async () => {
    const cart = createOrderData(); // génère le tableau cart
    if (!handleBeforeCreateOrder()) {
      setMessage("Vérifiez vos informations.");
      return;
    }
  
    try {
      const response = await fetch(`${backend_url}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cart }),
      });
      const orderData = await response.json();
      if (orderData.id) {
        return orderData.id;
      } else {
        throw new Error("Erreur lors de la création de la commande.");
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de la création de la commande.", error);
      setMessage("Erreur lors de la création de la commande.");
    }
  };

  const onApprove = async (data, actions) => {
    try {
      const orderDetails = products
        .filter((product) => cartItems[product.id] > 0)
        .map((product) => ({
          name: product.name,
          quantity: cartItems[product.id],
          unit_amount: {
            value: parseFloat(product.new_price).toFixed(2),
          },
        }));
  
      const captureResponse = await fetch(
        `${backend_url}/orders/${data.orderID}/capture`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailRef.current,
            name: nameRef.current,
            billingAddress,
            cartItems: orderDetails,
          }),
        }
      );
  
      const captureData = await captureResponse.json();
      if (captureData.status === "COMPLETED") {
        setMessage("Paiement réussi !");
        setIsPaying(false);
        // Vider le panier
      } else {
        setMessage("Le paiement n'a pas pu être complété.");
      }
    } catch (error) {
      console.error("Erreur lors de la capture de la commande :", error);
      setMessage("Une erreur est survenue lors de la capture du paiement.");
      setIsPaying(false);
    }
  };

  const onError = (error) => {
    console.error("Erreur PayPal :", error);
    setMessage("Une erreur est survenue lors du traitement du paiement.");
    setIsPaying(false);
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
              className={`InputName ${
                !isValidName && touched ? "invalid" : ""
              }`}
              placeholder=" Nom * "
              type="text"
              onChange={handleNameChange}
              onBlur={handleBlurName}
              value={name}
            />
            {!isValidName && touched && (
              <p className="error-message">Entrez un nom valide</p>
            )}
          </div>
          <div className="EnterMail">
            <input
              className={`InputMail ${
                !isValidEmail && touched ? "invalid" : ""
              }`}
              placeholder=" Adresse e-mail *"
              type="email"
              onChange={handleEmailChange}
              onBlur={handleBlurEmail}
              value={email}
            />
            {!isValidEmail && touched && (
              <p className="error-message">Entrez une adresse e-mail valide</p>
            )}
          </div>
        </label>
      </div>
      <div className="App">
        <PayPalScriptProvider options={initialOptions}>
          <PayPalButtons
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onError}
            style={{
              shape: "pill",
              layout: "vertical",
              color: "black",
              label: "paypal",
            }} 
          />
          <PayPalCardFieldsProvider
              createOrder={createOrder}
              onApprove={onApprove}
              onError={(err) => {
                  // redirect to your specific error page
                  window.location.assign("/your-error-page-here");
              }}

              style={{
                  input: {
                      "font-size": "16px",
                      "font-family": "courier, monospace",
                      "font-weight": "lighter",
                      color: "#ccc",
                  },
                  ".invalid": { color: "purple" },
              }}
          >
              <PayPalNameField
                  style={{
                      input: { color: "blue" },
                      ".invalid": { color: "purple" },
                  }}
              />
              <PayPalNumberField />
              <PayPalExpiryField />
              <PayPalCVVField />

              {/* Custom client component to handle card fields submission */}
              <SubmitPayment isPaying={isPaying} setIsPaying={setIsPaying} />
          </PayPalCardFieldsProvider>
        </PayPalScriptProvider>
        {message && <Message content={message} />}
      </div>
    </>
  );
};