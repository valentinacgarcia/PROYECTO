import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaMapMarkerAlt, FaMoneyBillWave, FaTags, FaCalendarAlt, FaHome, FaClock } from 'react-icons/fa';
import './ModificarServicio.css';

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MODALITIES = ['presencial', 'domicilio'];
const PRICE_TYPES = ['por_servicio', 'por_hora', 'a_convenir'];

const DatosServicio = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:8000/services/detail/${id}`)
      .then(res => {
        if (res.data.success) setServiceData(res.data.data);
        else alert('Error al cargar el servicio');
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setServiceData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (field, value) => {
    setServiceData(prev => {
      const current = prev[field] || [];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleEditToggle = () => setEditMode(prev => !prev);

  if (loading) return <p className="loading">Cargando servicio...</p>;
  if (!serviceData) return <p className="loading">Servicio no encontrado.</p>;

  return (
    <div className="datos-servicio-container">
      <div className="header-servicio">
        <button className="volver-btn" onClick={() => navigate(-1)}>← Volver</button>
        <h2 className="titulo-servicio">{serviceData.serviceName}</h2>
        <button className="editar-btn" onClick={handleEditToggle}>
          {editMode ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      <div className="contenido-servicio">
        <div className="imagen-servicio">
          <img src={serviceData.photos[0]} alt={serviceData.serviceName} />
        </div>

        <form className="datos-servicio-form" onSubmit={e => e.preventDefault()}>
          <div className="bloque-form">
            <h3>Información General</h3>
            <div className="campo-servicio">
              <FaUser className="icono-campo" />
              <input
                type="text"
                name="serviceName"
                value={serviceData.serviceName}
                disabled={!editMode}
                onChange={handleInputChange}
                placeholder="Nombre del Servicio"
              />
            </div>

            <div className="campo-servicio">
              <FaTags className="icono-campo" />
              <input
                type="text"
                name="category"
                value={serviceData.category}
                disabled={!editMode}
                onChange={handleInputChange}
                placeholder="Categoría"
              />
            </div>

            <div className="campo-servicio">
              <FaMapMarkerAlt className="icono-campo" />
              <input
                type="text"
                name="address"
                value={serviceData.address}
                disabled={!editMode}
                onChange={handleInputChange}
                placeholder="Dirección"
              />
            </div>
          </div>

          <div className="bloque-form">
            <h3>Tarifa y Horario</h3>
            <div className="campo-servicio">
              <FaMoneyBillWave className="icono-campo" />
              <input
                type="number"
                name="price"
                value={serviceData.price}
                disabled={!editMode}
                onChange={handleInputChange}
                placeholder="Precio"
              />
            </div>

            <div className="campo-servicio">
              <FaTags className="icono-campo" />
              <select
                name="priceType"
                value={serviceData.priceType}
                disabled={!editMode}
                onChange={handleInputChange}
              >
                {PRICE_TYPES.map(pt => (
                  <option key={pt} value={pt}>{pt.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div className="campo-servicio">
              <FaClock className="icono-campo" />
              <input
                type="text"
                name="schedule"
                value={serviceData.schedule || ''}
                disabled={!editMode}
                onChange={handleInputChange}
                placeholder="Horario (ej: 09:00 - 18:00)"
              />
            </div>
          </div>

          <div className="bloque-form">
            <h3>Modalidad</h3>
            <div className="campo-servicio checkboxes">
              {MODALITIES.map(mod => (
                <label key={mod}>
                  <input
                    type="checkbox"
                    disabled={!editMode}
                    checked={serviceData.modalities.includes(mod)}
                    onChange={() => handleCheckboxChange('modalities', mod)}
                  />
                  {mod}
                </label>
              ))}
            </div>
          </div>

          <div className="bloque-form">
            <h3>Días Disponibles</h3>
            <div className="campo-servicio checkboxes">
              {DAYS_OF_WEEK.map(day => (
                <label key={day}>
                  <input
                    type="checkbox"
                    disabled={!editMode}
                    checked={serviceData.availabilityDays.includes(day)}
                    onChange={() => handleCheckboxChange('availabilityDays', day)}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>

          <div className="bloque-form">
            <h3>Descripción</h3>
            <textarea
              name="description"
              value={serviceData.description}
              disabled={!editMode}
              onChange={handleInputChange}
              placeholder="Descripción del servicio"
            />
          </div>

          {editMode && <button type="submit" className="guardar-btn">Guardar cambios</button>}
        </form>
      </div>
    </div>
  );
};

export default DatosServicio;
