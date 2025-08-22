import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaDog,
  FaClipboardList
} from "react-icons/fa";
import "./PostulacionesPanel.css";

const PostulacionesPanel = () => {
  const [postulaciones, setPostulaciones] = useState([]);
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState(null);
  const [newNotification, setNewNotification] = useState(null);

  // Función para traer postulaciones
  const fetchPostulaciones = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await axios.get(`http://localhost:8000/adoptions/notifications/${user.id}`);
      const mapped = res.data.map((item) => ({
        id: item.petition_id,
        petition_id: item.petition_id,
        postulante: { 
          nombre: item.interested_user_name, 
          email: "email@desconocido.com",
          id: item.interested_user_id
        },
        mascota: { nombre: item.pet_name, tipo: "Desconocido" },
        estado: "Pendiente"
      }));

      // Detectar nuevas postulaciones
      if (postulaciones.length > 0) {
        const existingIds = postulaciones.map(p => p.petition_id);
        const newPosts = mapped.filter(p => !existingIds.includes(p.petition_id));
        if (newPosts.length > 0) {
          setNewNotification(newPosts[0]);
          setTimeout(() => setNewNotification(null), 5000);
        }
      }

      setPostulaciones(mapped);
    } catch (err) {
      console.error("Error al traer postulaciones:", err);
    }
  };

  // Traer postulaciones al montar y cada 10s
  useEffect(() => {
    fetchPostulaciones();
    const interval = setInterval(fetchPostulaciones, 5000);
    return () => clearInterval(interval);
  }, []);

  // Traer formulario del seleccionado
  useEffect(() => {
    const fetchFormData = async () => {
      if (!selected) return;
      try {
        const res = await axios.get(`http://localhost:8000/adoption/form/user/${selected.postulante.id}`);
        setFormData(res.data);
      } catch (err) {
        console.error("Error al traer formulario del postulante:", err);
      }
    };
    fetchFormData();
  }, [selected]);

  const handleSelectPostulacion = (post) => {
    setSelected(post);
    setFormData(null);
  };

  const handleActualizarEstado = async (nuevoEstado) => {
    if (!selected) return;
    try {
      await axios.put(`http://localhost:8000/adoptions/status/${selected.petition_id}`, {
        status: nuevoEstado
      });
      setPostulaciones(prev => 
        prev.map(p => p.petition_id === selected.petition_id
          ? { ...p, estado: nuevoEstado === "approved" ? "Aprobado" : "Rechazado" }
          : p
        )
      );
      setSelected(prev => ({
        ...prev,
        estado: nuevoEstado === "approved" ? "Aprobado" : "Rechazado"
      }));
      setSelected(null);
    } catch (err) {
      console.error("Error al actualizar el estado:", err);
    }
  };

  return (
    <div className="postulaciones-wrapper">
      <h2 className="titulo-panel">Postulaciones de adopción</h2>
      <p className="descripcion-panel">
        En este panel podrás visualizar y gestionar todas las postulaciones de adopción recibidas para las mascotas que publicaste.
      </p>

      {/* Toast de nueva postulación */}
      <AnimatePresence>
        {newNotification && (
          <motion.div
            className="toast-notification"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            Nueva solicitud de <strong>{newNotification.postulante.nombre}</strong> para <em>{newNotification.mascota.nombre}</em>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="postulaciones-container">
        <div className="postulaciones-list">
          {postulaciones.map((post) => (
            <div
              key={post.petition_id}
              className={`postulacion-card ${post.estado.toLowerCase()}`}
              onClick={() => handleSelectPostulacion(post)}
            >
              <strong>{post.postulante.nombre}</strong> quiere adoptar a <em>{post.mascota.nombre}</em>
              <span className="estado">{post.estado}</span>
            </div>
          ))}
        </div>

        {selected && (
          <motion.div
            key={selected.petition_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="postulacion-detail"
          >
            <button className="close-btn" onClick={() => setSelected(null)}><FaTimes /></button>

            <h3 className="detalle-titulo">Detalles de la postulación</h3>
            <div className="detalle-info">
              <div className="detalle-col">
                <h4><FaUser className="icono-titulo" /> Postulante</h4>
                <p><FaUser /> <strong>Nombre:</strong> {selected.postulante.nombre}</p>
                <p><FaEnvelope /> <strong>Email:</strong> {selected.postulante.email}</p>
              </div>
              <div className="detalle-col">
                <h4><FaDog className="icono-titulo" /> Mascota</h4>
                <p><FaDog /> <strong>Nombre:</strong> {selected.mascota.nombre}</p>
                <p><strong>Tipo:</strong> {selected.mascota.tipo}</p>
              </div>
            </div>

            <div className="detalle-respuestas">
              <h4><FaClipboardList className="icono-titulo" /> Respuestas del formulario</h4>
              {formData ? (
                <div>
                  <p><strong>Tipo de vivienda:</strong> {formData.is_house ? "Casa" : "Departamento"}</p>
                  <p><strong>Es propietario:</strong> {formData.is_owner ? "Sí" : "No"}</p>
                  <p><strong>Patio/Jardín:</strong> {formData.has_yard ? "Sí" : "No"}</p>
                  <p><strong>Seguridad:</strong> {formData.has_security ? "Sí" : "No"}</p>
                  <p><strong>Miembros del hogar:</strong> {formData.household_members}</p>
                  <p><strong>Niños:</strong> {formData.has_children ? "Sí" : "No"}</p>
                  <p><strong>Alergias:</strong> {formData.has_allergies ? "Sí" : "No"}</p>
                  <p><strong>Acuerdo adopción:</strong> {formData.adoption_agreement ? "Sí" : "No"}</p>
                  <p><strong>Tuvo mascotas antes:</strong> {formData.had_pets_before ? "Sí" : "No"}</p>
                  <p><strong>Tiene mascotas actualmente:</strong> {formData.has_current_pets ? "Sí" : "No"}</p>
                  <p><strong>Vacunadas/Castradas:</strong> {formData.pets_vaccinated === null ? "-" : formData.pets_vaccinated ? "Sí" : "No"}</p>
                  <p><strong>Horas solo por día:</strong> {formData.hours_alone_per_day}</p>
                  <p><strong>Lugar para dormir:</strong> {formData.sleeping_location}</p>
                  <p><strong>Responsable:</strong> {formData.caretaker}</p>
                  <p><strong>Castrar/Vacunar:</strong> {formData.will_neuter_vaccinate ? "Sí" : "No"}</p>
                </div>
              ) : (
                <p>Cargando datos del formulario...</p>
              )}
            </div>

            <div className="acciones">
              <button className="aprobar" onClick={() => handleActualizarEstado("approved")}>Aprobar</button>
              <button className="rechazar" onClick={() => handleActualizarEstado("rejected")}>Rechazar</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PostulacionesPanel;
