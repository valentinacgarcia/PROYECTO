import React, { useState, useEffect } from 'react';
import './SeccionSituacionHabitacional.css';

const opcionesSiNo = ["SI", "NO"];
const opcionesTipoVivienda = ["CASA", "DEPARTAMENTO"];
const opcionesContrato = ["ALQUILO", "SOY PROPIETARIO"];
const opcionesSeguridad = ["RED", "CERRADA"];

const SeccionSituacionHabitacional = ({ onChange, initialData = {} }) => {
  const [data, setData] = useState({
    tipoVivienda: initialData.tipoVivienda || '',
    contrato: initialData.contrato || '',
    espacio: initialData.espacio || '',
    seguridad: initialData.seguridad || ''
  });

  useEffect(() => {
    onChange(data);
  }, [data, onChange]);

  const handleSelect = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="seccion-container">
      {/* Pregunta 1 */}
      <div className="campo-form">
        <label>Tipo de vivienda</label>
        <div className="chips-container">
          {opcionesTipoVivienda.map(opcion => (
            <div
              key={opcion}
              className={`chip ${data.tipoVivienda === opcion ? 'chip-seleccionado' : ''}`}
              onClick={() => handleSelect('tipoVivienda', opcion)}
            >
              {opcion}
            </div>
          ))}
        </div>
      </div>

      {/* Pregunta 2 */}
      <div className="campo-form">
        <label>¿Alquila o es propietario?</label>
        <div className="chips-container">
          {opcionesContrato.map(opcion => (
            <div
              key={opcion}
              className={`chip ${data.contrato === opcion ? 'chip-seleccionado' : ''}`}
              onClick={() => handleSelect('contrato', opcion)}
            >
              {opcion}
            </div>
          ))}
        </div>
      </div>

      {/* Pregunta 3 */}
      <div className="campo-form">
        <label>¿Cuenta con patio o jardín?</label>
        <div className="chips-container">
          {opcionesSiNo.map(opcion => (
            <div
              key={opcion}
              className={`chip ${data.espacio === opcion ? 'chip-seleccionado' : ''}`}
              onClick={() => handleSelect('espacio', opcion)}
            >
              {opcion}
            </div>
          ))}
        </div>
      </div>

      {/* Pregunta 4 */}
      <div className="campo-form">
        <label>¿La vivienda está segura para un animal?</label>
        <div className="chips-container">
          {opcionesSeguridad.map(opcion => (
            <div
              key={opcion}
              className={`chip ${data.seguridad === opcion ? 'chip-seleccionado' : ''}`}
              onClick={() => handleSelect('seguridad', opcion)}
            >
              {opcion}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeccionSituacionHabitacional;
