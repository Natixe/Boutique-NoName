import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddProduct.css";
import upload_area from "../Assets/upload_area.svg";

const AddProduct = () => {
  const [productDetails, setProductDetails] = useState({
    name: "",
    description: "",
    image: null,
    category: "",
    new_price: "",
    old_price: ""
  });

  const backend_url = 'http://localhost:8888/api';
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    
    setProductDetails((prevDetails) => ({
      ...prevDetails,
      [name]: name === 'image' ? files[0] : value,
    }));
  };

  const addProduct = async () => {
    try {
      // Upload de l'image
      const formData = new FormData();
      formData.append('product', productDetails.image);

      const uploadResponse = await fetch(`${backend_url}/upload`, {
        method: 'POST',
        body: formData,
      });

      let uploadData;
      if (uploadResponse.headers.get('Content-Type')?.includes('application/json')) {
        uploadData = await uploadResponse.json();
      } else {
        const text = await uploadResponse.text();
        throw new Error(text || 'Échec de l\'upload de l\'image');
      }

      if (!uploadResponse.ok) {
        throw new Error(uploadData.message || 'Échec de l\'upload de l\'image');
      }

      // Préparation des données du produit
      const product = {
        ...productDetails,
        image: uploadData.image_url,
      };

      // Ajout du produit
      const addProductResponse = await fetch(`${backend_url}/addproduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(product),
      });

      let addProductData;
      if (addProductResponse.headers.get('Content-Type')?.includes('application/json')) {
        addProductData = await addProductResponse.json();
      } else {
        const text = await addProductResponse.text();
        throw new Error(text || 'Échec de l\'ajout du produit');
      }

      if (!addProductResponse.ok) {
        throw new Error(addProductData.message || 'Échec de l\'ajout du produit');
      }

      alert('Produit ajouté avec succès');
      navigate('/listproduct');
    } catch (error) {
      console.error('Erreur:', error.message);
      alert(`Erreur: ${error.message}`);
    }
  };

  return (
    <>
      <div className="addproduct">
        <div className="addproduct-itemfield">
          <p>Product title</p>
          <input type="text" name="name" value={productDetails.name} onChange={handleInputChange} placeholder="Type here" />
        </div>
        <div className="addproduct-itemfield">
          <p>Product description</p>
          <input type="text" name="description" value={productDetails.description} onChange={handleInputChange} placeholder="Type here" />
        </div>
        <div className="addproduct-price">
          <div className="addproduct-itemfield">
            <p>Price</p>
            <input type="number" name="old_price" value={productDetails.old_price} onChange={handleInputChange} placeholder="Type here" />
          </div>
          <div className="addproduct-itemfield">
            <p>Offer Price</p>
            <input type="number" name="new_price" value={productDetails.new_price} onChange={handleInputChange} placeholder="Type here" />
          </div>
        </div>
        <div className="addproduct-itemfield">
          <p>Product category</p>
          <select value={productDetails.category} name="category" className="add-product-selector" onChange={handleInputChange}>
            <option value="women">Women</option>
            <option value="men">Men</option>
            <option value="kid">Kid</option>
          </select>
        </div>
        <div className="addproduct-itemfield">
          <p>Product image</p>
          <label htmlFor="file-input">
            <img className="addproduct-thumbnail-img" src={!productDetails.image ? upload_area : URL.createObjectURL(productDetails.image)} alt="" />
          </label>
          <input onChange={handleInputChange} type="file" name="image" id="file-input" accept="image/*" hidden />
        </div>
        <button className="addproduct-btn" onClick={addProduct}>ADD</button>
      </div>
    </>
  );
};

export default AddProduct;
