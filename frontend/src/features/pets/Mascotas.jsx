import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Mascotas.css';

const ListaMascotas = ({ title, mascotas, detalleRuta, botonTexto, botonClick, isAdopted }) => {
  const navigate = useNavigate();

  // Filtrar según is_adopted (conversión a número para evitar problemas de tipo)
  const mascotasFiltradas = mascotas.filter(m => Number(m.is_adopted) === Number(isAdopted));

  return (
    <div className="mis-mascotas-container">
      <h2 className="mascotas-titulo">{title}</h2>

      {mascotasFiltradas.length === 0 ? (
        <p className="mensaje-vacio">
          {isAdopted ? 'No hay mascotas publicadas en adopción.' : 'Todavía no registraste ninguna mascota.'}
        </p>
      ) : (
        <div className="lista-mascotas">
          {mascotasFiltradas.map(mascota => (
            <div
              key={mascota.id}
              className="tarjeta-mascota"
              onClick={() => navigate(`${detalleRuta}/${mascota.id}`)}
            >
              <img
                src={mascota.photos?.[0] || '/placeholder.png'}
                alt={mascota.name}
                className="foto-mascota"
              />
              <div className="info-mascota">
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

    fetch(`http://localhost:8000/pet/list/${user.id}`)
      .then(res => res.json())
      .then(data => {
        console.log('Mascotas recibidas:', data); // Para debug
        setMascotas(data);
      })
      .catch(err => console.error('Error al cargar mascotas:', err))
      .finally(() => setLoading(false));
  }, []);

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
      />

      <ListaMascotas
        title="Mascotas en Adopción"
        mascotas={mascotas}
        detalleRuta="/mascotas-adopcion"
        isAdopted={1}
      />
    </div>
  );
};

export default PanelMascotas;
