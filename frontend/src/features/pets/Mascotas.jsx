import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../config/api';
import './Mascotas.css';

const ListaMascotas = ({ title, mascotas, detalleRuta, botonTexto, botonClick, isAdopted, onQuitarDeAdopcion }) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [mascotaAEliminar, setMascotaAEliminar] = useState(null);

  const confirmarQuitar = (mascota) => {
    setMascotaAEliminar(mascota);
    setShowModal(true);
  };

  const handleConfirmQuitar = async () => {
    try {
      const res = await fetch(
        buildApiUrl(`/pet/forAdoption/${mascotaAEliminar.id}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ for_adoption: false }),
        }
      );

      if (res.ok) {
        onQuitarDeAdopcion(mascotaAEliminar.id);
        setShowModal(false);
      } else {
        console.error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error al quitar de adopción:', error);
    }
  };

  return (
    <div className="mis-mascotas-container">
      <h2 className="mascotas-titulo">{title}</h2>

      {mascotas.filter(m => Number(m.is_adopted) === Number(isAdopted)).length === 0 ? (
        <p className="mensaje-vacio">
          {isAdopted ? 'No hay mascotas publicadas en adopción.' : 'Todavía no registraste ninguna mascota.'}
        </p>
      ) : (
        <div className="lista-mascotas">
          {mascotas
            .filter(m => Number(m.is_adopted) === Number(isAdopted))
            .map(mascota => (
              <div key={mascota.id} className="tarjeta-mascota">
                <img
                  src={mascota.photos?.[0] || '/placeholder.png'}
                  alt={mascota.name}
                  className="foto-mascota"
                  onClick={() => navigate(`${detalleRuta}/${mascota.id}`)}
                />

                {isAdopted === 1 && (
                  <button
                    className="btn-quitar-adopcion"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmarQuitar(mascota);
                    }}
                  >
                    ✖
                  </button>
                )}

                <div className="info-mascota" onClick={() => navigate(`${detalleRuta}/${mascota.id}`)}>
                  <h3>{mascota.name}</h3>
                  <p className="mascota-genero-tamanio">{mascota.gender} • {mascota.size}</p>
                </div>
              </div>
            ))}
        </div>
      )}

      {botonTexto && botonClick && (
        <button className="boton-nueva-mascota" onClick={botonClick}>
          {botonTexto}
        </button>
      )}

      {/* Modal de confirmación */}
      {showModal && (
        <div className="modal-adopcion-overlay">
          <div className="modal-adopcion-content">
            <h3>Confirmar acción</h3>
            <p>
              ¿Seguro que quieres quitar a <b>{mascotaAEliminar?.name}</b> de la lista de adopción?
            </p>
            <button className="boton-aceptar-modal" onClick={handleConfirmQuitar}>
              Sí, quitar
            </button>
            <button className="boton-cancelar-modal" onClick={() => setShowModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const PanelMascotas = () => {
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return setLoading(false);

    fetch(buildApiUrl(`/pet/list/${user.id}`))
      .then(res => res.json())
      .then(data => setMascotas(data))
      .catch(err => console.error('Error al cargar mascotas:', err))
      .finally(() => setLoading(false));
  }, []);

  const quitarDeAdopcion = (idMascota) => {
    setMascotas(prev => prev.map(m => m.id === idMascota ? { ...m, is_adopted: 0 } : m));
  };

  if (loading) return <p>Cargando mascotas...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <ListaMascotas
        title="Mis Mascotas"
        mascotas={mascotas}
        detalleRuta="/mis-mascotas"
        botonTexto="Registrar una nueva mascota"
        botonClick={() => navigate('/registrar-mascota/nueva')}
        isAdopted={0}
        onQuitarDeAdopcion={quitarDeAdopcion}
      />

      <ListaMascotas
        title="Mascotas en Adopción"
        mascotas={mascotas}
        detalleRuta="/mis-mascotas"
        isAdopted={1}
        onQuitarDeAdopcion={quitarDeAdopcion}
      />
    </div>
  );
};

export default PanelMascotas;
