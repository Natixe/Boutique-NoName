import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/admin/login', { email, password });
      localStorage.setItem('token', response.data.token);
      navigate('/admin/');
    } catch (error) {
      alert(error.response.data.message || 'Erreur de connexion.');
    }
  };
  console.log("Paswword = ", password)
  console.log("Email = ", email)

  return (
    <div className="login-container">
      <h2>Connexion Administrateur</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Adresse email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
};

export default Login;