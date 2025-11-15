import React, { useState, useEffect } from "react";
import axios from "axios";
import { buildApiUrl } from '../../config/api';
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaDog,
  FaClipboardList,
  FaClock,
  FaCheckCircle,
  FaHome,
  FaKey,
  FaTree,
  FaShieldAlt,
  FaUsers,
  FaChild,
  FaAllergies,
  FaFileContract, 
  FaSyringe,
  FaBed,
  FaUserTie,
  FaPaw
} from "react-icons/fa";
import "./PostulacionesPanel.css";

const PostulacionesPanel = () => {
  const [postulaciones, setPostulaciones] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedFrom, setSelectedFrom] = useState(null);
  const [formData, setFormData] = useState(null);
  const [newNotification, setNewNotification] = useState(null);
  const [compatibilityScores, setCompatibilityScores] = useState({});

  // Función para calcular puntaje de compatibilidad
  const calculateCompatibilityScore = (formData, petData) => {
    if (!formData || !petData) return 0;
    
    let score = 0;
    let maxScore = 100;

    // 1. Compatibilidad con niños (20 puntos)
    if (petData.compatibility) {
      if (petData.compatibility.includes('Niños')) {
        // Si es compatible con niños, siempre suma (tenga o no niños)
        score += 20;
      } else if (petData.compatibility.includes('No niños') && formData.has_children) {
        // Solo penaliza si específicamente dice "No niños" Y la persona tiene niños
        score -= 20;
      }
    }
    
    // Bonus adicional si tiene niños Y la mascota es compatible
    if (formData.has_children && petData.compatibility && petData.compatibility.includes('Niños')) {
      score += 10; // Bonus extra
    }

    // 2. Espacio y vivienda (25 puntos)
    const isHouse = formData.is_house;
    const hasYard = formData.has_yard;
    const petSize = petData.size?.toLowerCase();
    
    if (petSize === 'grande') {
      if (isHouse && hasYard) {
        score += 25; // Perfecto
      } else if (isHouse && !hasYard) {
        score += 10; // Aceptable
      } else {
        score -= 15; // Problemático
      }
    } else if (petSize === 'mediano') {
      if (isHouse) {
        score += hasYard ? 20 : 15;
      } else {
        score += hasYard ? 10 : 5; // Depto aceptable
      }
    } else if (petSize === 'pequeño') {
      score += 20; // Siempre bueno
      if (!isHouse) {
        score += 5; // Bonus para departamentos
      }
    }

    // 3. Experiencia previa (15 puntos)
    if (formData.had_pets_before) {
      score += 15;
    } else {
      // Penalizar razas difíciles para principiantes
      const difficultBreeds = ['husky', 'pastor alemán', 'rottweiler', 'doberman', 'pit bull', 'dogo'];
      const petBreed = petData.breed?.toLowerCase() || '';
      if (difficultBreeds.some(breed => petBreed.includes(breed))) {
        score -= 10;
      }
    }

    // 4. Tiempo disponible (15 puntos)
    const hoursAlone = formData.hours_alone_per_day;
    if (hoursAlone <= 4) {
      score += 15;
    } else if (hoursAlone > 8) {
      score -= 10;
      // Penalizar cachorros si está mucho tiempo solo
      const petAge = petData.age_years || 0;
      if (petAge < 1) {
        score -= 15;
      }
    }

    // 5. Compatibilidad con mascotas actuales (10 puntos)
    if (formData.has_current_pets) {
      if (petData.compatibility && 
          (petData.compatibility.includes('Perros') || petData.compatibility.includes('Gatos'))) {
        score += 10;
      } else {
        score -= 15;
      }
    }

    // 6. Alergias (10 puntos)
    if (formData.has_allergies) {
      const hypoallergenicBreeds = ['poodle', 'caniche', 'bichon frise', 'schnauzer'];
      const petBreed = petData.breed?.toLowerCase() || '';
      if (hypoallergenicBreeds.some(breed => petBreed.includes(breed))) {
        score += 10;
      } else if (petData.type === 'gato') {
        score += 5; // Gatos de pelo corto
      } else {
        score -= 5;
      }
    }

    // 7. Seguridad (5 puntos)
    if (formData.has_security) {
      score += 5;
    } else {
      if (petSize === 'grande') {
        score -= 5;
      }
    }

    // Normalizar a escala 0-100
    const normalizedScore = Math.max(0, Math.min(100, (score / maxScore) * 100));
    const finalScore = Math.round(normalizedScore); // Puntaje entero del 0-100
    
    return finalScore;
  };

  // Función para traer postulaciones
  const fetchPostulaciones = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await axios.get(buildApiUrl(`/adoptions/notifications/${user.id}`));
      const mapped = res.data.map((item) => ({
        id: item.petition_id,
        petition_id: item.petition_id,
        postulante: { 
          nombre: item.interested_user_name, 
          email: item.interested_user_email,
          id: item.interested_user_id
        },
        mascota: { 
          nombre: item.pet_name, 
          tipo: item.pet_type,
          id: item.pet_id,
          size: item.pet_size,
          breed: item.pet_breed,
          age_years: item.pet_age_years,
          compatibility: item.pet_compatibility,
          type: item.pet_type
        },
        estado: item.status === "pending" ? "Pendiente" : 
               item.status === "APPROVED" ? "Aprobado" : 
               item.status === "REJECTED" ? "Rechazado" : "Pendiente"
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
      
      // Cargar puntajes de compatibilidad
      loadCompatibilityScores(mapped);
    } catch (err) {
      console.error("Error al traer postulaciones:", err);
    }
  };

  // Función para cargar puntajes de compatibilidad
  const loadCompatibilityScores = async (postulaciones) => {
    const scores = {};
    
    for (const post of postulaciones) {
      try {
        const res = await axios.get(buildApiUrl(`/adoption/form/user/${post.postulante.id}`));
        const userFormData = res.data;
        const score = calculateCompatibilityScore(userFormData, post.mascota);
        scores[post.petition_id] = score;
      } catch (err) {
        console.error(`Error al cargar formulario para postulación ${post.petition_id}:`, err);
        scores[post.petition_id] = 0;
      }
    }
    
    setCompatibilityScores(scores);
  };

  // Traer postulaciones al montar y cada 5s
  useEffect(() => {
    fetchPostulaciones();
    // Polling rápido para todos los dispositivos (Cloudflare no tiene límites)
    const interval = setInterval(fetchPostulaciones, 5000);
    return () => clearInterval(interval);
  }, []);

  // Traer formulario del seleccionado
  useEffect(() => {
    const fetchFormData = async () => {
      if (!selected) return;
      try {
        const res = await axios.get(buildApiUrl(`/adoption/form/user/${selected.postulante.id}`));
        setFormData(res.data);
      } catch (err) {
        console.error("Error al traer formulario del postulante:", err);
      }
    };
    fetchFormData();
  }, [selected]);

  const handleSelectPostulacion = (post, from) => {
    setSelected(post);
    setSelectedFrom(from);
    setFormData(null);
  };

  const handleActualizarEstado = async (nuevoEstado) => {
    if (!selected) return;
    try {
      await axios.put(buildApiUrl(`/adoptions/status/${selected.petition_id}`), {
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
      setTimeout(() => {
        setSelected(null);
        setSelectedFrom(null);
      }, 1000);
    } catch (err) {
      console.error("Error al actualizar el estado:", err);
    }
  };

  // Filtrar postulaciones
  const postulacionesPendientes = postulaciones.filter(p => p.estado === "Pendiente");
  const postulacionesAprobadas = postulaciones.filter(p => p.estado === "Aprobado");

  return (
    <div className="postulaciones-wrapper">
      <div className="header-section">
        <h2 className="titulo-panel">Postulaciones de adopción</h2>
        <p className="descripcion-panel">
          En este panel podrás visualizar y gestionar todas las postulaciones de adopción recibidas para las mascotas que publicaste.
        </p>
      </div>

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

      <div className="postulaciones-container-dual">
        {/* Lista de postulaciones pendientes */}
        <div className="postulaciones-list">
          <div className="section-header pending-header">
            <div className="section-icon">
              <FaClock />
            </div>
            <div className="section-info">
              <h3 className="section-postulacion-title">Pendientes</h3>
              <span className="section-count">{postulacionesPendientes.length} solicitudes</span>
            </div>
          </div>
          <div className="postulaciones-content">
            {postulacionesPendientes.map((post) => (
              <motion.div
                key={post.petition_id}
                className={`postulacion-card ${post.estado.toLowerCase()}`}
                onClick={() => handleSelectPostulacion(post, 'pending')}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <div className="card-content">
                  <div className="card-main">
                    <strong className="postulante-name">{post.postulante.nombre}</strong>
                    <span className="card-text">quiere adoptar a</span>
                    <em className="mascota-name">{post.mascota.nombre}</em>
                  </div>
                  <div className="card-badge pending-badge">
                    <FaClock className="badge-icon" />
                    {post.estado}
                  </div>
                </div>
              </motion.div>
            ))}
            {postulacionesPendientes.length === 0 && (
              <div className="empty-state">
                <FaClock className="empty-icon" />
                <p>No hay postulaciones pendientes</p>
              </div>
            )}
          </div>
        </div>

        {/* Lista de postulaciones aprobadas */}
        <div className="postulaciones-list">
          <div className="section-header approved-header">
            <div className="section-icon">
              <FaCheckCircle />
            </div>
            <div className="section-info">
              <h3 className="section-postulacion-title">Aprobadas</h3>
              <span className="section-count">{postulacionesAprobadas.length} solicitudes</span>
            </div>
          </div>
          <div className="postulaciones-content">
            {postulacionesAprobadas.map((post) => (
              <motion.div
                key={post.petition_id}
                className={`postulacion-card ${post.estado.toLowerCase()}`}
                onClick={() => handleSelectPostulacion(post, 'approved')}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <div className="card-content">
                  <div className="card-main">
                    <strong className="postulante-name">{post.postulante.nombre}</strong>
                    <span className="card-text">quiere adoptar a</span>
                    <em className="mascota-name">{post.mascota.nombre}</em>
                  </div>
                  <div className="card-badge approved-badge">
                    <FaCheckCircle className="badge-icon" />
                    {post.estado}
                  </div>
                </div>
              </motion.div>
            ))}
            {postulacionesAprobadas.length === 0 && (
              <div className="empty-state">
                <FaCheckCircle className="empty-icon" />
                <p>No hay postulaciones aprobadas</p>
              </div>
            )}
          </div>
        </div>

        {selected && (
          <motion.div
            key={selected.petition_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="postulacion-detail"
          >
            <button className="close-btn" onClick={() => {
              setSelected(null);
              setSelectedFrom(null);
            }}><FaTimes /></button>

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
              <div className="detalle-header">
                <h4><FaClipboardList className="icono-titulo" /> Respuestas del formulario</h4>
                {/* Puntaje de compatibilidad */}
                {compatibilityScores[selected.petition_id] !== undefined && (
                  <div className="compatibility-score-detail" title="Puntaje de compatibilidad con la mascota">
                    <FaPaw className="score-icon" />
                    <span className="score-value">
                      {compatibilityScores[selected.petition_id]}
                    </span>
                  </div>
                )}
              </div>
              {formData ? (
                <div>
                  <p><FaHome className="icono-detalle" /> <strong>Tipo de vivienda:</strong> {formData.is_house ? "Casa" : "Departamento"}</p>
                  <p><FaKey className="icono-detalle" /> <strong>Es propietario:</strong> {formData.is_owner ? "Sí" : "No"}</p>
                  <p><FaTree className="icono-detalle" /> <strong>Patio/Jardín:</strong> {formData.has_yard ? "Sí" : "No"}</p>
                  <p><FaShieldAlt className="icono-detalle" /> <strong>Seguridad:</strong> {formData.has_security ? "Sí" : "No"}</p>
                  <p><FaUsers className="icono-detalle" /> <strong>Miembros del hogar:</strong> {formData.household_members}</p>
                  <p><FaChild className="icono-detalle" /> <strong>Niños:</strong> {formData.has_children ? "Sí" : "No"}</p>
                  <p><FaAllergies className="icono-detalle" /> <strong>Alergias:</strong> {formData.has_allergies ? "Sí" : "No"}</p>
                  <p><FaFileContract className="icono-detalle" /> <strong>Acuerdo adopción:</strong> {formData.adoption_agreement ? "Sí" : "No"}</p>
                  <p><FaDog className="icono-detalle" /> <strong>Tuvo mascotas antes:</strong> {formData.had_pets_before ? "Sí" : "No"}</p>
                  <p><FaDog className="icono-detalle" /> <strong>Tiene mascotas actualmente:</strong> {formData.has_current_pets ? "Sí" : "No"}</p>
                  <p><FaSyringe className="icono-detalle" /> <strong>Vacunadas/Castradas:</strong> {formData.pets_vaccinated === null ? "-" : formData.pets_vaccinated ? "Sí" : "No"}</p>
                  <p><FaClock className="icono-detalle" /> <strong>Horas solo por día:</strong> {formData.hours_alone_per_day}</p>
                  <p><FaBed className="icono-detalle" /> <strong>Lugar para dormir:</strong> {
                    formData.sleeping_location === "INSIDE" ? "Adentro" :
                    formData.sleeping_location === "OUTSIDE" ? "Afuera" :
                    formData.sleeping_location
                  }</p>
                  <p><FaUserTie className="icono-detalle" /> <strong>Responsable:</strong> {formData.caretaker}</p>
                  <p><FaSyringe className="icono-detalle" /> <strong>Castrar/Vacunar:</strong> {formData.will_neuter_vaccinate ? "Sí" : "No"}</p>
                </div>
              ) : (
                <p>Cargando datos del formulario...</p>
              )}
            </div>


            {selectedFrom === 'pending' && (
              <div className="acciones">
                <button className="aprobar" onClick={() => handleActualizarEstado("approved")}>Aprobar</button>
                <button className="rechazar" onClick={() => handleActualizarEstado("rejected")}>Rechazar</button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PostulacionesPanel;