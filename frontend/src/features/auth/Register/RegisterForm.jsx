import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RegisterForm.css';
import logo from '../../../assets/logo.png';

const RegisterForm = () => {
  const [formData, setFormData] = useState({
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

    // Validar email
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(formData.email)) {
      setFormError("El email es inválido.");
      return;
    }

    // Validar contraseña
    if (formData.contraseña.length < 8) {
      setFormError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    // Validar confirmación
    if (formData.contraseña !== formData.confirmarContraseña) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }

    // Validar términos
    if (!formData.terminos) {
      setFormError("Debes aceptar los términos y condiciones.");
      return;
    }

    setFormError("");

    // Conexion back
    axios.post('http://localhost:8000/user/create', {
      email: formData.email,
      password: formData.contraseña,
      terminos: formData.terminos
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((response) => {
        console.log('Registro exitoso:', response.data);
        navigate('/login', { state: { registeredEmail: formData.email } });
      })
      .catch((error) => {
        console.error('Error:', error);
        if (error.response && error.response.status === 409) {
          setFormError("Ya existe un usuario con ese email.");
        } else {
          setFormError("Hubo un problema al registrar. Intente más tarde.");
        }
      });
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <img src={logo} alt="Logo" className='form-logo' />
        <h2 className='form-Title'>Crea tu cuenta</h2>

        {formError && <p className="form-error">{formError}</p>}

        <label htmlFor="Email">Email</label>
        <input
          type="email"
          name="email"
          placeholder="ejemplo@correo.com"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label htmlFor="Contraseña">Contraseña</label>
        <input
          type="password"
          name="contraseña"
          placeholder="Ingrese una contraseña"
          value={formData.contraseña}
          onChange={handleChange}
          required
        />

        <label htmlFor="ConfirmarContraseña">Confirmar contraseña</label>
        <input
          type="password"
          name="confirmarContraseña"
          placeholder="Confirme la contraseña"
          value={formData.confirmarContraseña}
          onChange={handleChange}
          required
        />

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="terminos"
              checked={formData.terminos}
              onChange={handleChange}
            />
            <span>
              Acepto los <a href="#">términos y condiciones</a>
            </span>
          </label>
        </div>

        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
};

export default RegisterForm;
