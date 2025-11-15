import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { buildApiUrl } from "../../config/api";
import "./FormAdopcion.css";

const DarEnAdopcion = ({ mascotasRegistradas }) => {
  const [mascotas, setMascotas] = useState(mascotasRegistradas || []);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [ubicacion, setUbicacion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setLoading(false);
      return;
    }

    fetch(buildApiUrl(`/pet/list/${user.id}`))
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
    setShowModal(true);
  };
  
  const handleConfirmAdoption = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) throw new Error("Usuario no encontrado");

      if (!ubicacion.trim()) {
        alert("Por favor, ingresa la ubicación de la mascota.");
        return;
      }

      const res = await fetch(buildApiUrl(`/pet/forAdoption/${mascotaSeleccionada}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          for_adoption: true,
          location: ubicacion.trim(),
          description: descripcion.trim() || null
        })
      });

      const data = await res.json();
      console.log("Respuesta del backend:", data);

      setShowModal(false);
      navigate('/registrar-mascota'); 
    } catch (err) {
      console.error("Error al marcar mascota para adopción:", err);
      alert("No se pudo publicar la mascota para adopción. Intenta nuevamente.");
    }
  };

  const getMascotaNameById = (id) => {
    const selectedPet = mascotas.find(pet => pet.id === id);
    return selectedPet ? selectedPet.name : "esta mascota";
  }

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

      {showModal && (
        <div className="modal-adopcion-overlay">
          <div className="modal-adopcion-content">
            <h3>Confirmar Adopción</h3>
            <p>¿Estás seguro de que quieres dar en adopción a {getMascotaNameById(mascotaSeleccionada)}?</p>
            <button className="boton-aceptar-modal" onClick={handleConfirmAdoption}>Aceptar</button>
            <button className="boton-cancelar-modal" onClick={() => setShowModal(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DarEnAdopcion;
