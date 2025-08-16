import React, { useState, useEffect } from 'react';
import './SeccionCuidadosRutina.css';

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

const SeccionCuidadosRutina = ({ onChange, initialData = {} }) => {
  const [formData, setFormData] = useState({
    horasSolo: initialData.horasSolo || '',
    dondeDormira: initialData.dondeDormira || '',
    responsableCuidados: initialData.responsableCuidados || '',
    dispuestoCastrarVacunar: initialData.dispuestoCastrarVacunar || ''
  });

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);
  };

  useEffect(() => {
    setFormData({
      horasSolo: initialData.horasSolo || '',
      dondeDormira: initialData.dondeDormira || '',
      responsableCuidados: initialData.responsableCuidados || '',
      dispuestoCastrarVacunar: initialData.dispuestoCastrarVacunar || ''
    });
  }, [initialData]);

  return (
    <div className="seccion-container">
      <h3>4. Cuidados y rutina</h3>

      <div className="campo-form">
        <label>¿Cuánto tiempo estará el animal solo por día? (horas)</label>
        <input
          type="number"
          min="0"
          value={formData.horasSolo}
          onChange={(e) => handleChange('horasSolo', e.target.value)}
          placeholder="Ej: 4"
        />
      </div>

      <ChipGroup
        title="¿Dónde dormirá el animal?"
        options={['AFUERA', 'INTERIOR']}
        selected={formData.dondeDormira}
        onSelect={(value) => handleChange('dondeDormira', value)}
      />

      <div className="campo-form">
        <label>¿Quién se hará cargo de su alimentación, paseos y salud?</label>
        <input
          type="text"
          value={formData.responsableCuidados}
          onChange={(e) => handleChange('responsableCuidados', e.target.value)}
          placeholder="Ej: Yo / Mi pareja / Toda la familia"
        />
      </div>

      <ChipGroup
        title="¿Estás dispuesto a realizar castración/vacunación si corresponde?"
        options={['SI', 'NO']}
        selected={formData.dispuestoCastrarVacunar}
        onSelect={(value) => handleChange('dispuestoCastrarVacunar', value)}
      />
    </div>
  );
};

export default SeccionCuidadosRutina;