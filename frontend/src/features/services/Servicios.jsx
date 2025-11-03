import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../config/api';
import './Servicios.css';

const ListaServicios = ({ title, servicios, detalleRuta, botonTexto, botonClick }) => {
  const navigate = useNavigate();

  return (
    <div className="mis-servicios-container">
      <h2 className="servicios-titulo">{title}</h2>

      {servicios.length === 0 ? (
        <p className="mensaje-vacio">No hay servicios disponibles.</p>
      ) : (
        <div className="lista-servicios">
          {servicios.map(servicio => (
            <div key={servicio.id} className="tarjeta-servicio" onClick={() => navigate(`${detalleRuta}/${servicio.id}`)}>
              <img
                src={servicio.photos && servicio.photos.length > 0 ? servicio.photos[0] : '/placeholder.png'}
                alt={servicio.serviceName}
                className="foto-servicio"
              />
              <div className="info-servicio">
                <h3>{servicio.serviceName}</h3>
                <p className="servicio-tipo">{servicio.category}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {botonTexto && botonClick && (
        <button className="boton-nuevo-servicio" onClick={botonClick}>
          {botonTexto}
        </button>
      )}
    </div>
  );
};

const PanelServicios = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return setLoading(false);

    fetch(buildApiUrl(`/services/user/${user.id}`))
      .then(res => res.json())
      .then(result => {
        console.log('Resultado fetch servicios:', result); // log para depuración
        if (result.success) {
          setServicios(result.data);
        } else {
          console.error('Error al cargar servicios:', result.error);
        }
      })
      .catch(err => console.error('Error al cargar servicios:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando servicios...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <ListaServicios
        title="Mis Servicios"
        servicios={servicios}
        detalleRuta="/mis-servicios"
        botonTexto="Registrar un nuevo servicio"
        botonClick={() => navigate('/registrar_servicio')}
      />
    </div>
  );
};

export default PanelServicios;
