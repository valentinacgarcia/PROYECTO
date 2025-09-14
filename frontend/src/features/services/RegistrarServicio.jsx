import React, { useState } from 'react';
import './RegistrarServicio.css'; 
const ServiceForm = () => {
  const [formData, setFormData] = useState({
    serviceType: '',
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    experience: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Datos del formulario:', formData);
    alert('¡Formulario enviado con éxito!');
  };

  return (
    <div className="service-form__container">
      <div className="service-form__wrapper">
        <h2 className="service-form__title">Registra tu Servicio</h2>
        <p className="service-form__subtitle">
          Completa el formulario para unirte a nuestra comunidad y conectar con dueños de mascotas.
        </p>

        <form onSubmit={handleSubmit} className="service-form__form">
          <div className="service-form__section">
            <h3 className="service-form__section-title">Información del Servicio</h3>
            <div className="service-form__group">
              <label htmlFor="serviceType">Tipo de Servicio</label>
              <select
                id="serviceType"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona un tipo</option>
                <option value="veterinaria">Veterinaria</option>
                <option value="peluqueria">Peluquería</option>
                <option value="paseadores">Paseadores</option>
                <option value="cuidadores">Cuidadores</option>
                <option value="adiestradores">Adiestradores</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            <div className="service-form__group">
              <label htmlFor="name">Nombre del Prestador / Empresa</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Clínica Veterinaria El Sol"
                required
              />
            </div>

            <div className="service-form__group">
              <label htmlFor="description">Descripción del Servicio</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe tu servicio, experiencia, horario y tarifas."
                rows="5"
                required
              />
            </div>
          </div>

          <div className="service-form__section">
            <h3 className="service-form__section-title">Datos de Contacto</h3>
            <div className="service-form__group">
              <label htmlFor="phone">Número de Teléfono</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ej: +54 9 11 1234 5678"
                required
              />
            </div>

            <div className="service-form__group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ej: correo@ejemplo.com"
                required
              />
            </div>

            <div className="service-form__group">
              <label htmlFor="address">Área de Cobertura / Dirección</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Ej: Barrio de Palermo, CABA"
                required
              />
            </div>
          </div>

          <button type="submit" className="service-form__submit-button">
            Registrar Servicio
          </button>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;