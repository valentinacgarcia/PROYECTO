import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginForm.css';
import logo from '../../../assets/logo.png';

const LoginForm = ({ onLogin }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    contraseña: '',
  });

  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación básica
    if (!formData.email.trim() || !formData.contraseña.trim()) {
      setFormError('Por favor complete todos los campos.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setFormError('El email es inválido.');
      return;
    }

    setFormError('');

    try {
      const response = await axios.post('http://localhost:8000/user/sesion', {
        email: formData.email,
        password: formData.contraseña, // importante: backend espera "password"
      });

      const userData = response.data;

      // Guardar usuario en localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      if (onLogin) onLogin(); 
      navigate('/Home');

    } catch (error) {
      console.error('Error en login:', error);
      
      if (error.response) {
        // El servidor respondió con un código de error
        if (error.response.status === 401) {
          setFormError('Email o contraseña incorrectos.');
        } else {
          setFormError('Error al intentar iniciar sesión. Intente más tarde.');
        }
      } else if (error.request) {
        // No hubo respuesta del servidor
        setFormError('No se pudo conectar al servidor.');
      } else {
        // Error en la configuración de la request
        setFormError('Error inesperado. Intente más tarde.');
      }
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <img src={logo} alt="Logo" className="form-logo" />
        <h2 className="form-title">¡Bienvenido!</h2>

        <label htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          placeholder="ejemplo@correo.com"
          value={formData.email}
          onChange={handleChange}
        />

        <label htmlFor="contraseña">Contraseña</label>
        <input
          type="password"
          name="contraseña"
          placeholder="Ingrese su contraseña"
          value={formData.contraseña}
          onChange={handleChange}
        />

        {formError && <p className="form-error">{formError}</p>}

        <button type="submit">Entrar</button>

        <p className="switch-form">
          <Link to="/forgot-password" className="link">¿Olvidaste tu contraseña?</Link>
        </p>

        <p className="switch-form">
          ¿No tenés cuenta?{' '}
          <Link to="/register" className="link">
            Registrate aquí
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;