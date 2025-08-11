import React, { useState, useEffect } from 'react';
import './SeccionCuidadosRutina.css';

const opcionesSiNo = ["SI", "NO"];
const opcionesDormir = ["AFUERA", "INTERIOR"];

const SeccionCuidadosRutina = ({ onChange }) => {
  const [data, setData] = useState({
    horasSolo: '',
    dondeDormira: '',
    responsableCuidados: '',
    dispuestoCastrarVacunar: ''
  });

  useEffect(() => {
    onChange(data);
  }, [data, onChange]);

  const handleChange = (name, value) => {
    setData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="seccion-container">
      <h3>4. Cuidados y rutina</h3>

      {/* Pregunta 1 */}
      <div className="campo-form">
        <label>¿Cuánto tiempo estará el animal solo por día? (horas)</label>
        <input
          type="number"
          min="0"
          name="horasSolo"
          value={data.horasSolo}
          onChange={(e) => handleChange('horasSolo', e.target.value)}
          placeholder="Ej: 4"
        />
      </div>

      {/* Pregunta 2 */}
      <div className="campo-form">
        <label>¿Dónde dormirá el animal?</label>
        <div className="chips-container">
          {opcionesDormir.map(opcion => (
            <div
              key={opcion}
              className={`chip ${data.dondeDormira === opcion ? 'chip-seleccionado' : ''}`}
              onClick={() => handleChange('dondeDormira', opcion)}
            >
              {opcion}
            </div>
          ))}
        </div>
      </div>

      {/* Pregunta 3 */}
      <div className="campo-form">
        <label>¿Quién se hará cargo de su alimentación, paseos y salud?</label>
        <input
          type="text"
          name="responsableCuidados"
          value={data.responsableCuidados}
          onChange={(e) => handleChange('responsableCuidados', e.target.value)}
          placeholder="Ej: Yo / Mi pareja / Toda la familia"
        />
      </div>

      {/* Pregunta 4 */}
      <div className="campo-form">
        <label>¿Estás dispuesto a realizar castración/vacunación si corresponde?</label>
        <div className="chips-container">
          {opcionesSiNo.map(opcion => (
            <div
              key={opcion}
              className={`chip ${data.dispuestoCastrarVacunar === opcion ? 'chip-seleccionado' : ''}`}
              onClick={() => handleChange('dispuestoCastrarVacunar', opcion)}
            >
              {opcion}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeccionCuidadosRutina;
