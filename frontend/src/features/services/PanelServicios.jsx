import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { buildApiUrl } from '../../config/api';
import styles from './PanelServicios.module.css';
import './PanelServicios.css';

// --- Constantes y Datos de Configuración ---
const CARDS_PER_PAGE = 12;
const API_ENDPOINT = buildApiUrl('/services/list-all');

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
      src={service.photos && service.photos.length > 0 ? service.photos[0] : 'https://via.placeholder.com/300x200?text=Servicio'} 
      alt={service.serviceName} 
      className={styles.cardImage}
    />
    <div className={styles.cardInfo}>
      <span className={styles.cardCategory}>{service.category}</span>
      <h4 className={styles.cardTitle}>{service.serviceName}</h4>
      <p className={styles.cardDescription}>{service.description}</p>
      <div className={styles.cardLocation}>
        <span role="img" aria-label="location pin">📍</span> {service.address}
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


// --- Componente Principal ---
const ServicePanel = () => {
  const [services, setServices] = useState([]);
  const [totalServices, setTotalServices] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'map'
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  const [filters, setFilters] = useState({
    category: '',
    modality: [],
    priceRange: { min: '', max: '' },
    priceType: [],
    availabilityDays: [],
  });

  const [showFilters, setShowFilters] = useState(false); // Estado para menú móvil
  
  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: CARDS_PER_PAGE,
        search: searchTerm || undefined,
        category: filters.category || undefined,
        modality: filters.modality.length > 0 ? filters.modality[0] : undefined, // Solo el primer valor
        minPrice: filters.priceRange.min || undefined,
        maxPrice: filters.priceRange.max || undefined,
        priceType: filters.priceType.length > 0 ? filters.priceType[0] : undefined, // Solo el primer valor
        availabilityDays: filters.availabilityDays.length > 0 ? JSON.stringify(filters.availabilityDays) : undefined, // Enviar todos los días como JSON
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

  // Funciones para el mapa
  const getCategoryColor = (category) => {
    const colors = {
      'paseo': '#4CAF50',
      'veterinaria': '#F44336',
      'adiestramiento': '#FF9800',
      'traslados': '#2196F3',
      'guarderia': '#9C27B0',
      'otros': '#607D8B'
    };
    return colors[category] || '#607D8B';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'paseo': '🐕',
      'veterinaria': '🏥',
      'adiestramiento': '🎓',
      'traslados': '🚗',
      'guarderia': '🏠',
      'otros': '🔧'
    };
    return icons[category] || '📍';
  };

  const initializeMap = () => {
    if (mapInstanceRef.current || !mapRef.current) return;

    // Configurar iconos de Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
      iconUrl: require('leaflet/dist/images/marker-icon.png'),
      shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    });

    // Inicializar mapa
    const map = L.map(mapRef.current).setView([-31.4201, -64.1888], 12);
    mapInstanceRef.current = map;

    // Agregar capa de tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
  };

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current) return;

    console.log('Actualizando marcadores con servicios:', services.length, services);
    console.log('Filtros aplicados:', filters);

    // Limpiar marcadores existentes
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current.removeLayer(layer);
      }
    });

    // Agregar nuevos marcadores
    services.forEach(service => {
      if (service.latitude && service.longitude) {
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            background-color: ${getCategoryColor(service.category)};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 16px;
            border: 3px solid white;
            box-shadow: 0 3px 6px rgba(0,0,0,0.3);
          ">${getCategoryIcon(service.category)}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const leafletMarker = L.marker([parseFloat(service.latitude), parseFloat(service.longitude)], { icon: customIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="
              min-width: 280px; 
              max-width: 320px; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: white;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            ">
              <!-- Foto del servicio -->
              <div style="
                width: 100%; 
                height: 120px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: hidden;
              ">
                ${service.photos && service.photos.length > 0 ? 
                  `<img src="${service.photos[0]}" style="width: 100%; height: 100%; object-fit: cover;" alt="${service.serviceName}" />` :
                  `<div style="
                    color: white; 
                    font-size: 48px; 
                    opacity: 0.8;
                  ">${getCategoryIcon(service.category)}</div>`
                }
                <!-- Badge de categoría -->
                <div style="
                  position: absolute;
                  top: 8px;
                  left: 8px;
                  background: rgba(0,0,0,0.7);
                  color: white;
                  padding: 4px 8px;
                  border-radius: 12px;
                  font-size: 11px;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">${service.category}</div>
              </div>
              
              <!-- Contenido -->
              <div style="padding: 16px;">
                <!-- Título -->
                <h3 style="
                  margin: 0 0 8px 0; 
                  color: #1a1a1a; 
                  font-size: 18px; 
                  font-weight: 600;
                  line-height: 1.3;
                ">${service.serviceName}</h3>
                
                <!-- Dirección -->
                <div style="
                  display: flex;
                  align-items: center;
                  margin: 8px 0;
                  color: #666;
                  font-size: 13px;
                ">
                  <span style="margin-right: 6px; font-size: 14px;">📍</span>
                  <span>${service.address}</span>
                </div>
                
                <!-- Precio -->
                ${service.price ? `
                  <div style="
                    background: #f0f8f0;
                    border: 1px solid #28a745;
                    border-radius: 8px;
                    padding: 8px 12px;
                    margin: 12px 0;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                  ">
                    <span style="color: #28a745; font-weight: 600; font-size: 16px;">
                      $${service.price}
                    </span>
                    <span style="color: #666; font-size: 12px; text-transform: capitalize;">
                      ${service.priceType}
                    </span>
                  </div>
                ` : ''}
                
                <!-- Descripción -->
                ${service.description ? `
                  <p style="
                    margin: 12px 0; 
                    color: #555; 
                    font-size: 13px; 
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                  ">${service.description}</p>
                ` : ''}
                
                <!-- Botón Ver Detalle -->
                <button onclick="window.openServiceDetail(${service.id})" style="
                  width: 100%;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  border: none;
                  padding: 12px 16px;
                  border-radius: 8px;
                  font-size: 14px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.2s ease;
                  margin-top: 8px;
                " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)'" 
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                  Ver Detalle
                </button>
              </div>
            </div>
          `);
      }
    });
  };

  // Efecto para inicializar el mapa
  useEffect(() => {
    if (viewMode === 'map' && mapRef.current && !mapInstanceRef.current) {
      setTimeout(() => {
        initializeMap();
        // Actualizar marcadores inmediatamente con los servicios filtrados
        if (services.length > 0) {
          updateMapMarkers();
        }
      }, 100);
    }
  }, [viewMode]);

  // Efecto para actualizar marcadores cuando cambien los servicios
  useEffect(() => {
    if (viewMode === 'map' && mapInstanceRef.current) {
      updateMapMarkers();
    }
  }, [services, viewMode]);

  // Efecto para actualizar marcadores cuando se cambie a modo mapa
  useEffect(() => {
    if (viewMode === 'map' && mapInstanceRef.current) {
      // Pequeño delay para asegurar que el mapa esté completamente renderizado
      setTimeout(() => {
        updateMapMarkers();
      }, 200);
    }
  }, [viewMode]);

  // Función global para el botón "Ver Detalle"
  useEffect(() => {
    window.openServiceDetail = (serviceId) => {
      console.log('Abrir detalle del servicio:', serviceId);
      // TODO: Implementar navegación al detalle del servicio
      alert(`Próximamente: Detalle del servicio ${serviceId}`);
    };
  }, []);

  return (
    <div className={styles.panelContainer}>
      {/* Botón flotante de filtros para móvil */}
      <button 
        className="filters-toggle-btn"
        onClick={() => setShowFilters(true)}
      >
        🔍 Filtros
      </button>

      {/* Overlay para móvil */}
      {showFilters && (
        <div 
          className="filters-overlay"
          onClick={() => setShowFilters(false)}
        ></div>
      )}

      {/* Drawer de filtros para móvil */}
      <div className={`filters-drawer ${showFilters ? 'open' : ''}`}>
        <div className="filters-header">
          <h3>Filtros</h3>
          <button 
            className="close-filters"
            onClick={() => setShowFilters(false)}
          >
            ✕
          </button>
        </div>
        
        <div className="filters-content">
          <div className="filter-section">
            <h3>Categoría</h3>
            <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)} >
              <option value="">Todas</option>
              {SERVICE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="filter-section">
            <h3>Precio (ARS)</h3>
            <div className="price-range">
              <input type="number" name="priceRange.min" placeholder="Mín" value={filters.priceRange.min} onChange={(e) => handleFilterChange(e.target.name, e.target.value)} />
              <span>-</span>
              <input type="number" name="priceRange.max" placeholder="Máx" value={filters.priceRange.max} onChange={(e) => handleFilterChange(e.target.name, e.target.value)} />
            </div>
          </div>
          
          <div className="filter-section">
            <h3>Modalidad</h3>
            {MODALITIES.map(mod => (
              <label key={mod}>
                <input type="checkbox" checked={filters.modality.includes(mod)} onChange={() => handleFilterChange('modality', mod)} />
                <span>{mod}</span>
              </label>
            ))}
          </div>

          <div className="filter-section">
            <h3>Tipo de Tarifa</h3>
            {PRICE_TYPES.map(pt => (
              <label key={pt.value}>
                <input type="checkbox" checked={filters.priceType.includes(pt.value)} onChange={() => handleFilterChange('priceType', pt.value)} />
                <span>{pt.label}</span>
              </label>
            ))}
          </div>
          
          <div className="filter-section">
            <h3>Días Disponibles</h3>
            {DAYS_OF_WEEK.map(day => (
              <label key={day}>
                <input type="checkbox" checked={filters.availabilityDays.includes(day)} onChange={() => handleFilterChange('availabilityDays', day)} />
                <span>{day}</span>
              </label>
            ))}
          </div>

          <button 
            className="apply-filters-btn"
            onClick={() => setShowFilters(false)}
          >
            Aplicar Filtros
          </button>
        </div>
      </div>

      <header className={`${styles.header} header`}>
        <h1>Encuentra los mejores servicios</h1>
        <p>Busca entre paseadores, veterinarias, adiestradores y más profesionales cerca tuyo.</p>
        <div className={styles.searchBar}>
          <input type="text" placeholder="Buscar por nombre del servicio..." value={searchTerm} onChange={handleSearchChange} />
        </div>
        <div className={styles.viewToggle}>
          <label className={styles.toggleLabel}>
            <input 
              type="checkbox" 
              checked={viewMode === 'map'} 
              onChange={(e) => setViewMode(e.target.checked ? 'map' : 'cards')}
            />
            <span className={styles.toggleSlider}></span>
            <span className={styles.toggleText}>
              {viewMode === 'cards' ? 'Ver en mapa' : 'Ver en tarjetas'}
            </span>
          </label>
        </div>
      </header>
      
      <div className={`${styles.mainContent} main-content`}>
        <aside className={`${styles.sidebar} sidebar`}>
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
          {viewMode === 'cards' ? (
            <div className={styles.grid}>
              {loading && Array.from({ length: CARDS_PER_PAGE }).map((_, i) => <CardSkeleton key={i} />)}
              {!loading && !error && services.map(service => <ServiceCard key={service.id} service={service} />)}
            </div>
          ) : (
            <div className={styles.mapView}>
              <div ref={mapRef} className={styles.mapContainer}></div>
            </div>
          )}
          {!loading && services.length === 0 && !error && viewMode === 'cards' && (
            <p className={styles.noResults}>No se encontraron servicios con estos criterios.</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default ServicePanel;