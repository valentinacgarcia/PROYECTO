import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from './PanelServicios.module.css';

// --- Constantes y Datos de Configuración ---
const CARDS_PER_PAGE = 12;
const API_ENDPOINT = 'http://localhost:8000/services/list-all';

const SERVICE_CATEGORIES = [
  { value: 'paseo', label: 'Paseo de Mascotas' },
  { value: 'veterinaria', label: 'Veterinaria' },
  { value: 'adiestramiento', label: 'Adiestramiento' },
  { value: 'traslados', label: 'Traslados' },
  { value: 'guarderia', label: 'Guardería' },
  { value: 'otros', label: 'Otros' },
];

const MODALITIES = ['Presencial', 'A domicilio'];
const PRICE_TYPES = [
  { value: 'por_hora', label: 'Por hora' },
  { value: 'por_servicio', label: 'Por servicio' },
  { value: 'a_convenir', label: 'A convenir' },
];
const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// --- Componentes Hijos ---
const ServiceCard = ({ service }) => (
  <div className={styles.card}>
    <img 
      src={service.photos?.[0] || 'https://via.placeholder.com/300x200?text=Servicio'} 
      alt={service.serviceName} 
      className={styles.cardImage}
    />
    <div className={styles.cardInfo}>
      <span className={styles.cardCategory}>{service.category}</span>
      <h4 className={styles.cardTitle}>{service.serviceName}</h4>
      <p className={styles.cardDescription}>{service.description}</p>
      <div className={styles.cardLocation}>
        <span role="img" aria-label="location pin">📍</span> {service.location}
      </div>
    </div>
  </div>
);

const CardSkeleton = () => (
  <div className={`${styles.card} ${styles.skeleton}`}>
    <div className={styles.skeletonImage}></div>
    <div className={styles.cardInfo}>
      <div className={styles.skeletonLine} style={{ width: '40%' }}></div>
      <div className={styles.skeletonLine} style={{ width: '80%' }}></div>
      <div className={styles.skeletonLine} style={{ width: '60%' }}></div>
    </div>
  </div>
);

const dummyService = {
  id: 'dummy-1',
  serviceName: 'Paseador de Perros - Juan',
  category: 'Paseo de Mascotas',
  description: 'Ofrezco paseos grupales e individuales llenos de energía y diversión...',
  location: 'Caballito, CABA',
  photos: ['https://images.pexels.com/photos/58997/pexels-photo-58997.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'],
};

// --- Componente Principal ---
const ServicePanel = () => {
  const [services, setServices] = useState([]);
  const [totalServices, setTotalServices] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState({
    category: '',
    modality: [],
    priceRange: { min: '', max: '' },
    priceType: [],
    availabilityDays: [],
  });
  
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: CARDS_PER_PAGE,
        search: searchTerm || undefined,
        category: filters.category || undefined,
        modality: filters.modality.length > 0 ? JSON.stringify(filters.modality) : undefined,
        minPrice: filters.priceRange.min || undefined,
        maxPrice: filters.priceRange.max || undefined,
        priceType: filters.priceType.length > 0 ? JSON.stringify(filters.priceType) : undefined,
        availabilityDays: filters.availabilityDays.length > 0 ? JSON.stringify(filters.availabilityDays) : undefined,
      };
      const response = await axios.get(API_ENDPOINT, { params });
      if (response.data.success) {
        setServices(response.data.data);
        setTotalServices(response.data.pagination.total_items);
      } else {
        throw new Error('La respuesta del servidor no fue exitosa.');
      }
    } catch (err) {
      setError(`Error al cargar los servicios: ${err.message}`);
      setServices([]);
      setTotalServices(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filters]);

  useEffect(() => {
    const handler = setTimeout(() => { fetchServices(); }, 500);
    return () => clearTimeout(handler);
  }, [fetchServices]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterName, value) => {
    if (filterName.startsWith('priceRange')) {
      const rangeField = filterName.split('.')[1];
      setFilters(prev => ({ ...prev, priceRange: { ...prev.priceRange, [rangeField]: value } }));
      return;
    }
    setFilters(prev => {
      if (Array.isArray(prev[filterName])) {
        const currentValues = prev[filterName];
        const newValues = currentValues.includes(value)
          ? currentValues.filter(item => item !== value)
          : [...currentValues, value];
        return { ...prev, [filterName]: newValues };
      }
      return { ...prev, [filterName]: value };
    });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalServices / CARDS_PER_PAGE);

  return (
    <div className={styles.panelContainer}>
      <header className={styles.header}>
        <h1>Encuentra los mejores servicios</h1>
        <p>Busca entre paseadores, veterinarias, adiestradores y más profesionales cerca tuyo.</p>
        <div className={styles.searchBar}>
          <input type="text" placeholder="Buscar por nombre del servicio..." value={searchTerm} onChange={handleSearchChange} />
        </div>
      </header>
      
      <div className={styles.mainContent}>
        <aside className={styles.sidebar}>
          {/* --- Título de la sidebar --- */}
          <div className={styles.findMatchCard}>
            <h3>¡Encontrá el servicio ideal!</h3>
          </div>

          <div className={styles.filterSection}>
            <h3>Categoría</h3>
            <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)} >
              <option value="">Todas</option>
              {SERVICE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterSection}>
            <h3>Precio (ARS)</h3>
            <div className={styles.priceRange}>
              <input type="number" name="priceRange.min" placeholder="Mín" value={filters.priceRange.min} onChange={(e) => handleFilterChange(e.target.name, e.target.value)} />
              <span>-</span>
              <input type="number" name="priceRange.max" placeholder="Máx" value={filters.priceRange.max} onChange={(e) => handleFilterChange(e.target.name, e.target.value)} />
            </div>
          </div>
          
          <div className={styles.filterSection}>
            <h3>Modalidad</h3>
            {MODALITIES.map(mod => (
              <label key={mod}>
                <input type="checkbox" checked={filters.modality.includes(mod)} onChange={() => handleFilterChange('modality', mod)} />
                {mod}
              </label>
            ))}
          </div>

          <div className={styles.filterSection}>
            <h3>Tipo de Tarifa</h3>
            {PRICE_TYPES.map(pt => (
              <label key={pt.value}>
                <input type="checkbox" checked={filters.priceType.includes(pt.value)} onChange={() => handleFilterChange('priceType', pt.value)} />
                {pt.label}
              </label>
            ))}
          </div>
          
          {/* --- MODIFICADO: Estructura de días para usar los checkboxes personalizados --- */}
          <div className={styles.filterSection}>
            <h3>Días Disponibles</h3>
            {DAYS_OF_WEEK.map(day => (
              <label key={day}>
                <input type="checkbox" checked={filters.availabilityDays.includes(day)} onChange={() => handleFilterChange('availabilityDays', day)} />
                {day}
              </label>
            ))}
          </div>
        </aside>

        <main className={styles.resultsPanel}>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.grid}>
            <ServiceCard service={dummyService} />
            {loading && Array.from({ length: CARDS_PER_PAGE }).map((_, i) => <CardSkeleton key={i} />)}
            {!loading && !error && services.map(service => <ServiceCard key={service.id} service={service} />)}
          </div>
          {!loading && services.length === 0 && !error && (
            <p className={styles.noResults}>No se encontraron servicios con estos criterios.</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default ServicePanel;