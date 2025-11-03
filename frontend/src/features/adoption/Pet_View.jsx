import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import axios from 'axios';
import { buildApiUrl } from '../../config/api';
import './Pet_View.css';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import {
  FaEllipsisV,
  FaPaw,
  FaMars,
  FaVenus,
  FaSyringe,
  FaStethoscope,
  FaChild,
  FaCat,
  FaDog,
  FaMapMarkerAlt,
} from 'react-icons/fa';

const PetAdoptionPost = ({ pet }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const handleAdoptClick = async () => {
    setIsProcessing(true);
    setSubmissionMessage({ text: '', type: '' });

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('🔍 Usuario obtenido:', user);
      if (!user) {
        setSubmissionMessage({ text: 'Debes iniciar sesión para adoptar', type: 'error' });
        return;
      }

      console.log('🔍 Verificando formulario para usuario:', user.id);
      const formCheck = await axios.get(
        buildApiUrl(`/adoption/check-form/${user.id}`)
      );
      console.log('🔍 Respuesta del formulario:', formCheck.data);

      if (!formCheck.data.has_form) {
        console.log('🔍 No tiene formulario, redirigiendo...');
        navigate(`/formulario_adopcion/${pet.id}`);
        return;
      }

      console.log('🔍 Enviando solicitud de adopción:', { pet_id: pet.id, user_id: user.id });
      console.log('🔍 URL de la petición:', buildApiUrl('/adoptions/request'));
      const adoptionResponse = await axios.post(
        buildApiUrl('/adoptions/request'),
        { pet_id: pet.id, user_id: user.id }
      );
      console.log('🔍 Respuesta de adopción:', adoptionResponse.data);

      setSubmissionMessage({
        text: `¡Tu solicitud para adoptar a ${pet.name} ha sido enviada! Pronto te contactaremos.`,
        type: 'success'
      });
      setTimeout(() => navigate('/panel_adopcion'), 3000);

    } catch (error) {
      console.error('❌ Error en el proceso de adopción:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);

      if (error.response?.status === 404) {
        console.log('🔍 Error 404, redirigiendo al formulario...');
        navigate(`/formulario_adopcion/${pet.id}`);
      } else if (error.response?.status === 409) {
        console.log('🔍 Error 409, ya solicitó adoptar esta mascota');
        setSubmissionMessage({ text: 'Ya has solicitado adoptar esta mascota', type: 'error' });
      } else {
        console.log('🔍 Error genérico:', error.message);
        setSubmissionMessage({ text: 'Error al procesar tu solicitud. Por favor inténtalo nuevamente.', type: 'error' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveClick = () => {
    setIsSaved(!isSaved);
    console.log(`${pet.name} ${isSaved ? 'eliminado de' : 'añadido a'} favoritos.`);
    setMenuOpen(false);
  };

  const handleMoreInfo = () => {
    setShowInfoModal(true);
    setMenuOpen(false);
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const sliderSettings = {
    dots: true,
    arrows: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
  };

  return (
    <div className="pet-adoption-post">
      {/* Sección de Imágenes */}
      <div className="pet-images-section">
        {pet.images && pet.images.length > 0 ? (
          <div className="slider-container">
            <Slider {...sliderSettings}>
              {pet.images.map((image, index) => (
                <div key={index}>
                  <img src={image} alt={`Imagen ${index}`} />
                </div>
              ))}
            </Slider>
          </div>
        ) : (
          <div className="no-images-placeholder">No hay imágenes disponibles</div>
        )}
      </div>

      {/* Información */}
      <div className="pet-info-section">
        <div>
          <div className="pet-title-row">
            <h1 className="pet-name">{pet.name}</h1>
            <div className="menu-container">
              <button className="menu-button" onClick={toggleMenu}>
                <FaEllipsisV />
              </button>
              {menuOpen && (
                <div className="dropdown-menu">
                  <button onClick={handleMoreInfo}>Más Información</button>
                  <button onClick={handleSaveClick}>
                    {isSaved ? 'Quitar de Favoritos' : 'Guardar en Favoritos'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <hr className="separador" />

          {/* Detalles Clave */}
          <div className="pet-key-details">
            <span className="detail-tag">
              {pet.type === 'Perro' ? <FaDog /> : <FaCat />} {pet.type}
            </span>
            <span className="detail-tag">
              {pet.gender === 'Macho' ? <FaMars /> : <FaVenus />} {pet.gender}
            </span>
            <span className="detail-tag">
              <FaPaw /> {pet.age}
            </span>
            <span className="detail-tag">
              <FaPaw /> {pet.size}
            </span>
            <span className="detail-tag">
              <FaMapMarkerAlt /> {pet.location}
            </span>
          </div>

          {/* Detalles Adicionales */}
          <div className="pet-additional-details">
            <hr className="separador" />
            <h3>Más sobre {pet.name}:</h3>
            <ul>
              <li><strong>Raza:</strong> {pet.breed}</li>
              <li><strong>Color de Pelaje:</strong> {pet.furColor}</li>
              <li><strong>Largo de Pelaje:</strong> {pet.furLength}</li>
              <li>
                <strong>Esterilizado:</strong>{' '}
                {pet.sterilized === 'Sí' ? (
                  <span className="status-positive">Sí <FaSyringe /></span>
                ) : (
                  <span className="status-negative">No</span>
                )}
              </li>
              <li>
                <strong>Vacunado:</strong>{' '}
                {pet.vaccinated === 'Sí' ? (
                  <span className="status-positive">Sí <FaStethoscope /></span>
                ) : (
                  <span className="status-negative">No</span>
                )}
              </li>
              <li>
                <strong>Compatible con:</strong>
                <div className="compatibility-badges">
                  {pet.compatibleWithChildren && (
                    <span className="compatibility-badge"><FaChild /> Niños</span>
                  )}
                  {pet.compatibleWithCats && (
                    <span className="compatibility-badge"><FaCat /> Gatos</span>
                  )}
                  {pet.compatibleWithDogs && (
                    <span className="compatibility-badge"><FaDog /> Perros</span>
                  )}
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Botón Adoptar */}
        <button 
          onClick={handleAdoptClick} 
          className="adopt-button"
          disabled={isProcessing}
        >
          {isProcessing ? 'Procesando...' : `¡Quiero Adoptar a ${pet.name}!`}
        </button>

        {/* Mensaje de envío */}
        {submissionMessage.text && (
          <div className={`submission-message ${submissionMessage.type}`}>
            {submissionMessage.text}
          </div>
        )}

        {/* Modal de Información */}
        {showInfoModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Más información sobre {pet.name}</h3>
              <p>{pet.description?.trim() || 'No hay descripción disponible para esta mascota.'}</p>
              <button className="boton-aceptar" onClick={() => setShowInfoModal(false)}>Cerrar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PetDetailView = () => {
  const { id } = useParams();
  const [mascota, setMascota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPetData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(buildApiUrl(`/pet/detail/${id}`));
        if (!res.ok) {
          throw new Error(`Error de red o el servidor respondió con estado: ${res.status}`);
        }
        const data = await res.json();

        const mappedPetData = {
          id: data.id,
          name: data.name,
          type: data.type,
          gender: data.gender,
          age: `${data.age_years ? data.age_years + ' años' : ''}${
            data.age_years && data.age_months ? ' y ' : ''
          }${data.age_months ? data.age_months + ' meses' : ''}`,
          size: data.size,
          breed: data.breed,
          furColor: data.colors ? data.colors.join(', ') : '',
          furLength: data.fur_length,
          sterilized: data.sterilized,
          vaccinated: data.vaccinated,
          description: data.description,
          location: data.zone,
          images: data.photos || [],
          compatibleWithChildren: data.compatibility?.includes('Niños') || false,
          compatibleWithCats: data.compatibility?.includes('Gatos') || false,
          compatibleWithDogs: data.compatibility?.includes('Perros') || false,
        };

        setMascota(mappedPetData);
      } catch (err) {
        console.error('Error al cargar datos de la mascota:', err);
        setError('No se pudo cargar la información de la mascota. Por favor, inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPetData();
    }
  }, [id]);

  if (loading) {
    return <div className="pet-detail-message loading">Cargando información de la mascota...</div>;
  }

  if (error) {
    return (
      <div className="pet-detail-message error">
        <p>¡Ups! Ocurrió un error.</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!mascota) {
    return <div className="pet-detail-message no-data">No se encontró información para esta mascota.</div>;
  }

  return <PetAdoptionPost pet={mascota} />;
};

export default PetDetailView;
