import React, { useState, useCallback } from 'react';
// Este import hace que los estilos en CSS Modules se apliquen solo a este componente
import styles from './RegistrarServicio.module.css';

// --- Constantes ---
const CATEGORIES = [
  { value: 'paseo', label: 'Paseo de Mascotas' },
  { value: 'veterinaria', label: 'Veterinaria' },
  { value: 'adiestramiento', label: 'Adiestramiento' },
  { value: 'traslados', label: 'Traslados' },
  { value: 'guarderia', label: 'Guardería' },
  { value: 'otros', label: 'Otros' },
];

const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// --- Componentes Hijos ---
const FormField = ({ id, label, charLimit, children }) => (
  <div className={styles.formGroup}>
    <label htmlFor={id} className={styles.label}>
      {label}
    </label>
    {children}
    {charLimit && (
      <span className={styles.charCount}>{charLimit}</span>
    )}
  </div>
);

// --- Componente Principal ---
const ServiceForm = () => {
  const [formData, setFormData] = useState({
    serviceName: '',
    category: '',
    description: '',
    price: '',
    priceType: 'por_hora',
    modality: '',
    location: '',
    observations: '',
    photos: [],
    availability: {
      days: [],
      time: { 
        from: '', 
        to: '' 
      },
    },
  });

  const handleChange = useCallback((e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (name === 'availability.days') {
      setFormData((prev) => {
        const currentDays = prev.availability.days;
        const updatedDays = checked
          ? [...currentDays, value]
          : currentDays.filter((day) => day !== value);
        return { ...prev, availability: { ...prev.availability, days: updatedDays } };
      });
      return;
    }

    if (name.startsWith('availability.time')) {
        const timeField = name.split('.')[2];
        setFormData(prev => ({
            ...prev,
            availability: {
                ...prev.availability,
                time: {
                    ...prev.availability.time,
                    [timeField]: value,
                }
            }
        }));
        return;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'file' ? Array.from(files) : value,
    }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Datos del formulario:', formData);
    alert('¡Servicio registrado con éxito! 🐾');
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Registra tu Servicio</h2>
          <p className={styles.subtitle}>
            Forma parte de nuestra comunidad y ofrece lo mejor para nuestras mascotas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* SECCIÓN 1: INFORMACIÓN DEL SERVICIO */}
          <fieldset className={styles.section}>
            <legend className={styles.sectionTitle}>Información del Servicio</legend>
            
            <FormField id="serviceName" label="Nombre del Servicio">
              <input type="text" id="serviceName" name="serviceName" value={formData.serviceName} onChange={handleChange} placeholder="Ej: Paseos Felices" required />
            </FormField>

            <FormField id="category" label="Categoría">
              <select id="category" name="category" value={formData.category} onChange={handleChange} required>
                <option value="">Selecciona una categoría...</option>
                {CATEGORIES.map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </FormField>
            
            {/* --- CORRECCIÓN APLICADA AQUÍ ---
               Usamos un div.grid para cada par de campos que van en dos columnas.
               Esto asegura que cada par se alinee correctamente.
            */}
            <div className={styles.grid}>
              <FormField id="price" label="Precio (ARS)">
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Ej: 5000"
                  min="0"
                />
              </FormField>
              <FormField id="priceType" label="Tipo de Tarifa">
                <select
                  id="priceType"
                  name="priceType"
                  value={formData.priceType}
                  onChange={handleChange}
                >
                  <option value="por_hora">Por hora</option>
                  <option value="por_servicio">Por servicio</option>
                  <option value="a_convenir">A convenir</option>
                </select>
              </FormField>
            </div>
            
            <div className={styles.grid}>
              <FormField id="modality" label="Modalidad">
                <select id="modality" name="modality" value={formData.modality} onChange={handleChange} required>
                  <option value="">Selecciona una...</option>
                  <option value="presencial">Presencial</option>
                  <option value="domicilio">A domicilio</option>
                </select>
              </FormField>
              <FormField id="location" label="Ubicación">
                <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} placeholder="Ej: Palermo, CABA" required />
              </FormField>
            </div>
            
            <FormField id="description" label="Descripción del Servicio" charLimit={`${formData.description.length}/500`}>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe tu servicio, experiencia, tarifas..." rows="5" maxLength="500" required />
            </FormField>

          </fieldset>
          
          {/* SECCIÓN 2: DETALLES ADICIONALES */}
          <fieldset className={styles.section}>
             <legend className={styles.sectionTitle}>Detalles Adicionales</legend>
            
            <FormField id="photos" label="Fotos del Servicio">
              <input type="file" id="photos" name="photos" onChange={handleChange} multiple accept="image/*" className={styles.fileInput} />
            </FormField>

            <FormField id="observations" label="Observaciones (Opcional)" charLimit={`${formData.observations.length}/200`}>
                <textarea id="observations" name="observations" value={formData.observations} onChange={handleChange} placeholder="Notas extra sobre tu servicio..." rows="3" maxLength="200" />
            </FormField>
            
            <div className={styles.formGroup}>
                <label className={styles.label}>Disponibilidad</label>
                <div className={styles.availabilityDays}>
                    {DAYS_OF_WEEK.map(day => (
                        <label key={day} className={styles.dayCheckbox}>
                            <input type="checkbox" name="availability.days" value={day} checked={formData.availability.days.includes(day)} onChange={handleChange} />
                            <span>{day.substring(0, 3)}</span>
                        </label>
                    ))}
                </div>
                <div className={styles.availabilityTime}>
                    <label htmlFor="timeFrom">Desde</label>
                    <input
                      type="time"
                      id="timeFrom"
                      name="availability.time.from"
                      value={formData.availability.time.from}
                      onChange={handleChange}
                      className={styles.timeInput}
                    />
                    <span>-</span>
                    <label htmlFor="timeTo">Hasta</label>
                    <input
                      type="time"
                      id="timeTo"
                      name="availability.time.to"
                      value={formData.availability.time.to}
                      onChange={handleChange}
                      className={styles.timeInput}
                    />
                </div>
            </div>

          </fieldset>

          <button type="submit" className={styles.submitButton}>
            Registrar Servicio
          </button>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;