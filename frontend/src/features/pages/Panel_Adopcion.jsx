import React, { useState, useMemo } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import { FaPlay } from 'react-icons/fa';
import { MdOutlineMale, MdOutlineFemale } from 'react-icons/md';
import './Panel_Adopcion.css'; 


const PetMatch = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 12; 
  // TODO ESTO TIENE QUE VENIR DEL BACK
  const totalSimulatedPets = 30; // Por ejemplo, 30 mascotas en total
  const totalPages = Math.ceil(totalSimulatedPets / cardsPerPage);

  const currentEmptyCards = useMemo(() => {
    const startIndex = (currentPage - 1) * cardsPerPage;
    const endIndex = Math.min(startIndex + cardsPerPage, totalSimulatedPets);

    const cardsToShow = Array.from({ length: endIndex - startIndex }, (_, i) => ({
      id: startIndex + i
    }));

    return cardsToShow;
  }, [currentPage, cardsPerPage, totalSimulatedPets]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Opcional: Volver arriba al cambiar de página
    }
  };

  const renderPageNumbers = () => {
    const pageNumbers = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) {
      endPage = Math.min(totalPages, 5);
    } else if (currentPage >= totalPages - 2) {
      startPage = Math.max(1, totalPages - 4);
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push('...');
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
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
      <h1>Mascotas en adopcion cerca tuyo!</h1>

      <div className="main-content">
        <aside className="sidebar">
          <div className="find-match-card">
            <h2>Encontra tu mascota ideal!</h2>
            <p>En menos de 1 minuto</p>
            <button className="start-button">
              <FaPlay className="play-icon" /> Probar ahora
            </button>
          </div>

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
            <label><input type="radio" name="gender" value="male" /> Macho</label>
            <label><input type="radio" name="gender" value="female" /> Hembra</label>
          </div>

          <div className="filter-section">
            <h3>Edad</h3>
            <label><input type="radio" name="age" value="cachorro" /> Cachorro (0-1 año)</label>
            <label><input type="radio" name="age" value="joven" /> Joven (1-3 años)</label>
            <label><input type="radio" name="age" value="adulto" /> Adulto (3-8 años)</label>
            <label><input type="radio" name="age" value="senior" /> Senior (8 años o más)</label>
          </div>

          <div className="filter-section">
            <h3>Tamaño</h3>
            <label><input type="radio" name="size" value="pequeno" /> Pequeño (5-12 kg)</label>
            <label><input type="radio" name="size" value="mediano" /> Mediano (12-25 kg)</label>
            <label><input type="radio" name="size" value="grande" /> Grande (25 kg o más)</label>
          </div>
        </aside>

        {/* Esta es la única sección <main> para la grilla y paginación */}
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

          {/* Paginación */}
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