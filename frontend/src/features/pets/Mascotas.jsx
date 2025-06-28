import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Mascotas.css';

const MisMascotas = () => {
  const [mascotas, setMascotas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    // Llamada al backend para obtener mascotas del usuario
    /* fetch(`http://localhost:8000/mascotas/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setMascotas(data);
      })
      .catch((err) => {
        console.error('Error al cargar mascotas:', err);
      }); */
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
            <div key={mascota.id} className="tarjeta-mascota">
              <h3>{mascota.nombre}</h3>
              <p><strong>Tipo:</strong> {mascota.tipo}</p>
              <p><strong>Edad:</strong> {mascota.edad}</p>
              <p><strong>Tamaño:</strong> {mascota.tamaño}</p>
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