import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Panel_Recomendations.css';
import { useNavigate } from 'react-router-dom';

const Panel_Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const getCurrentUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.id || null;
    } catch (error) {
      console.error('Error al obtener user del localStorage:', error);
      return null;
    }
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      const userId = getCurrentUserId();
      if (!userId) {
        setError('Usuario no identificado');
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `http://localhost:8000/recommendations/list-preferences/${userId}`
      );

      if (response.data.success) {
        setRecommendations(response.data.data);
      } else {
        setError(response.data.message || 'Error al obtener recomendaciones');
      }
    } catch (err) {
      setError('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para determinar el color del score
  const getScoreClass = (score) => {
    if (score >= 4.5) return 'excellent';
    if (score >= 4.0) return 'very-good';
    if (score >= 3.5) return 'good';
    return 'fair';
  };

  // Función para determinar si es score alto
  const isHighScore = (score) => {
    return score >= 4.5;
  };

  // Función para obtener la clase del grid según cantidad de elementos
  const getGridClass = () => {
    if (recommendations.length === 1) return 'pet-grid single-item';
    if (recommendations.length === 2) return 'pet-grid two-items';
    return 'pet-grid';
  };


  useEffect(() => {
    fetchRecommendations();
  }, []);

  return (
    <div className="recommendations-wrapper">
      <div className="recommendations-container">
        <button
          className="recommendations-back-btn"
          onClick={() => navigate('/panel_adopcion')}
        >
          ← Volver al panel de adopción
        </button>
        <h1>✨ Mascotas Recomendadas para Vos ✨</h1>

        {loading && (
          <div className="recommendations-loading-container">
            <div className="recommendations-loading-spinner"></div>
            <p className="recommendations-loading-text">Encontrando tu mascota perfecta...</p>
          </div>
        )}

        {error && (
          <div className="recommendations-error-message">
            <p>❌ {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className={getGridClass().replace('pet-grid', 'recommendations-grid')}>
            {recommendations.length === 0 && (
              <div className="recommendations-no-results">
                <p>🐾 No encontramos mascotas recomendadas por ahora</p>
                <p>¡Pero seguimos buscando tu compañero perfecto!</p>
              </div>
            )}
            
            {recommendations.map((pet) => (
              <div
                className={`recommendations-card ${isHighScore(pet.recommendation_score) ? 'high-score' : ''}`}
                key={pet.id}
                onClick={() => navigate(`/adopcion/${pet.id}`)}
                style={{ cursor: 'pointer' }}
              >
                {pet.recommendation_score >= 4.5 && (
                  <span className="recommendations-popular-badge">🔥 ¡Popular!</span>
                )}
                
                <div className="recommendations-img-container">
                  <img
                    src={
                      pet.photos && pet.photos.length > 0
                        ? pet.photos[0]
                        : '/api/placeholder/300/260'
                    }
                    alt={pet.name}
                    onError={(e) => {
                      e.target.src = '/api/placeholder/300/260';
                    }}
                  />
                </div>
                
                <div className="recommendations-info">
                  <div className="recommendations-name-row">
                    <h2 className="recommendations-name">{pet.name}</h2>
                    <span 
                      className={`recommendations-score ${getScoreClass(pet.recommendation_score)}`}
                    >
                      ⭐ {pet.recommendation_score?.toFixed(1)}
                    </span>
                  </div>
                  
                  <p className="recommendations-size">{pet.size || 'Tamaño desconocido'}</p>
                  
                  {pet.reasons && pet.reasons.length > 0 && (
                    <ul className="recommendations-reasons">
                      {pet.reasons.map((reason, i) => (
                        <li key={i} data-reason={reason.toLowerCase()}>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Panel_Recommendations;