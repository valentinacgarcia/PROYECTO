import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Mascotas.css';

const MisMascotas = () => {
  const [mascotas, setMascotas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    fetch(`http://localhost:8000/pet/list/${user.id}`)
      .then((res) => res.json())
      .then((data) => setMascotas(data))
      .catch((err) => {
        console.error('Error al cargar mascotas:', err);
      });
  }, []);

  const handleNuevaMascota = () => {
    navigate('/registrar-mascota/nueva');
  };

  return (
    <div className="mis-mascotas-container">
      <h2 className="mascotas-titulo">Mis Mascotas</h2>

      {mascotas.length === 0 ? (
        <p className="mensaje-vacio">Todavía no registraste ninguna mascota.</p>
      ) : (
        <div className="lista-mascotas">
          {mascotas.map((mascota) => (
            <div
              key={mascota.id}
              className="tarjeta-mascota"
              onClick={() => navigate(`/mis-mascotas/${mascota.id}`)}
            >
              <img
                src={mascota.photos[0]}
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

      <button className="boton-nueva-mascota" onClick={handleNuevaMascota}>
        Registrar una nueva mascota
      </button>
    </div>
  );
};

const MascotasAdopcion = () => {
  const [mascotasAdopcion, setMascotasAdopcion] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    
    fetch(`http://localhost:8000/pet/list/${user.id}`) // Ajusta el endpoint según tu API
      .then((res) => res.json())
      .then((data) => setMascotasAdopcion(data))
      .catch((err) => {
        console.error('Error al cargar mascotas en adopción:', err);
      });
  }, []);

  return (
    <div className="mis-mascotas-container">
      <h2 className="mascotas-titulo">Mascotas en Adopción</h2>

      {mascotasAdopcion.length === 0 ? (
        <p className="mensaje-vacio">No hay mascotas publicadas en adopción.</p>
      ) : (
        <div className="lista-mascotas">
          {mascotasAdopcion.map((mascota) => (
            <div
              key={mascota.id}
              className="tarjeta-mascota"
              onClick={() => navigate(`/mascotas-adopcion/${mascota.id}`)}
            >
              <img
                src={mascota.photos[0]}
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
    </div>
  );
};

const PanelMascotas = () => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <MisMascotas />
      <MascotasAdopcion />
    </div>
  );
};

export default PanelMascotas;