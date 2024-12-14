import { useContext } from "react";
import { ShopContext } from "../../Context/ShopContext";

export const CartItemInfoCheckout = (props) => {
  const { id, name, new_price, image } = props.data;
  const { cartItems } = useContext(ShopContext);

  return (
    <div className='ItemsCheckout'>
      <div className="ContainerformationImageinfo">
        <img className="formationImageinfo" src={image} alt={name} />
      </div>
      <div className='descriptionInfo'>
        <p className="DescriptionFormationInfo">
          <b className="TextDescriptionFormationInfo"> {name}</b>
        </p>
        <p className="price">{new_price}€</p>
        <div className="BOXCHECKOUT01"></div>
        <div className="contHandler">
          <input
            type="number"
            min="1"
            size="2"
            className="CartInput"
            value={cartItems[id]}
            readOnly
          />
        </div>
      </div>
    </div>
  );
};