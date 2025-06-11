import React from 'react';
import './Home.css';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import veterinariaImg from '../../assets/veterinaria_sv.jpg';
import peluqueriaImg from '../../assets/peluqueria_sv.jpg';
import paseadoresImg from '../../assets/paseadores.png';
import cuidadoresImg from '../../assets/cuidadores.png';
import adiestradoresImg from '../../assets/adiestradores.jpg';


// Flechas de para las slide de servicios
const PrevArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={`${className} custom-arrow prev-arrow`}
      style={{ ...style }}
      onClick={onClick}
    />
  );
};

// Flecha derecha personalizada
const NextArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={`${className} custom-arrow next-arrow`}
      style={{ ...style }}
      onClick={onClick}
    />
  );
};


const Home = () => {
  const servicios = [
    { id: 1, nombre: 'Veterinaria', imagen: veterinariaImg },
    { id: 2, nombre: 'Peluquería', imagen: peluqueriaImg },
    { id: 3, nombre: 'Paseadores', imagen: paseadoresImg },
    { id: 4, nombre: 'Cuidadores', imagen: cuidadoresImg },
    { id: 5, nombre: 'Adiestradores', imagen: adiestradoresImg },
  ];

  const sliderSettings = {
    dots: true,
    infinite: true,
    autoplay: true,
    speed: 500,
    autoplaySpeed: 3000,
    slidesToShow: 3,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  return (
    <div className="home-page">

      <div className="home-hero">
        <div className="home-overlay" />
        <div className="home-hero-content">
          <h1 className="home-title">Tu amigo ideal</h1>
          <p className="home-subtitle">Adopta, ofrece hogar o contrata servicios</p>

          <div className="home-buttons">
            <button className="home-button primary" onClick={() => console.log('Ir a adoptar')}>
              Adoptar
            </button>
            <button
              className="home-button secondary"
              onClick={() => console.log('Publicar mascota en adopción')}
            >
              Tengo una mascota para dar en adopción
            </button>
          </div>
        </div>
      </div>

      {/* Servicios */}
      <div className="home-content-section">
        <h2 className="section-title">Servicios</h2>

        <Slider {...sliderSettings}>
          {servicios.map((servicio) => (
            <div key={servicio.id} className="servicio-card">
              <img src={servicio.imagen} alt={servicio.nombre} className="servicio-img" />
              <h3 className="servicio-nombre">{servicio.nombre}</h3>
            </div>
          ))}
          </Slider>
        </div>
    </div>
  );
};  

export default Home;