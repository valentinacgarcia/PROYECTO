import React, { useState, useEffect } from 'react';
import './SeccionComposicionHogar.css';

const opciones = {
  siNo: ["SI", "NO"]
};

const SeccionComposicionHogar = ({ onChange }) => {
  const [data, setData] = useState({
    personas: '',
    hayNinos: '',
    alergias: '',
    acuerdo: ''
  });

  useEffect(() => {
    onChange(data);
  }, [data, onChange]);

  const handleChange = (name, value) => {
    setData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="seccion-container">
      <h3>2. Composición del hogar</h3>

      {/* Número de personas */}
      <div className="campo-form">
        <label>¿Cuántas personas viven en el hogar?</label>
        <input
          type="number"
          min="1"
          value={data.personas}
          onChange={(e) => handleChange('personas', e.target.value)}
          placeholder="Ej: 4"
        />
      </div>

      {/* Niños */}
      <div className="campo-form">
        <label>¿Hay niños?</label>
        <div className="chips-container">
          {opciones.siNo.map(opcion => (
            <div
              key={opcion}
              className={`chip ${data.hayNinos === opcion ? 'chip-seleccionado' : ''}`}
              onClick={() => handleChange('hayNinos', opcion)}
            >
              {opcion}
            </div>
          ))}
        </div>
      </div>

      {/* Alergias o condiciones */}
      <div className="campo-form">
        <label>¿Hay personas alérgicas o con condiciones médicas especiales?</label>
        <div className="chips-container">
          {opciones.siNo.map(opcion => (
            <div
              key={opcion}
              className={`chip ${data.alergias === opcion ? 'chip-seleccionado' : ''}`}
              onClick={() => handleChange('alergias', opcion)}
            >
              {opcion}
            </div>
          ))}
        </div>
      </div>

      {/* Acuerdo de todos */}
      <div className="campo-form">
        <label>¿Todos están de acuerdo con la adopción?</label>
        <div className="chips-container">
          {opciones.siNo.map(opcion => (
            <div
              key={opcion}
              className={`chip ${data.acuerdo === opcion ? 'chip-seleccionado' : ''}`}
              onClick={() => handleChange('acuerdo', opcion)}
            >
              {opcion}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeccionComposicionHogar;
