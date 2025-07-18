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

  const handleVerDetalles = (id) => {
    navigate(`/mis-mascotas/${id}`);
  };

  return (
    <div className="mis-mascotas-container">
      <h2 className="mascotas-titulo">Mis Mascotas</h2>

      {mascotas.length === 0 ? (
        <p className="mensaje-vacio">Todavía no registraste ninguna mascota.</p>
      ) : (
        <div className="lista-mascotas">
          {mascotas.map((mascota) => (
            <div key={mascota.id} className="tarjeta-mascota" onClick={() => navigate(`/mis-mascotas/${mascota.id}`)}>
              <img
                src={mascota.photos[0]} 
                alt={mascota.name}
                className="foto-mascota"
              />
              <div className="info-mascota">
                <h3>
                  {mascota.type === 'Perro' ? '🐶 ' : '🐱 '}
                  {mascota.name}{' '}
                </h3>
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

export default MisMascotas;