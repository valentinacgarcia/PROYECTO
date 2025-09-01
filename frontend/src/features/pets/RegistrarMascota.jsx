import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    fotos: [],
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
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const navigate = useNavigate();

  const razasPerro = [
    'Mestizo', 'Caniche', 'Labrador Retriever', 'Golden Retriever',
    'Bulldog Francés', 'Shitzu', 'Dachshund', 'Beagle', 'Schnauzer', 'Boxer', 'Otro'
  ];

  const razasGato = [
    'Mestizo', 'Siamés', 'Persa', 'Maine Coon', 'Bengalí', 'Ragdoll', 'British Shorthair', 'Otro'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      const selectedFiles = Array.from(files);
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      const invalidFiles = selectedFiles.filter(file => !allowedTypes.includes(file.type));
      
      if (invalidFiles.length > 0) {
        setError('Solo se permiten archivos PNG y JPG.');
        setFormData((prev) => ({ ...prev, fotos: [] }));
        e.target.value = '';
        return;
      }

      setError('');
      setFormData((prev) => ({ ...prev, fotos: selectedFiles }));
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
    setFormData((prev) => ({ ...prev, tipo, raza: '' }));
  };

  const handleSexoSelect = (sexo) => {
    setFormData((prev) => ({ ...prev, sexo }));
  };

  const handleTamañoSelect = (tamaño) => {
    setFormData((prev) => ({ ...prev, tamaño }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.tipo ||
      !formData.nombre ||
      !formData.sexo ||
      (!formData.fechaNacimiento && !formData.fechaRescate) ||
      !formData.tamaño ||
      formData.fotos.length === 0
    ) {
      setError('Por favor, complete todos los campos obligatorios.');
      return;
    }
    setError('');

    const usuario = JSON.parse(localStorage.getItem('user'));
    const ownerId = usuario?.id;

    if (!ownerId) {
      setError('No se encontró el usuario logueado.');
      return;
    }

    const fechaBase = new Date(formData.esFechaRescate ? formData.fechaRescate : formData.fechaNacimiento);
    const hoy = new Date();
    let ageYears = hoy.getFullYear() - fechaBase.getFullYear();
    let ageMonths = hoy.getMonth() - fechaBase.getMonth();
    if (ageMonths < 0) {
      ageYears -= 1;
      ageMonths += 12;
    }

    const data = new FormData();
    data.append('owner_id', ownerId);
    data.append('type', formData.tipo);
    data.append('name', formData.nombre);
    data.append('gender', formData.sexo);
    data.append('age_years', ageYears);
    data.append('age_months', ageMonths);
    data.append('size', formData.tamaño);
    data.append('is_purebred', formData.raza !== '' && formData.raza !== 'no-raza');
    data.append('breed', formData.raza || '');
    data.append('colors', JSON.stringify(formData.coloresPelaje));
    data.append('fur_length', formData.largoPelo);
    data.append('sterilized', formData.castrado);
    data.append('vaccinated', formData.vacunasAlDia);
    data.append('compatibility', JSON.stringify(formData.compatibilidad));
    data.append('description', formData.descripcion);
    data.append('location', ''); 

    formData.fotos.forEach((foto) => data.append('photos[]', foto));

    try {
      const response = await fetch('http://localhost:8000/pet/create', {
        method: 'POST',
        body: data,
      });

      if (!response.ok) throw new Error('Error al registrar la mascota');
      await response.json();
      setRegistroExitoso(true);
    } catch (err) {
      console.error(err);
      setError('Hubo un error al registrar la mascota.');
    }
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
            className={`icon-option ${formData.tipo === 'Perro' ? 'selected' : ''}`}
            onClick={() => handleTipoSelect('Perro')}
          >
            <img src={perro} alt="Perro" />
            <span>Perro</span>
          </div>
          <div
            className={`icon-option ${formData.tipo === 'Gato' ? 'selected' : ''}`}
            onClick={() => handleTipoSelect('Gato')}
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
          {['Macho', 'Hembra', 'No se'].map((sexo) => (
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
          {['Pequeño', 'Mediano', 'Grande'].map((tam) => (
            <span
              key={tam}
              className={`tamano-chip ${formData.tamaño === tam ? 'activo' : ''}`}
              onClick={() => handleTamañoSelect(tam)}
            >
              {tam.charAt(0).toUpperCase() + tam.slice(1)}
            </span>
          ))}
        </div>

        <label>Raza</label>
        <select name="raza" value={formData.raza} onChange={handleInputChange}>
          <option value="">Seleccionar raza</option>
          {(formData.tipo === 'Perro' ? razasPerro : razasGato).map((r) => (
            <option key={r} value={r.toLowerCase()}>{r}</option>
          ))}
        </select>

        <label>Foto de la mascota *</label>
        <input type="file" accept=".png, .jpg, .jpeg" multiple onChange={handleInputChange} />
        {formData.fotos.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            <strong>Archivos seleccionados:</strong>
            <ul>
              {formData.fotos.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          className="btn-toggle-opcionales"
          onClick={() => setMostrarOpcionales(!mostrarOpcionales)}
        >
          {mostrarOpcionales ? 'Ocultar detalles opcionales' : 'Agregar más detalles (opcional)'}
        </button>

        {mostrarOpcionales && (
          <div className="opcional-section">
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
              {['Corto', 'Medio', 'Largo'].map((largo) => (
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
              {['Sí', 'No', 'No sé'].map((opcion) => (
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
              {['Sí', 'No', 'No sé'].map((opcion) => (
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
              {['Niños', 'Perros', 'Gatos'].map((comp) => (
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

        <button type="submit" className="btn-submit">Registrar Mascota</button>
      </form>

      {registroExitoso && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Mascota registrada con éxito!</h3>
            <p>Tu mascota fue registrada correctamente.</p>
            <button className="boton-aceptar" onClick={() => navigate('/registrar-mascota')}>Aceptar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroMascota;
