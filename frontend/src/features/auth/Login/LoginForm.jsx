import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginForm.css';
import logo from '../../../assets/logo.png';

const LoginForm = ({onLogin}) => {
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

  const handleSubmit = (e) => {
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
    // Aquí iría la llamada al backend para autenticación
    console.log('Intentando iniciar sesión con:', formData);
    onLogin();

    // Si todo ok, redirigir
    navigate('/Home'); 
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