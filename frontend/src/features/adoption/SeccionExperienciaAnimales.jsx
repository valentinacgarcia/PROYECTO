import React, { useState, useEffect } from 'react';
import './SeccionExperienciaAnimales.css';

const opcionesSiNo = ["SI", "NO"];

const SeccionExperienciaAnimales = ({ onChange }) => {
  const [data, setData] = useState({
    tuvoMascotasAntes: '',
    tieneMascotasActuales: '',
    mascotasVacunadas: ''
  });

  useEffect(() => {
    onChange(data);
  }, [data, onChange]);

  const handleChange = (name, value) => {
    setData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="seccion-container">
      <h3>3. Experiencia con animales</h3>

      {/* Pregunta 1 */}
      <div className="campo-form">
        <label>¿Tuviste mascotas antes?</label>
        <div className="chips-container">
          {opcionesSiNo.map(opcion => (
            <div
              key={opcion}
              className={`chip ${data.tuvoMascotasAntes === opcion ? 'chip-seleccionado' : ''}`}
              onClick={() => handleChange('tuvoMascotasAntes', opcion)}
            >
              {opcion}
            </div>
          ))}
        </div>
      </div>

      {/* Pregunta 2 */}
      <div className="campo-form">
        <label>¿Tenés otras mascotas actualmente?</label>
        <div className="chips-container">
          {opcionesSiNo.map(opcion => (
            <div
              key={opcion}
              className={`chip ${data.tieneMascotasActuales === opcion ? 'chip-seleccionado' : ''}`}
              onClick={() => handleChange('tieneMascotasActuales', opcion)}
            >
              {opcion}
            </div>
          ))}
        </div>
      </div>

      {/* Pregunta 3 (Condicional) */}
      {data.tieneMascotasActuales === 'SI' && (
        <div className="campo-form">
          <label>¿Están vacunadas/castradas?</label>
          <div className="chips-container">
            {opcionesSiNo.map(opcion => (
              <div
                key={opcion}
                className={`chip ${data.mascotasVacunadas === opcion ? 'chip-seleccionado' : ''}`}
                onClick={() => handleChange('mascotasVacunadas', opcion)}
              >
                {opcion}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeccionExperienciaAnimales;
