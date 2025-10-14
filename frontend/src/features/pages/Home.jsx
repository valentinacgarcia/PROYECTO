import React, { useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './Home.css';
import veterinariaImg from '../../assets/veterinaria_sv.jpg';
import peluqueriaImg from '../../assets/peluqueria_sv.jpg';
import paseadoresImg from '../../assets/paseadores.png';
import cuidadoresImg from '../../assets/cuidadores.png';
import adiestradoresImg from '../../assets/adiestradores.jpg';
import mascota1Img from '../../assets/Miel.jpeg';
import mascota2Img from '../../assets/Calita.jpeg';
import mascota3Img from '../../assets/Malu.jpeg';
import mascota4Img from '../../assets/miguel.webp';

import { FaPaw, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const servicios = [
    { id: 1, nombre: 'Veterinaria', imagen: veterinariaImg },
    { id: 2, nombre: 'Peluquería', imagen: peluqueriaImg },
    { id: 3, nombre: 'Paseadores', imagen: paseadoresImg },
    { id: 4, nombre: 'Cuidadores', imagen: cuidadoresImg },
    { id: 5, nombre: 'Adiestradores', imagen: adiestradoresImg },
  ];

  const faqData = [
    {
      id: 1,
      pregunta: '¿Cómo puedo adoptar una mascota en Petmatch?',
      respuesta: 'Para adoptar, navega por nuestra sección de "Adoptar", filtra según tus preferencias y completa el formulario de adopción para la mascota que elijas. Una vez completado, el dueño de la mascota tendrá la posibilidad de aceptar tu solicitud para abrir un chat privado, donde podran ponerse de acuerdo para la adopcion de la mascota.',
    },
    {
      id: 2,
      pregunta: '¿Cuáles son los requisitos para dar una mascota en adopción?',
      respuesta: 'Debes ser el dueño legal de la mascota o tener su autorización. La mascota debe estar en buen estado de salud y debes proporcionar toda la información relevante para que pueda encontrar un hogar adecuado.',
    },
    {
      id: 3,
      pregunta: '¿Ofrecen servicios de paseadores y cuidadores profesionales?',
      respuesta: 'En Petmatch, podes encontrar una variedad de servicios para el cuidado de tu mascota, incluyendo paseadores y cuidadores profesionales. Navega por nuestra sección de "Servicios" para más detalles.',
    },
    {
      id: 4,
      pregunta: '¿Cómo puedo reportar un caso de maltrato animal?',
      respuesta: 'Petmatch no maneja directamente casos de maltrato. Si encuentras un caso, te recomendamos contactar a las autoridades locales o a organizaciones de rescate animal de tu área para que tomen las medidas necesarias.',
    },
  ];

  const navigate = useNavigate();
  const [openFaqId, setOpenFaqId] = useState(null);

  const handleClickAdoptar = () => {
    navigate('/panel_adopcion');
  };

  const handleClickNuevaAdopcion = () => {
    navigate('/formulario_nueva_adopcion');
  };

  const handleClickServicios = () => {
    navigate('/panel_servicios');
  }
  const handleFaqClick = (id) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    autoplay: true,
    speed: 500,
    autoplaySpeed: 2000,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: { slidesToShow: 2 },
      },
      {
        breakpoint: 768,
        settings: { slidesToShow: 1 },
      },
    ],
  };

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="home-hero">
        <div className="home-overlay" />
        <div className="home-hero-content">
          <h2 className="home-title">Tu amigo ideal</h2>
          <p className="home-subtitle">Adopta, ofrece hogar o contrata servicios</p>
          <div className="home-buttons">
            <button className="home-button primary" onClick={handleClickAdoptar}>
              Adoptar
            </button>
            <button className="home-button secondary" onClick={handleClickNuevaAdopcion}>
              Tengo una mascota para dar en adopción
            </button>
          </div>
        </div>
      </div>

      {/* Mascotas */}
      <div className="mascotas-section">
        <div className="mascotas-header">
          <div className="section-header-home">
            <h2 className="section-title">
              Mascotas disponibles para adopción
              <span className="mascotas-subtitle">
                &gt; Encontrá tu compañero ideal
              </span>
            </h2>
          </div>
        </div>
        <div className="lista-mascotas">
          <div className="tarjeta-mascota">
            <img
              src={mascota1Img}
              alt="Mascota 1"
              className="foto-mascota"
            />
            <h3>Miel</h3>
          </div>
          <div className="tarjeta-mascota">
            <img
              src={mascota2Img}
              alt="Mascota 2"
              className="foto-mascota"
            />
            <h3>Cala</h3>
          </div>
          <div className="tarjeta-mascota">
            <img
              src={mascota3Img}
              alt="Mascota 3"
              className="foto-mascota"
            />
            <h3>Malu</h3>
          </div>
          <div className="tarjeta-mascota">
            <img
              src={mascota4Img}
              alt="Mascota 4"
              className="foto-mascota"
            />
            <h3>Miguel</h3>
          </div>
          <div className="conocer-mas-card" onClick={handleClickAdoptar}>
            <FaPaw className="paw-icon" />
            <p className="available-pets-text">Y muchas más mascotas en <br />Petmatch</p>
            <button className="conocer-mas button">Ver todas</button>
          </div>
        </div>
      </div>

      {/* Servicios */}
      <div className="servicios-section">
        <div className="section-header-home">
          <h2 className="section-title">
            Servicios para el cuidado de tu mascota
          </h2>
          <button className="home-button more" onClick={handleClickServicios}>Conocer más</button>
        </div>
        <Slider {...sliderSettings}>
          {servicios.map((servicio) => (
            <div key={servicio.id} className="card-wrapper">
              <div className="servicio-card">
                <div className="card-image">
                  <img src={servicio.imagen} alt={servicio.nombre} />
                  <div className="card-overlay">
                    <h3>{servicio.nombre}</h3>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* Sección de Preguntas Frecuentes */}
      <div className="faq-section">
        <h2 className="faq-title">Preguntas Frecuentes</h2>
        <div className="faq-list">
          {faqData.map((faq) => (
            <div key={faq.id} className="faq-item">
              <div className="faq-question" onClick={() => handleFaqClick(faq.id)}>
                <h3>{faq.pregunta}</h3>
                <div className="faq-icon-container">
                  {openFaqId === faq.id ? <FaChevronUp className="faq-icon" /> : <FaChevronDown className="faq-icon" />}
                </div>
              </div>
              {openFaqId === faq.id && (
                <div className="faq-answer">
                  <p>{faq.respuesta}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pie de página (Footer) */}
      <footer className="footer-home">
        <div className="footer-container">
          <div className="footer-section brand">
            <div className="footer-logo">Petmatch</div>
            <p className="footer-slogan">Conectando corazones, salvando vidas.</p>
          </div>

          <div className="footer-section links">
            <h4>Navegación</h4>
            <ul>
              <li><a href="/adopcion">Adoptar</a></li>
              <li><a href="/servicios">Servicios</a></li>
              <li><a href="/nosotros">Acerca de nosotros</a></li>
            </ul>
          </div>

          <div className="footer-section social">
            <h4>Síguenos</h4>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Petmatch.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;