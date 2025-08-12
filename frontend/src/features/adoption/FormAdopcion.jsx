import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./FormAdopcion.css";

const DarEnAdopcion = ({ mascotasRegistradas }) => {
  const [mascotas, setMascotas] = useState(mascotasRegistradas || []);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [ubicacion, setUbicacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(true);  // estado para carga
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setLoading(false);
      return;
    }

    fetch(`http://localhost:8000/pet/list/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        setMascotas(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error al cargar mascotas:', err);
        setLoading(false);
      });
  }, []);

  const handleSeleccionMascota = (id) => {
    if (mascotaSeleccionada === id) {
      setMascotaSeleccionada(null); 
    } else {
      setMascotaSeleccionada(id); 
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!mascotaSeleccionada) {
      alert("Por favor, seleccioná una mascota para dar en adopción.");
      return;
    }

    // Llamada al back
    console.log({
      mascotaSeleccionada,
      ubicacion,
      descripcion
    });
  };

  return (
    <div className="dar-adopcion-container">
      <h2 className="dar-adopcion-titulo">Dar en Adopción</h2>

      <form className="dar-adopcion-form" onSubmit={handleSubmit}>
        <label className="form-label">Selecciona la mascota:</label>

        {loading ? (
          <p className="mensaje-vacio">Cargando mascotas...</p>
        ) : mascotas.length === 0 ? (
          <p className="mensaje-vacio">
            Por el momento no tenes mascotas registradas, haz click{' '}
            <Link to="/registrar-mascota/nueva" className="link">aquí</Link> para registrar una nueva mascota.
          </p>
        ) : (
          <div className="lista-mascotas">
            {mascotas.map((mascota) => (
              <div
                key={mascota.id}
                className={`mini-perfil-mascota ${mascotaSeleccionada === mascota.id ? 'seleccionada' : ''}`}
                onClick={() => handleSeleccionMascota(mascota.id)}
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

        <label className="form-label">Ubicación donde se encuentra la mascota:</label>
        <input
          type="text"
          className="input-texto"
          placeholder="Ej: Córdoba Capital, Barrio Centro"
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
          required
        />

        <label className="form-label">Descripción adicional:</label>
        <textarea
          className="textarea-descripcion"
          placeholder="Agrega información importante para los adoptantes..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />

        <button
          type="submit"
          className={`boton-enviar ${mascotaSeleccionada ? "" : "boton-deshabilitado"}`}
          disabled={!mascotaSeleccionada}
        >
          Publicar en adopción
        </button>
      </form>
    </div>
  );
};

export default DarEnAdopcion;
