import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RegisterForm.css'; 
import logo from '../../../assets/logo.png';
import { buildApiUrl } from '../../../config/api';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    contraseña: "",
    confirmarContraseña: "",
    terminos: false,
  });

  const [formError, setFormError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nombre.trim() || !formData.email.trim() || !formData.contraseña.trim() || !formData.confirmarContraseña.trim()) {
      setFormError("Todos los campos son obligatorios.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setFormError("El email es inválido.");
      return;
    }

    if (formData.contraseña !== formData.confirmarContraseña) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }

    if (!formData.terminos) {
      setFormError("Debes aceptar los términos y condiciones.");
      return;
    }

    setFormError("");

    axios.post(buildApiUrl('/user/create'), {
      name: formData.nombre,
      email: formData.email,
      password: formData.contraseña,
      terms: formData.terminos,
    })
      .then(() => navigate('/login'))
      .catch(() => setFormError('Hubo un problema al registrar. Intente más tarde.'));
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <img src={logo} alt="Logo" className='form-logo' />
        <h2 className='form-title'>Crea tu cuenta</h2>

        {formError && <p className="form-error">{formError}</p>}

        <label>Nombre</label>
        <input type="text" name="nombre" placeholder="Ingrese su nombre" value={formData.nombre} onChange={handleChange} />

        <label>Email</label>
        <input type="text" name="email" placeholder="ejemplo@correo.com" value={formData.email} onChange={handleChange} autoComplete="off" />

        <label>Contraseña</label>
        <input type="password" name="contraseña" placeholder="Ingrese una contraseña" value={formData.contraseña} onChange={handleChange} />

        <label>Confirmar contraseña</label>
        <input type="password" name="confirmarContraseña" placeholder="Confirme la contraseña" value={formData.confirmarContraseña} onChange={handleChange} />

        <div className="checkbox-group-registro">
          <input type="checkbox" id="terminos" name="terminos" checked={formData.terminos} onChange={handleChange} />
          <label htmlFor="terminos">Acepto los <a href="#">términos y condiciones</a></label>
        </div>

        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
};

export default RegisterForm;
