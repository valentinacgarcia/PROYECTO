import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiMapPin, FiClock, FiUser, FiMail, FiTag, FiHome } from 'react-icons/fi';
import { FaCalendarAlt, FaCamera, FaMoneyBillWave } from 'react-icons/fa';
import './ServicioDetalle.css';

const ServicioDetalle = () => {
  const { id } = useParams();
  const [servicio, setServicio] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:8000/services/detail/${id}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setServicio(result.data);
        } else {
          console.error('Error al cargar servicio:', result.error);
        }
      })
      .catch(err => console.error('Error al cargar servicio:', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="loading">Cargando servicio...</p>;
  if (!servicio) return <p className="error">No se encontró el servicio.</p>;

  const {
    serviceName,
    description,
    category,
    address,
    price,
    priceType,
    modalities,
    availabilityDays,
    photos,
    provider
  } = servicio;

  const traducirTipoTarifa = tipo => {
    const mapa = {
      por_hora: 'Por hora',
      por_servicio: 'Por servicio',
      por_sesion: 'Por sesión',
      a_convenir: 'A convenir'
    };
    return mapa[tipo] || tipo;
  };

  return (
    <div className="detalle-servicio-container">
      <div className="tarjeta-detalle">
        {/* Encabezado */}
        <div className="detalle-header">
          <img
            src={photos?.[0] || '/placeholder.png'}
            alt={serviceName}
            className="detalle-foto"
          />
          <div className="detalle-info-principal">
            <h2 className="detalle-nombre">{serviceName}</h2>
            <p className="detalle-categoria">
              <FiTag className="icono" /> {category}
            </p>
            <p className="detalle-tarifa">
              <FaMoneyBillWave className="icono" /> {price
                ? `${Number(price).toLocaleString('es-AR')} (${traducirTipoTarifa(priceType)})`
                : 'Tarifa a convenir'}
            </p>
            {modalities?.length > 0 && (
              <p className="detalle-modalidad">
                <FiHome className="icono" /> Modalidad: {modalities.join(', ')}
              </p>
            )}
            <p className="detalle-ubicacion">
              <FiMapPin className="icono" /> {address || 'Dirección no especificada'}
            </p>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="detalle-cuerpo">
          <h3>Descripción</h3>
          <p className="detalle-descripcion">{description || 'Sin descripción.'}</p>

          <div className="detalle-datos-extra">
            <div>
              <h4>
                <FaCalendarAlt className="icono" /> Días disponibles
              </h4>
              <p>{availabilityDays?.join(', ') || 'No informado'}</p>
            </div>
            <div>
              <h4>
                <FiUser className="icono" /> Proveedor
              </h4>
              <p>
                {provider?.name || 'No especificado'} <br />
                <FiMail className="icono" />{' '}
                <span className="detalle-email">{provider?.email}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Galería */}
        {photos?.length > 1 && (
          <div className="detalle-galeria">
            {photos.slice(1).map((foto, index) => (
              <div key={index} className="detalle-galeria-item">
                <FaCamera className="icono-camara" />
                <img
                  src={foto}
                  alt={`Foto ${index + 1}`}
                  className="detalle-foto-extra"
                />
              </div>
            ))}
          </div>
        )}

        {/* Botones de acción */}
        <div className="detalle-botones">
          <button className="boton-contratar">Contratar</button>
          <button className="boton-volver" onClick={() => navigate(-1)}>
          Volver
        </button>
        </div>
      </div>
    </div>
  );
};

export default ServicioDetalle;
