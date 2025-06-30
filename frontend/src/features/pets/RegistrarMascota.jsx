import React, { useState } from 'react';
import './RegistrarMascota.css';
import perro from '../../assets/perro.png';
import gato from '../../assets/gato.png';
import logo from '../../assets/logo.png';

const RegistroMascota = () => {
  const [formData, setFormData] = useState({
    tipo: '',
    nombre: '',
    sexo: '',
    fechaNacimiento: '',
    fechaRescate: '',
    tamaño: '',
    esFechaRescate: false,
    foto: null,
    raza: '',
    coloresPelaje: [],
    largoPelo: '',
    descripcion: '',
    castrado: '',
    vacunasAlDia: '',
    compatibilidad: [],
  });

  const [error, setError] = useState('');
  const [mostrarOpcionales, setMostrarOpcionales] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData((prev) => ({ ...prev, foto: files[0] }));
    } else if (type === 'checkbox' && name === 'coloresPelaje') {
      if (checked) {
        setFormData((prev) => ({
          ...prev,
          coloresPelaje: [...prev.coloresPelaje, value],
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          coloresPelaje: prev.coloresPelaje.filter((color) => color !== value),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleTipoSelect = (tipo) => {
    setFormData((prev) => ({ ...prev, tipo }));
  };

  const handleSexoSelect = (sexo) => {
    setFormData((prev) => ({ ...prev, sexo }));
  };

  const handleTamañoSelect = (tamaño) => {
    setFormData((prev) => ({ ...prev, tamaño }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.tipo ||
      !formData.nombre ||
      !formData.sexo ||
      (!formData.fechaNacimiento && !formData.fechaRescate) ||
      !formData.tamaño ||
      !formData.foto
    ) {
      setError('Por favor, complete todos los campos obligatorios.');
      return;
    }
    setError('');
    console.log('Mascota registrada:', formData);
  };

  return (
    <div className="registro-container">
      <form className="registro-mascota-form" onSubmit={handleSubmit}>
        <img src={logo} alt="Logo" className="form-logo" />
        <h2 className="form-title">Registrar Mascota</h2>

        {error && <p className="form-error">{error}</p>}

        <label>Tipo de mascota *</label>
        <div className="icon-selector">
          <div
            className={`icon-option ${formData.tipo === 'perro' ? 'selected' : ''}`}
            onClick={() => handleTipoSelect('perro')}
          >
            <img src={perro} alt="Perro" />
            <span>Perro</span>
          </div>
          <div
            className={`icon-option ${formData.tipo === 'gato' ? 'selected' : ''}`}
            onClick={() => handleTipoSelect('gato')}
          >
            <img src={gato} alt="Gato" />
            <span>Gato</span>
          </div>
        </div>

        <label>Nombre *</label>
        <input
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleInputChange}
          placeholder="Ej: Luna"
        />

        <label>Sexo *</label>
        <div className="chip-selector">
          {['macho', 'hembra', 'no se'].map((sexo) => (
            <span
              key={sexo}
              className={`sexo-chip ${formData.sexo === sexo ? 'activo' : ''}`}
              onClick={() => handleSexoSelect(sexo)}
            >
              {sexo.charAt(0).toUpperCase() + sexo.slice(1)}
            </span>
          ))}
        </div>

        <label>{formData.esFechaRescate ? 'Fecha de rescate *' : 'Fecha de nacimiento *'}</label>
        <input
          type="date"
          name={formData.esFechaRescate ? 'fechaRescate' : 'fechaNacimiento'}
          value={formData.esFechaRescate ? formData.fechaRescate : formData.fechaNacimiento}
          onChange={handleInputChange}
        />

        <div className="checkbox-fecha">
          <input
            type="checkbox"
            name="esFechaRescate"
            checked={formData.esFechaRescate}
            onChange={handleInputChange}
            id="esFechaRescate"
          />
          <label htmlFor="esFechaRescate">No sé la fecha exacta, es la fecha de rescate</label>
        </div>

        <label>Tamaño *</label>
        <div className="chip-selector">
          {['pequeño', 'mediano', 'grande'].map((tam) => (
            <span
              key={tam}
              className={`tamano-chip ${formData.tamaño === tam ? 'activo' : ''}`}
              onClick={() => handleTamañoSelect(tam)}
            >
              {tam.charAt(0).toUpperCase() + tam.slice(1)}
            </span>
          ))}
        </div>

        <label>Foto de la mascota *</label>
        <input type="file" accept="image/*" onChange={handleInputChange} />

        <button
          type="button"
          className="btn-toggle-opcionales"
          onClick={() => setMostrarOpcionales(!mostrarOpcionales)}
        >
          {mostrarOpcionales ? 'Ocultar detalles opcionales' : 'Agregar más detalles (opcional)'}
        </button>

        {mostrarOpcionales && (
          <div className="opcional-section">
            <label>Raza</label>
            <select name="raza" value={formData.raza} onChange={handleInputChange}>
              <option value="">Seleccionar raza</option>
              <option value="raza1">Raza 1</option>
              <option value="raza2">Raza 2</option>
              <option value="raza3">Raza 3</option>
              <option value="no-raza">No es de raza</option>
            </select>

            <label>Color del pelaje</label>
            <div className="checkbox-group">
              {['Blanco', 'Negro', 'Marrón', 'Tricolor', 'Otro'].map((color) => (
                <label key={color} className="checkbox-label">
                  <input
                    type="checkbox"
                    name="coloresPelaje"
                    value={color.toLowerCase()}
                    checked={formData.coloresPelaje.includes(color.toLowerCase())}
                    onChange={handleInputChange}
                  />
                  {color}
                </label>
              ))}
            </div>

            <label>Largo del pelo</label>
            <div className="chip-selector">
              {['corto', 'medio', 'largo'].map((largo) => (
                <span
                  key={largo}
                  className={`largo-chip ${formData.largoPelo === largo ? 'activo' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, largoPelo: largo }))}
                >
                  {largo.charAt(0).toUpperCase() + largo.slice(1)}
                </span>
              ))}
            </div>

            <label>Descripción</label>
            <textarea
              name="descripcion"
              value={formData.descripcion || ''}
              onChange={handleInputChange}
              placeholder="Contanos cómo es la mascota: personalidad, hábitos, etc."
              rows={4}
            />

            <label>¿Está castrado/a?</label>
            <div className="chip-selector">
              {['sí', 'no', 'no sé'].map((opcion) => (
                <span
                  key={opcion}
                  className={`castrado-chip ${formData.castrado === opcion ? 'activo' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, castrado: opcion }))}
                >
                  {opcion.charAt(0).toUpperCase() + opcion.slice(1)}
                </span>
              ))}
            </div>

            <label>¿Tiene vacunas al día?</label>
            <div className="chip-selector">
              {['sí', 'no', 'no sé'].map((opcion) => (
                <span
                  key={opcion}
                  className={`vacunas-chip ${formData.vacunasAlDia === opcion ? 'activo' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, vacunasAlDia: opcion }))}
                >
                  {opcion.charAt(0).toUpperCase() + opcion.slice(1)}
                </span>
              ))}
            </div>

            <label>Compatibilidad con otros</label>
            <div className="chip-selector multiple">
              {['niños', 'perros', 'gatos'].map((comp) => (
                <span
                  key={comp}
                  className={`compat-chip ${formData.compatibilidad?.includes(comp) ? 'activo' : ''}`}
                  onClick={() => {
                    const yaTiene = formData.compatibilidad?.includes(comp);
                    setFormData((prev) => ({
                      ...prev,
                      compatibilidad: yaTiene
                        ? prev.compatibilidad.filter((c) => c !== comp)
                        : [...(prev.compatibilidad || []), comp],
                    }));
                  }}
                >
                  {comp.charAt(0).toUpperCase() + comp.slice(1)}
                </span>
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="btn-submit">
          Registrar Mascota
        </button>
      </form>
    </div>
  );
};

export default RegistroMascota;
