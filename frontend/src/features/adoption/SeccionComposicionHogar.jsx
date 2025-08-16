import React, { useState, useEffect } from 'react';
import './SeccionComposicionHogar.css';

const SeccionComposicionHogar = ({ onChange, initialData = {} }) => {
  const [formData, setFormData] = useState({
    personas: initialData.personas || '',
    hayNinos: initialData.hayNinos || '',
    alergias: initialData.alergias || '',
    acuerdo: initialData.acuerdo || ''
  });

  // Actualización inmediata al padre
  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData); // Envía los datos actualizados inmediatamente
  };

  // Sincronización con initialData
  useEffect(() => {
    setFormData({
      personas: initialData.personas || '',
      hayNinos: initialData.hayNinos || '',
      alergias: initialData.alergias || '',
      acuerdo: initialData.acuerdo || ''
    });
  }, [initialData]);

  return (
    <div className="seccion-container">
      <h3>2. Composición del hogar</h3>

      <div className="campo-form">
        <label>¿Cuántas personas viven en el hogar?</label>
        <input
          type="number"
          min="1"
          value={formData.personas}
          onChange={(e) => handleChange('personas', e.target.value)}
          placeholder="Ej: 4"
        />
      </div>

      <ChipGroup 
        title="¿Hay niños?"
        options={['SI', 'NO']}
        selected={formData.hayNinos}
        onSelect={(value) => handleChange('hayNinos', value)}
      />

      <ChipGroup 
        title="¿Hay personas alérgicas o con condiciones médicas especiales?"
        options={['SI', 'NO']}
        selected={formData.alergias}
        onSelect={(value) => handleChange('alergias', value)}
      />

      <ChipGroup 
        title="¿Todos están de acuerdo con la adopción?"
        options={['SI', 'NO']}
        selected={formData.acuerdo}
        onSelect={(value) => handleChange('acuerdo', value)}
      />
    </div>
  );
};

// Componente ChipGroup reutilizable
const ChipGroup = ({ title, options, selected, onSelect }) => (
  <div className="campo-form">
    <label>{title}</label>
    <div className="chips-container">
      {options.map(option => (
        <button
          key={option}
          type="button"
          className={`chip ${selected === option ? 'chip-seleccionado' : ''}`}
          onClick={() => onSelect(option)}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
);

export default SeccionComposicionHogar;