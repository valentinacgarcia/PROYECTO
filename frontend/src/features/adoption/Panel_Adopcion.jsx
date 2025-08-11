import React, { useState, useMemo } from 'react'; 
import { FaPlay } from 'react-icons/fa';
import './Panel_Adopcion.css'; 

const PetMatch = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 12;
  const totalSimulatedPets = 30; 
  const totalPages = Math.ceil(totalSimulatedPets / cardsPerPage);

  // Estado para filtros (pueden enviarse luego al backend)
  const [filters, setFilters] = useState({
    region: [],
    raza: [],
    genero: [],
    edad: [],
    tamaño: [],
    color: [],
    largoPelaje: [],
    castrado: [],
    compatibilidad: []
  });

  // Manejo de checkboxes
  const handleCheckboxChange = (filterName, value) => {
    setFilters(prev => {
      const selected = prev[filterName];
      return {
        ...prev,
        [filterName]: selected.includes(value)
          ? selected.filter(item => item !== value) // deselecciona
          : [...selected, value] // selecciona
      };
    });
  };

  const currentEmptyCards = useMemo(() => {
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = Math.min(startIndex + cardsPerPage, totalSimulatedPets);
    return Array.from({ length: endIndex - startIndex }, (_, i) => ({ id: startIndex + i }));
  }, [currentPage, cardsPerPage, totalSimulatedPets]);

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

  return (
    <div className="petmatch-container">
      <h1>Mascotas en adopción cerca tuyo!</h1>

      <div className="main-content">
        <aside className="sidebar">
          <div className="find-match-card">
            <h2>¡Encontrá tu mascota ideal!</h2>
          </div>

          {/* Filtros */}
          <div className="filter-section">
            <h3>Región</h3>
            <select>
              <option>Selecciona una región</option>
            </select>
          </div>

          <div className="filter-section">
            <h3>Raza</h3>
            <select>
              <option>Selecciona una raza</option>
            </select>
          </div>

          <div className="filter-section">
            <h3>Género</h3>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('genero', 'Macho')} /> Macho</label>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('genero', 'Hembra')} /> Hembra</label>
          </div>

          <div className="filter-section">
            <h3>Edad</h3>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('edad', 'Cachorro')} /> Cachorro (0-1 año)</label>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('edad', 'Joven')} /> Joven (1-3 años)</label>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('edad', 'Adulto')} /> Adulto (3-8 años)</label>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('edad', 'Senior')} /> Senior (8 años o más)</label>
          </div>

          <div className="filter-section">
            <h3>Tamaño</h3>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('tamaño', 'Pequeño')} /> Pequeño (5-12 kg)</label>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('tamaño', 'Mediano')} /> Mediano (12-25 kg)</label>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('tamaño', 'Grande')} /> Grande (25 kg o más)</label>
          </div>

          <div className="filter-section">
            <h3>Color del pelaje</h3>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('color', 'Blanco')} /> Blanco</label>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('color', 'Negro')} /> Negro</label>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('color', 'Marrón')} /> Marrón</label>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('color', 'Otro')} /> Otro</label>
          </div>

          <div className="filter-section">
            <h3>Largo del pelaje</h3>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('largoPelaje', 'Corto')} /> Corto</label>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('largoPelaje', 'Medio')} /> Medio</label>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('largoPelaje', 'Largo')} /> Largo</label>
          </div>

          <div className="filter-section">
            <h3>Castrado/a</h3>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('castrado', 'Sí')} /> Sí</label>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('castrado', 'No')} /> No</label>
          </div>

          <div className="filter-section">
            <h3>Compatibilidad</h3>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('compatibilidad', 'Niños')} /> Niños</label>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('compatibilidad', 'Perros')} /> Perros</label>
            <label><input type="checkbox" onChange={() => handleCheckboxChange('compatibilidad', 'Gatos')} /> Gatos</label>
          </div>
        </aside>

        <main className="pet-list-and-pagination">
          <div className="pet-grid">
            {currentEmptyCards.map(card => (
              <div className="pet-card skeleton" key={card.id}>
                <div className="skeleton-image"></div>
                <div className="pet-info">
                  <div className="skeleton-line skeleton-line-lg"></div>
                  <div className="skeleton-line skeleton-line-sm"></div>
                  <div className="skeleton-line skeleton-line-xs"></div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="pagination-button">
                <span className="pagination-arrow">&lt;</span> Anterior
              </button>
              {renderPageNumbers()}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-button">
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
