import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Panel_Adopcion.css';
import perro from '../../assets/perro.png';
import gato from '../../assets/gato.png';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../../config/api';

const cardsPerPage = 12;

const PetMatch = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pets, setPets] = useState([]);
  const [totalPets, setTotalPets] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    region: [],
    raza: [],
    genero: [],
    edad: [],
    tamaño: [],
    colors: [],
    largoPelaje: [],
    castrado: [],
    compatibilidad: [],
    tipo: []
  });

  const [showFilters, setShowFilters] = useState(false); // Estado para menú móvil

  // Función para obtener el user_id del localStorage
  const getCurrentUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      return user?.id || null;
    } catch (error) {
      console.error('Error al obtener user del localStorage:', error);
      return null;
    }
  };

  const normalizeBackendData = (pets) => {
    return pets;
  };

  // Manejo de checkboxes
  const handleCheckboxChange = (filterName, value) => {
    setFilters(prev => {
      const selected = prev[filterName];
      const newSelected = selected.includes(value)
        ? selected.filter(item => item !== value)
        : [...selected, value];
      return {
        ...prev,
        [filterName]: newSelected
      };
    });
    setCurrentPage(1);
  };

  const handleSelectChange = (filterName, event) => {
    const value = event.target.value;
    setFilters(prev => ({
      ...prev,
      [filterName]: value ? [value] : []
    }));
    setCurrentPage(1);
  };

  // Manejo especial para el filtro de tipo
  const handleTypeFilter = (type) => {
    setFilters(prev => {
      const selected = prev.tipo;
      const newSelected = selected.includes(type)
        ? selected.filter(item => item !== type)
        : [...selected, type];
      return {
        ...prev,
        tipo: newSelected
      };
    });
    setCurrentPage(1);
  };

  const fetchPets = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        paginated: true,
        page: currentPage,
        limit: cardsPerPage,
        user_id: getCurrentUserId(),
      };

      // Agregar filtros a los parámetros
      for (const key in filters) {
        if (filters[key].length > 0) {
          params[key] = JSON.stringify(filters[key]);
        }
      }

      const response = await axios.get(buildApiUrl('/pet/list-all'), { params });

      if (response.data.success) {
        // Normalizar datos antes de setear el estado
        const normalizedPets = normalizeBackendData(response.data.data);
        setPets(normalizedPets);
        setTotalPets(response.data.pagination.total_items);
      } else {
        setError('Error al cargar mascotas.');
        setPets([]);
        setTotalPets(0);
      }
    } catch (err) {
      setError('Error al cargar mascotas: ' + err.message);
      setPets([]);
      setTotalPets(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [currentPage, filters]);

  const totalPages = Math.ceil(totalPets / cardsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) endPage = Math.min(totalPages, 5);
    else if (currentPage >= totalPages - 2) startPage = Math.max(1, totalPages - 4);

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) pageNumbers.push('...');
    }

    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }

    return pageNumbers.map((number, index) => (
      <React.Fragment key={index}>
        {number === '...' ? (
          <span className="pagination-ellipsis">...</span>
        ) : (
          <button
            onClick={() => handlePageChange(number)}
            className={currentPage === number ? 'active' : ''}
            aria-current={currentPage === number ? 'page' : undefined}
          >
            {number}
          </button>
        )}
      </React.Fragment>
    ));
  };

  // Función para capitalizar primera letra
  const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Función para calcular días en espera
  const getDaysWaiting = (createdAt) => {
    if (!createdAt) return 0;
    const createdDate = new Date(createdAt);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const goToRecommendations = () => {
  navigate('/recomendaciones');
  };


  return (
    <div className="petmatch-container">
      <button 
        className="recommendations-btn" 
        onClick={goToRecommendations}
        aria-label="Ver recomendaciones"
      >
        <span role="img" aria-label="estrella" style={{ marginRight: 8 }}>⭐</span>
        Ver mascotas recomendadas
      </button>

      <h1>Mascotas en adopción cerca tuyo!</h1>

      {/* === BOTÓN FLOTANTE SOLO EN MOBILE === */}
      <button className="filters-toggle-btn" onClick={() => setShowFilters(true)}>
        🔍 Filtros
      </button>

      {/* === PANEL LATERAL MOBILE === */}
      {showFilters && (
        <div className="filters-overlay" onClick={() => setShowFilters(false)}>
          <aside
            className="filters-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="filters-header">
              <h2>Filtros</h2>
              <button className="close-filters" onClick={() => setShowFilters(false)}>✖</button>
            </div>

            <div className="filters-content">
              {/* Filtro de tipo */}
              <div className="filter-section">
                <h3>Tipo</h3>
                <div className="icon-selector">
                  <div
                    className={`icon-option ${filters.tipo.includes('perro') ? 'selected' : ''}`}
                    onClick={() => handleTypeFilter('perro')}
                  >
                    <img src={perro} alt="Perro" />
                    <span>Perro</span>
                  </div>
                  <div
                    className={`icon-option ${filters.tipo.includes('gato') ? 'selected' : ''}`}
                    onClick={() => handleTypeFilter('gato')}
                  >
                    <img src={gato} alt="Gato" />
                    <span>Gato</span>
                  </div>
                </div>
              </div>

              {/* Filtro de raza */}
              <div className="filter-section">
                <h3>Raza</h3>
                <select
                  value={filters.raza[0] || ''}
                  onChange={e => handleSelectChange('raza', e)}
                >
                  <option value="">Selecciona una raza</option>
                  <option value="Mestizo">Pastor Alemán</option>
                  <option value="Labrador">Labrador</option>
                  <option value="Bulldog">Bulldog</option>
                  <option value="Caniche">Pastor Alemán</option>
                  <option value="Shitzu">Pastor Alemán</option>
                  <option value="Dachshund">Pastor Alemán</option>
                  <option value="Boxer">Pastor Alemán</option>
                  <option value="Otro">Pastor Alemán</option>
                </select>
              </div>

              {/* Filtro de género */}
              <div className="filter-section">
                <h3>Género</h3>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.genero.includes('Macho')}
                    onChange={() => handleCheckboxChange('genero', 'Macho')}
                  />
                  <span>Macho</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.genero.includes('Hembra')}
                    onChange={() => handleCheckboxChange('genero', 'Hembra')}
                  />
                  <span>Hembra</span>
                </label>
              </div>

              {/* Filtro de edad */}
              <div className="filter-section">
                <h3>Edad</h3>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.edad.includes('Cachorro')}
                    onChange={() => handleCheckboxChange('edad', 'Cachorro')}
                  />
                  <span>Cachorro</span> (0-1 año)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.edad.includes('Joven')}
                    onChange={() => handleCheckboxChange('edad', 'Joven')}
                  />
                  <span>Joven</span> (1-3 años)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.edad.includes('Adulto')}
                    onChange={() => handleCheckboxChange('edad', 'Adulto')}
                  />
                  <span>Adulto</span> (3-8 años)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.edad.includes('Senior')}
                    onChange={() => handleCheckboxChange('edad', 'Senior')}
                  />
                  <span>Senior</span> (8 años o más)
                </label>
              </div>

              {/* Filtro de tamaño */}
              <div className="filter-section">
                <h3>Tamaño</h3>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.tamaño.includes('Pequeño')}
                    onChange={() => handleCheckboxChange('tamaño', 'Pequeño')}
                  />
                  <span>Pequeño</span> (5-12 kg)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.tamaño.includes('Mediano')}
                    onChange={() => handleCheckboxChange('tamaño', 'Mediano')}
                  />
                  <span>Mediano</span> (12-25 kg)
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.tamaño.includes('Grande')}
                    onChange={() => handleCheckboxChange('tamaño', 'Grande')}
                  />
                  <span>Grande</span> (25 kg o más)
                </label>
              </div>

              {/* Filtro de color del pelaje */}
              <div className="filter-section">
                <h3>Color del pelaje</h3>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.colors.includes('Blanco')}
                    onChange={() => handleCheckboxChange('colors', 'Blanco')}
                  />
                  <span>Blanco</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.colors.includes('Negro')}
                    onChange={() => handleCheckboxChange('colors', 'Negro')}
                  />
                  <span>Negro</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.colors.includes('Marrón')}
                    onChange={() => handleCheckboxChange('colors', 'Marrón')}
                  />
                  <span>Marrón</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.colors.includes('Otro')}
                    onChange={() => handleCheckboxChange('colors', 'Otro')}
                  />
                  <span>Otro</span>
                </label>
              </div>

              {/* Filtro de largo del pelaje */}
              <div className="filter-section">
                <h3>Largo del pelaje</h3>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.largoPelaje.includes('Corto')}
                    onChange={() => handleCheckboxChange('largoPelaje', 'Corto')}
                  />
                  <span>Corto</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.largoPelaje.includes('Medio')}
                    onChange={() => handleCheckboxChange('largoPelaje', 'Medio')}
                  />
                  <span>Medio</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.largoPelaje.includes('Largo')}
                    onChange={() => handleCheckboxChange('largoPelaje', 'Largo')}
                  />
                  <span>Largo</span>
                </label>
              </div>

              {/* Filtro de castrado */}
              <div className="filter-section">
                <h3>Castrado/a</h3>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.castrado.includes('Sí')}
                    onChange={() => handleCheckboxChange('castrado', 'Sí')}
                  />
                  <span>Sí</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.castrado.includes('No')}
                    onChange={() => handleCheckboxChange('castrado', 'No')}
                  />
                  <span>No</span>
                </label>
              </div>

              {/* Filtro de compatibilidad */}
              <div className="filter-section">
                <h3>Compatibilidad</h3>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.compatibilidad.includes('Niños')}
                    onChange={() => handleCheckboxChange('compatibilidad', 'Niños')}
                  />{' '}
                  Niños
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.compatibilidad.includes('Perros')}
                    onChange={() => handleCheckboxChange('compatibilidad', 'Perros')}
                  />{' '}
                  Perros
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.compatibilidad.includes('Gatos')}
                    onChange={() => handleCheckboxChange('compatibilidad', 'Gatos')}
                  />{' '}
                  Gatos
                </label>
              </div>
            </div>
            
            {/* Botón aplicar filtros */}
            <button 
              className="apply-filters-btn"
              onClick={() => setShowFilters(false)}
            >
              Aplicar Filtros
            </button>
          </aside>
        </div>
      )}

      <div className="main-content">
        <aside className="sidebar">
          <div className="find-match-card">
            <h2>¡Encontrá tu mascota ideal!</h2>
          </div>

          {/* Filtro de tipo primero */}
          <div className="filter-section">
            <h3>Tipo</h3>
            <div className="icon-selector">
              <div
                className={`icon-option ${filters.tipo.includes('perro') ? 'selected' : ''}`}
                onClick={() => handleTypeFilter('perro')}
              >
                <img src={perro} alt="Perro" />
                <span>Perro</span>
              </div>
              <div
                className={`icon-option ${filters.tipo.includes('gato') ? 'selected' : ''}`}
                onClick={() => handleTypeFilter('gato')}
              >
                <img src={gato} alt="Gato" />
                <span>Gato</span>
              </div>
            </div>
          </div>

          <div className="filter-section">
            <h3>Raza</h3>
            <select
              value={filters.raza[0] || ''}
              onChange={e => handleSelectChange('raza', e)}
            >
              <option value="">Selecciona una raza</option>
              <option value="labrador">Labrador</option>
              <option value="bulldog">Bulldog</option>
              <option value="pastor">Pastor Alemán</option>
            </select>
          </div>

          <div className="filter-section">
            <h3>Género</h3>
            <label>
              <input
                type="checkbox"
                checked={filters.genero.includes('Macho')}
                onChange={() => handleCheckboxChange('genero', 'Macho')}
              />
              <span>Macho</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.genero.includes('Hembra')}
                onChange={() => handleCheckboxChange('genero', 'Hembra')}
              />
              <span>Hembra</span>
            </label>
          </div>

          <div className="filter-section">
            <h3>Edad</h3>
            <label>
              <input
                type="checkbox"
                checked={filters.edad.includes('Cachorro')}
                onChange={() => handleCheckboxChange('edad', 'Cachorro')}
              />
              <span>Cachorro (0-1 año)</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.edad.includes('Joven')}
                onChange={() => handleCheckboxChange('edad', 'Joven')}
              />
              <span>Joven (1-3 años)</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.edad.includes('Adulto')}
                onChange={() => handleCheckboxChange('edad', 'Adulto')}
              />
              <span>Adulto (3-8 años)</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.edad.includes('Senior')}
                onChange={() => handleCheckboxChange('edad', 'Senior')}
              />
              <span>Senior (8 años o más)</span>
            </label>
          </div>

          <div className="filter-section">
            <h3>Tamaño</h3>
            <label>
              <input
                type="checkbox"
                checked={filters.tamaño.includes('Pequeño')}
                onChange={() => handleCheckboxChange('tamaño', 'Pequeño')}
              />
              <span>Pequeño (5-12 kg)</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.tamaño.includes('Mediano')}
                onChange={() => handleCheckboxChange('tamaño', 'Mediano')}
              />
              <span>Mediano (12-25 kg)</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.tamaño.includes('Grande')}
                onChange={() => handleCheckboxChange('tamaño', 'Grande')}
              />
              <span>Grande (25 kg o más)</span>
            </label>
          </div>

          <div className="filter-section">
            <h3>Color del pelaje</h3>
            <label>
              <input
                type="checkbox"
                checked={filters.colors.includes('Blanco')}
                onChange={() => handleCheckboxChange('colors', 'Blanco')}
              />
              <span>Blanco</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.colors.includes('Negro')}
                onChange={() => handleCheckboxChange('colors', 'Negro')}
              />
              <span>Negro</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.colors.includes('Marrón')}
                onChange={() => handleCheckboxChange('colors', 'Marrón')}
              />
              <span>Marrón</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.colors.includes('Otro')}
                onChange={() => handleCheckboxChange('colors', 'Otro')}
              />
              <span>Otro</span>
            </label>
          </div>

          <div className="filter-section">
            <h3>Largo del pelaje</h3>
            <label>
              <input
                type="checkbox"
                checked={filters.largoPelaje.includes('Corto')}
                onChange={() => handleCheckboxChange('largoPelaje', 'Corto')}
              />
              <span>Corto</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.largoPelaje.includes('Medio')}
                onChange={() => handleCheckboxChange('largoPelaje', 'Medio')}
              />
              <span>Medio</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.largoPelaje.includes('Largo')}
                onChange={() => handleCheckboxChange('largoPelaje', 'Largo')}
              />
              <span>Largo</span>
            </label>
          </div>

          <div className="filter-section">
            <h3>Castrado/a</h3>
            <label>
              <input
                type="checkbox"
                checked={filters.castrado.includes('Sí')}
                onChange={() => handleCheckboxChange('castrado', 'Sí')}
              />
              <span>Sí</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.castrado.includes('No')}
                onChange={() => handleCheckboxChange('castrado', 'No')}
              />
              <span>No</span>
            </label>
          </div>

          <div className="filter-section">
            <h3>Compatibilidad</h3>
            <label>
              <input
                type="checkbox"
                checked={filters.compatibilidad.includes('Niños')}
                onChange={() => handleCheckboxChange('compatibilidad', 'Niños')}
              />
              <span>Niños</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.compatibilidad.includes('Perros')}
                onChange={() => handleCheckboxChange('compatibilidad', 'Perros')}
              />
              <span>Perros</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.compatibilidad.includes('Gatos')}
                onChange={() => handleCheckboxChange('compatibilidad', 'Gatos')}
              />
              <span>Gatos</span>
            </label>
          </div>
        </aside>

        <main className="pet-list-and-pagination">
          {loading && (
            <div className="pet-grid">
              {Array.from({ length: cardsPerPage }).map((_, i) => (
                <div className="pet-card skeleton" key={i}>
                  <div className="skeleton-image"></div>
                  <div className="pet-info">
                    <div className="skeleton-line skeleton-line-lg"></div>
                    <div className="skeleton-line skeleton-line-sm"></div>
                    <div className="skeleton-line skeleton-line-xs"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <p style={{ color: 'red' }}>{error}</p>}

          {!loading && !error && (
            <>
              {pets.length === 0 && <p>No se encontraron mascotas para estos filtros.</p>}
              <div className="pet-grid">
                {pets.map(pet => (
                  <div
                    className="pet-card"
                    key={pet.id}
                    onClick={() => navigate(`/adopcion/${pet.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img 
                      src={pet.photos && pet.photos.length > 0 ? pet.photos[0] : 'default.png'} 
                      alt={pet.name} 
                    />
                    
                    {/* Cartelito de días en espera */}
                    <div className="days-waiting-badge">
                      <span className="days-waiting-text">
                        {getDaysWaiting(pet.created_at)} días esperando
                      </span>
                    </div>

                    <div className="pet-info">
                      <div className="pet-name-row">
                        <span className="pet-name">{pet.name}</span>
                        {pet.gender === 'Hembra' && (
                          <span className="gender-icon female">♀</span>
                        )}
                        {pet.gender === 'Macho' && (
                          <span className="gender-icon male">♂</span>
                        )}
                      </div>
                      <div className="pet-details">
                        <span>
                          {pet.age_years > 0 ? `${pet.age_years} años` : ''}
                          {pet.age_months > 0 ? `, ${pet.age_months} meses` : ''}
                        </span>
                        {pet.size && <span> • </span>}
                        <span>{pet.size}</span>
                      </div>
                      <div className="region">
                        {pet.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                <span className="pagination-arrow">&lt;</span> Anterior
              </button>
              {renderPageNumbers()}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Siguiente <span className="pagination-arrow">&gt;</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PetMatch;