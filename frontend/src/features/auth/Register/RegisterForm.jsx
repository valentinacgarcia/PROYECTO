import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterForm.css'; 
import logo from '../../../assets/logo.png';

/* CONSTRUCCION DEL FORM */
const RegisterForm = () => {

  //Estado para cada campo
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    contraseña: "",
    confirmarContraseña: "",
    terminos: false,
  });

  // Estado para errores
  const [formError, setFormError] = useState("");

  /* estado para datos enviados
  const [submittedData, setSubmittedData] = useState(null); */

  // Manejar cambios en inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  //Hook
  const navigate = useNavigate();

  //Manejo del submit
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar campos
    if (
      !formData.nombre.trim() ||
      !formData.apellido.trim() ||
      !formData.email.trim() ||
      !formData.telefono.trim() ||
      !formData.contraseña.trim() ||
      !formData.confirmarContraseña.trim()
    ) {
      setFormError("Todos los campos son obligatorios.");
      return;
    }

    // Validación específica del email:
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(formData.email)) {
      setFormError("El email es inválido.");
      return;
    }

    // Validar que las contraseñas coincidan
    if (formData.contraseña !== formData.confirmarContraseña) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }

    //Validacion terminos
    if (!formData.terminos) {
      setFormError("Debes aceptar los términos y condiciones.");
      return;
    }

    setFormError("");
    //setSubmittedData(formData);
    console.log("Formulario válido:", formData);
    navigate('/login')
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <img src={logo} alt="Logo" className='form-logo' />
        <h2 className='form-Title'>Crea tu cuenta</h2>

        {formError && <p className="form-error">{formError}</p>}

        <label htmlFor="Nombre">Nombre</label>
        <input type="text" name="nombre" placeholder="Ingrese su nombre" value={formData.nombre} onChange={handleChange} />
        

        <label htmlFor="Apellido">Apellido</label>
        <input type="text" name="apellido" placeholder="Ingrese su apellido" value={formData.apellido} onChange={handleChange} />
        
        <label htmlFor="Email">Email</label>
        <input type="text" name="email" placeholder="ejemplo@correo.com" value={formData.email} onChange={handleChange} autoComplete="off" />

        <label htmlFor="Direccion">Direccion</label>
        <input type="text" name="direccion" placeholder="Ingrese su direccion" value={formData.contraseña} onChange={handleChange}/>
        
        <label htmlFor="telefono">Teléfono</label>
        <input type="tel" name="telefono" placeholder='Ej: 1183489432'value={formData.telefono} onChange={handleChange}/>
        
        <label htmlFor="Contraseña">Contraseña</label>
        <input type="password" name="contraseña" placeholder="Ingrese una contraseña" value={formData.contraseña} onChange={handleChange}/>
        
        <label htmlFor="ConfirmarContraseña">Confirmar contraseña</label>
        <input type="password" name="confirmarContraseña" placeholder="Confirme la contraseña" value={formData.confirmarContraseña} onChange={handleChange}/>
        
        <div className="form-group checkbox-group">
          <input type="checkbox" id="terminos" name="terminos" checked={formData.terminos} onChange={handleChange}/>
          <label htmlFor="terminos"> Acepto los <a href="#">términos y condiciones</a> </label>
        </div>

        <button type="submit">Registrarse</button>
      </form>
    </div>
  );
};
 

export default RegisterForm;