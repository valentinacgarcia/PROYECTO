import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaDog,
  FaHome,
  FaClock,
  FaBuilding,
  FaPaw,
  FaClipboardList
} from "react-icons/fa";
import "./PostulacionesPanel.css";

// Preguntas fijas por sección
const preguntasPorSeccion = {
  SituacionHabitacional: [
    "Tipo de vivienda",
    "Alquila o es propietario",
    "Cuenta con patio o jardin",
    "La vivienda tiene red o es cerrada"
  ],
  Rutina: [
    "Cuanto tiempo estaria solo por dia el animal",
    "Donde dormira el animal",
    "Quien se hará cargo de su alimentación, paseos y salud?",
    "Estás dispuesto a realizar castración/vacunación si corresponde?"
  ],
  ExperienciaAnimales: [
    "Tuviste mascotas antes?",
    "Tenés otras mascotas actualmente?",
    "Están vacunadas/castradas?"
  ],
  Hogar: [
    "Cuántas personas viven en el hogar?",
    "Hay niños?",
    "Hay personas alérgicas o con condiciones médicas especiales?",
    "Todos están de acuerdo con la adopción?"
  ]
};

// Mock de postulaciones (respuestas vienen del backend)
const mockPostulaciones = [
  {
    id: 1,
    postulante: { nombre: "Juan Pérez", email: "juan@email.com" },
    mascota: { nombre: "Fido", tipo: "Perro" },
    respuestas: {
      SituacionHabitacional: {
        "Tipo de vivienda": "Casa",
        "Alquila o es propietario": "Soy propietario",
        "Cuenta con patio o jardin": "Sí",
        "La vivienda tiene red o es cerrada": "Red"
      },
      Rutina: {
        "Cuanto tiempo estaria solo por dia el animal": "6 Horas",
        "Donde dormira el animal": "Adentro",
        "Quien se hará cargo de su alimentación, paseos y salud?": "Toda la familia",
        "Estás dispuesto a realizar castración/vacunación si corresponde?": "Sí"
      },
      ExperienciaAnimales: {
        "Tuviste mascotas antes?": "Sí",
        "Tenés otras mascotas actualmente?": "No",
        "Están vacunadas/castradas?": "N/A"
      },
      Hogar: {
        "Cuántas personas viven en el hogar?": "4",
        "Hay niños?": "Sí",
        "Hay personas alérgicas o con condiciones médicas especiales?": "No",
        "Todos están de acuerdo con la adopción?": "Sí"
      }
    },
    estado: "Pendiente"
  }
];

const PostulacionesPanel = () => {
  const [postulaciones, setPostulaciones] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setPostulaciones(mockPostulaciones);
  }, []);

  const categorias = [
    { key: "Hogar", icon: <FaHome />, label: "Hogar" },
    { key: "Rutina", icon: <FaClock />, label: "Rutina" },
    { key: "SituacionHabitacional", icon: <FaBuilding />, label: "Situación Habitacional" },
    { key: "ExperienciaAnimales", icon: <FaPaw />, label: "Experiencia con Animales" }
  ];

  return (
    <div className="postulaciones-wrapper">
      <h2 className="titulo-panel">Postulaciones de adopción</h2>
      <p className="descripcion-panel">
        En este panel podrás visualizar y gestionar todas las postulaciones de adopción recibidas para las mascotas que publicaste.
      </p>

      <div className="postulaciones-container">
        <div className="postulaciones-list">
          {postulaciones.map((post) => (
            <div
              key={post.id}
              className={`postulacion-card ${post.estado.toLowerCase()}`}
              onClick={() => setSelected(post)}
            >
              <strong>{post.postulante.nombre}</strong> quiere adoptar a{" "}
              <em>{post.mascota.nombre}</em>
              <span className="estado">{post.estado}</span>
            </div>
          ))}
        </div>

        {selected && (
          <div className="postulacion-detail">
            <button className="close-btn" onClick={() => setSelected(null)}>
              <FaTimes />
            </button>

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
              {categorias.map((cat) => (
                <div className="seccion-respuestas" key={cat.key}>
                  <h5>{cat.icon} {cat.label}</h5>
                  <ul>
                    {preguntasPorSeccion[cat.key].map((pregunta, idx) => (
                      <li key={idx}>
                        <strong>{pregunta}</strong>: {selected.respuestas[cat.key][pregunta] || "-"}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="acciones">
              <button className="aprobar">Aprobar</button>
              <button className="rechazar">Rechazar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostulacionesPanel;
