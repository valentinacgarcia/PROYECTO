import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Panel_Adopcion.css';
import perro from '../../assets/perro.png';
import gato from '../../assets/gato.png';
import { useNavigate } from 'react-router-dom';

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
    setFilters(prev => ({
      ...prev,
      tipo: prev.tipo.includes(type) ? [] : [type]
    }));
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

      const response = await axios.get('http://localhost:8000/pet/list-all', { params });

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

  return (
    <div className="petmatch-container">
      <h1>Mascotas en adopción cerca tuyo!</h1>

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
            <h3>Región</h3>
            <select
              value={filters.region[0] || ''}
              onChange={e => handleSelectChange('region', e)}
            >
              <option value="">Selecciona una región</option>
              <option value="norte">Norte</option>
              <option value="sur">Sur</option>
              <option value="centro">Centro</option>
            </select>
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
              />{' '}
              Macho
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.genero.includes('Hembra')}
                onChange={() => handleCheckboxChange('genero', 'Hembra')}
              />{' '}
              Hembra
            </label>
          </div>

          <div className="filter-section">
            <h3>Edad</h3>
            <label>
              <input
                type="checkbox"
                checked={filters.edad.includes('Cachorro')}
                onChange={() => handleCheckboxChange('edad', 'Cachorro')}
              />{' '}
              Cachorro (0-1 año)
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.edad.includes('Joven')}
                onChange={() => handleCheckboxChange('edad', 'Joven')}
              />{' '}
              Joven (1-3 años)
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.edad.includes('Adulto')}
                onChange={() => handleCheckboxChange('edad', 'Adulto')}
              />{' '}
              Adulto (3-8 años)
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.edad.includes('Senior')}
                onChange={() => handleCheckboxChange('edad', 'Senior')}
              />{' '}
              Senior (8 años o más)
            </label>
          </div>

          <div className="filter-section">
            <h3>Tamaño</h3>
            <label>
              <input
                type="checkbox"
                checked={filters.tamaño.includes('Pequeño')}
                onChange={() => handleCheckboxChange('tamaño', 'Pequeño')}
              />{' '}
              Pequeño (5-12 kg)
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.tamaño.includes('Mediano')}
                onChange={() => handleCheckboxChange('tamaño', 'Mediano')}
              />{' '}
              Mediano (12-25 kg)
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.tamaño.includes('Grande')}
                onChange={() => handleCheckboxChange('tamaño', 'Grande')}
              />{' '}
              Grande (25 kg o más)
            </label>
          </div>

          <div className="filter-section">
            <h3>Color del pelaje</h3>
            <label>
              <input
                type="checkbox"
                checked={filters.colors.includes('Blanco')}
                onChange={() => handleCheckboxChange('colors', 'Blanco')}
              />{' '}
              Blanco
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.colors.includes('Negro')}
                onChange={() => handleCheckboxChange('colors', 'Negro')}
              />{' '}
              Negro
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.colors.includes('Marrón')}
                onChange={() => handleCheckboxChange('colors', 'Marrón')}
              />{' '}
              Marrón
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.colors.includes('Otro')}
                onChange={() => handleCheckboxChange('colors', 'Otro')}
              />{' '}
              Otro
            </label>
          </div>

          <div className="filter-section">
            <h3>Largo del pelaje</h3>
            <label>
              <input
                type="checkbox"
                checked={filters.largoPelaje.includes('Corto')}
                onChange={() => handleCheckboxChange('largoPelaje', 'Corto')}
              />{' '}
              Corto
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.largoPelaje.includes('Medio')}
                onChange={() => handleCheckboxChange('largoPelaje', 'Medio')}
              />{' '}
              Medio
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.largoPelaje.includes('Largo')}
                onChange={() => handleCheckboxChange('largoPelaje', 'Largo')}
              />{' '}
              Largo
            </label>
          </div>

          <div className="filter-section">
            <h3>Castrado/a</h3>
            <label>
              <input
                type="checkbox"
                checked={filters.castrado.includes('Sí')}
                onChange={() => handleCheckboxChange('castrado', 'Sí')}
              />{' '}
              Sí
            </label>
            <label>
              <input
                type="checkbox"
                checked={filters.castrado.includes('No')}
                onChange={() => handleCheckboxChange('castrado', 'No')}
              />{' '}
              No
            </label>
          </div>

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