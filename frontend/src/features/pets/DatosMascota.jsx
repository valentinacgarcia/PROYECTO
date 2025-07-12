import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './DatosMascota.css';
import perroIcon from '../../assets/perro.png';
import gatoIcon from '../../assets/gato.png';
import { FaTrashAlt, FaPlusCircle, FaTimesCircle } from 'react-icons/fa'; // Importar iconos adicionales

const DatosMascota = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mascota, setMascota] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [mostrarOpcionales, setMostrarOpcionales] = useState(false);
  const [error, setError] = useState('');
  const [edicionExitosa, setEdicionExitosa] = useState(false);
  const [eliminacionExitosa, setEliminacionExitosa] = useState(false);

  const [formData, setFormData] = useState({
    tipo: '',
    nombre: '',
    sexo: '',
    fechaNacimiento: '',
    fechaRescate: '',
    esFechaRescate: false,
    tamaño: '',
    // Cambiado de 'foto' a 'nuevasFotos' para los archivos que el usuario selecciona
    // 'fotosActuales' guardará las URLs de las fotos que ya tiene la mascota
    nuevasFotos: [],
    fotosActuales: [], // Array de URLs de fotos existentes
    raza: '',
    coloresPelaje: [],
    largoPelo: '',
    descripcion: '',
    castrado: '',
    vacunasAlDia: '',
    compatibilidad: [],
  });

  useEffect(() => {
    fetch(`http://localhost:8000/pet/detail/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setMascota(data);
        setFormData({
          tipo: data.type || '',
          nombre: data.name || '',
          sexo: data.gender || '',
          fechaNacimiento: !data.rescue_date ? calcularFechaDesdeEdad(data.age_years, data.age_months) : '',
          fechaRescate: data.rescue_date || '',
          esFechaRescate: !!data.rescue_date,
          tamaño: data.size || '',
          nuevasFotos: [], // Siempre inicia vacío para la edición
          fotosActuales: data.photos || [], // Cargar las URLs de las fotos existentes
          raza: data.breed || '',
          coloresPelaje: data.colors || [],
          largoPelo: data.fur_length || '',
          descripcion: data.description || '',
          castrado: data.sterilized || '',
          vacunasAlDia: data.vaccinated || '',
          compatibilidad: data.compatibility || [],
        });
      })
      .catch((err) => console.error('Error al cargar datos de la mascota:', err));
  }, [id]);

  const calcularFechaDesdeEdad = (años, meses) => {
    const hoy = new Date();
    hoy.setFullYear(hoy.getFullYear() - (años ?? 0));
    hoy.setMonth(hoy.getMonth() - (meses ?? 0));
    return hoy.toISOString().split('T')[0];
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'No informada';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      const selectedFiles = Array.from(files);
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      const invalidFiles = selectedFiles.filter(file => !allowedTypes.includes(file.type));

      if (invalidFiles.length > 0) {
        setError('Solo se permiten archivos PNG y JPG.');
        e.target.value = ''; // Limpiar el input para que pueda seleccionar de nuevo
        return;
      }

      setError('');
      // Añade las nuevas fotos al array de 'nuevasFotos'
      setFormData((prev) => ({
        ...prev,
        nuevasFotos: [...prev.nuevasFotos, ...selectedFiles],
      }));
    } else if (type === 'checkbox' && name === 'coloresPelaje') {
      setFormData((prev) => ({
        ...prev,
        coloresPelaje: checked
          ? [...prev.coloresPelaje, value]
          : prev.coloresPelaje.filter((color) => color !== value),
      }));
    } else if (type === 'checkbox' && name === 'esFechaRescate') {
      setFormData((prev) => ({ ...prev, esFechaRescate: checked }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Función para eliminar una foto actual (por su URL)
  const handleRemoveCurrentPhoto = (photoUrlToRemove) => {
    setFormData((prev) => ({
      ...prev,
      fotosActuales: prev.fotosActuales.filter(url => url !== photoUrlToRemove),
    }));
  };

  // Función para eliminar una nueva foto (por su índice en el array de nuevasFotos)
  const handleRemoveNewPhoto = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      nuevasFotos: prev.nuevasFotos.filter((_, index) => index !== indexToRemove),
    }));
  };

  // Chips handlers (sin cambios relevantes en su lógica)
  const handleTipoSelect = (tipo) => setFormData((prev) => ({ ...prev, tipo }));
  const handleSexoSelect = (sexo) => setFormData((prev) => ({ ...prev, sexo }));
  const handleTamañoSelect = (tamaño) => setFormData((prev) => ({ ...prev, tamaño }));
  const handleLargoPeloSelect = (largoPelo) => setFormData((prev) => ({ ...prev, largoPelo }));
  const handleCastradoSelect = (castrado) => setFormData((prev) => ({ ...prev, castrado }));
  const handleVacunasSelect = (vacunasAlDia) => setFormData((prev) => ({ ...prev, vacunasAlDia }));
  const handleCompatibilidadToggle = (item) => {
    setFormData((prev) => {
      const tiene = prev.compatibilidad.includes(item);
      return {
        ...prev,
        compatibilidad: tiene
          ? prev.compatibilidad.filter((c) => c !== item)
          : [...prev.compatibilidad, item],
      };
    });
  };

  const handleCancelar = () => {
    if (mascota) {
      // Al cancelar, restauramos el formData con los datos originales de la mascota
      setFormData({
        tipo: mascota.type || '',
        nombre: mascota.name || '',
        sexo: mascota.gender || '',
        fechaNacimiento: !mascota.rescue_date ? calcularFechaDesdeEdad(mascota.age_years, mascota.age_months) : '',
        fechaRescate: mascota.rescue_date || '',
        esFechaRescate: !!mascota.rescue_date,
        tamaño: mascota.size || '',
        nuevasFotos: [], // Las fotos nuevas se descartan al cancelar
        fotosActuales: mascota.photos || [], // Restaurar las fotos originales
        raza: mascota.breed || '',
        coloresPelaje: mascota.colors || [],
        largoPelo: mascota.fur_length || '',
        descripcion: mascota.description || '',
        castrado: mascota.sterilized || '',
        vacunasAlDia: mascota.vaccinated || '',
        compatibilidad: mascota.compatibility || [],
      });
    }
    setError('');
    setMostrarOpcionales(false);
    setEditMode(false);
  };

  const handleEliminar = async () => {
    const confirmacion = window.confirm('¿Estás seguro que querés eliminar esta mascota? Esta acción no se puede deshacer.');
    if (!confirmacion) return;

    try {
      const response = await fetch(`http://localhost:8000/pet/delete/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la mascota.');
      }

      setEliminacionExitosa(true);
    } catch (error) {
      console.error(error);
      setError('Hubo un error al eliminar la mascota.');
    }
  };

  const handleGuardar = async () => {
    if (
      !formData.tipo ||
      !formData.nombre ||
      !formData.sexo ||
      (!formData.fechaNacimiento && !formData.fechaRescate) ||
      !formData.tamaño
    ) {
      setError('Por favor, complete todos los campos obligatorios.');
      return;
    }

    // Validación: debe haber al menos una foto (actual o nueva)
    if (formData.fotosActuales.length === 0 && formData.nuevasFotos.length === 0) {
      setError('Por favor, suba al menos una foto para la mascota.');
      return;
    }

    const fechaBase = new Date(
      formData.esFechaRescate ? formData.fechaRescate : formData.fechaNacimiento
    );
    const hoy = new Date();
    let ageYears = hoy.getFullYear() - fechaBase.getFullYear();
    let ageMonths = hoy.getMonth() - fechaBase.getMonth();
    if (ageMonths < 0) {
      ageYears -= 1;
      ageMonths += 12;
    }

    const dataToSend = new FormData(); // Usamos FormData para enviar archivos y otros datos
    dataToSend.append('type', formData.tipo);
    dataToSend.append('name', formData.nombre);
    dataToSend.append('gender', formData.sexo);
    dataToSend.append('age_years', ageYears);
    dataToSend.append('age_months', ageMonths);
    dataToSend.append('size', formData.tamaño);
    dataToSend.append('is_purebred', formData.raza !== '' && formData.raza !== 'no-raza');
    dataToSend.append('breed', formData.raza || '');
    dataToSend.append('colors', JSON.stringify(formData.coloresPelaje));
    dataToSend.append('fur_length', formData.largoPelo);
    dataToSend.append('sterilized', formData.castrado);
    dataToSend.append('vaccinated', formData.vacunasAlDia);
    dataToSend.append('compatibility', JSON.stringify(formData.compatibilidad));
    dataToSend.append('description', formData.descripcion);
    dataToSend.append('rescue_date', formData.esFechaRescate ? formData.fechaRescate : '');
    dataToSend.append('birth_date', !formData.esFechaRescate ? formData.fechaNacimiento : '');

    // Adjuntar las fotos nuevas
    formData.nuevasFotos.forEach((file) => {
      dataToSend.append('new_photos[]', file); // Usar un nombre de campo distinto para nuevas fotos
    });

    // Enviar las URLs de las fotos existentes que se deben conservar
    // Tu backend necesitará una forma de procesar esto, por ejemplo, eliminando las fotos que no estén en esta lista
    dataToSend.append('existing_photo_urls', JSON.stringify(formData.fotosActuales));


    try {
      // OJO: Si tu backend no está configurado para FormData con PUT,
      // podrías necesitar cambiar el método a POST y manejarlo en el servidor
      // o usar un PUT con application/json para los datos y un PATCH para las fotos
      // Lo más común para PUT con archivos es usar FormData.
      const response = await fetch(`http://localhost:8000/pet/edit/${id}`, {
        method: 'PUT',
        body: dataToSend, // No necesitas 'Content-Type' con FormData, el navegador lo pone automáticamente
      });

      if (!response.ok) {
        const errorData = await response.json(); // Intentar obtener más detalles del error
        throw new Error(errorData.message || 'Error al guardar los cambios en la mascota.');
      }

      // Re-fetch de los datos actualizados para reflejar los cambios en la UI
      const updated = await fetch(`http://localhost:8000/pet/detail/${id}`);
      const updatedMascota = await updated.json();

      setMascota(updatedMascota);
      // Reiniciar las nuevas fotos después de guardar
      setFormData((prev) => ({
        ...prev,
        nuevasFotos: [],
        fotosActuales: updatedMascota.photos || [], // Asegurarse de que las fotos actuales se actualicen con lo que devuelve el backend
      }));
      setEditMode(false);
      setMostrarOpcionales(false);
      setError('');
      setEdicionExitosa(true);
    } catch (err) {
      console.error(err);
      setError(`Hubo un error al guardar los cambios: ${err.message || ''}`);
    }
  };

  if (!mascota) return <div className="datos-container"><p>Cargando datos...</p></div>;

  // Combinar fotos actuales y nuevas para la visualización en el modo edición
  const allPhotosForDisplay = [
    ...formData.fotosActuales,
    ...formData.nuevasFotos.map(file => URL.createObjectURL(file))
  ];

  return (
    <div className="datos-container">
      <div className="contenido-principal-horizontal">
        {/* Columna izquierda: Fotos */}
        <div className="columna foto-col">
          <div className="profile-photo-container">
            {editMode ? (
              <div className="photo-gallery-edit">
                {allPhotosForDisplay.length > 0 ? (
                  allPhotosForDisplay.map((photoUrl, index) => (
                    <div key={index} className="photo-item-edit">
                      <img
                        src={photoUrl}
                        alt={`Mascota ${index + 1}`}
                        className="profile-photo-thumbnail"
                      />
                      <button
                        type="button"
                        className="remove-photo-button"
                        onClick={() => {
                          // Determinar si es una foto actual o una nueva
                          if (index < formData.fotosActuales.length) {
                            handleRemoveCurrentPhoto(photoUrl);
                          } else {
                            handleRemoveNewPhoto(index - formData.fotosActuales.length);
                          }
                        }}
                      >
                        <FaTimesCircle />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="no-photos-message">No hay fotos cargadas.</p>
                )}
                {/* Botón para añadir más fotos */}
                <label htmlFor="file-input" className="add-photo-button">
                  <FaPlusCircle />
                  <span>Añadir foto(s)</span>
                  <input
                    id="file-input"
                    type="file"
                    accept=".png, .jpg, .jpeg"
                    multiple
                    onChange={handleInputChange}
                    style={{ display: 'none' }} // Ocultar el input nativo
                  />
                </label>
              </div>
            ) : (
              // Modo vista - muestra solo la primera foto
              <img
                src={mascota.photos?.[0] || '/placeholder.jpg'} // Muestra la primera foto guardada o un placeholder
                alt={mascota.name}
                className="profile-photo"
              />
            )}
          </div>
        </div>

        {/* Contenedor central + derecho */}
        <div className="datos-central-derecha">
          <h2 className="titulo-principal">Datos de {formData.nombre || mascota.name}</h2>
          <div className="datos-columns">
            {/* Columna central: Datos principales */}
            <div className="columna principales-col">
              {error && <p className="form-error">{error}</p>}

              <label>Tipo de mascota:</label>
              {editMode ? (
                <div className="icon-selector">
                  {['Perro', 'Gato'].map((tipo) => ( // Cambié a mayúscula inicial para coincidir con el estado
                    <div
                      key={tipo}
                      className={`icon-option ${formData.tipo === tipo ? 'selected' : ''}`}
                      onClick={() => handleTipoSelect(tipo)}
                    >
                      <img src={tipo === 'Perro' ? perroIcon : gatoIcon} alt={tipo} />
                      <span>{tipo}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <input type="text" value={mascota.type || ''} disabled />
              )}

              <label>Nombre:</label>
              {editMode ? (
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Luna"
                />
              ) : (
                <input type="text" value={mascota.name || ''} disabled />
              )}

              <label>Sexo:</label>
              {editMode ? (
                <div className="chip-selector">
                  {['Macho', 'Hembra', 'No se'].map((sexo) => (
                    <span
                      key={sexo}
                      className={`sexo-chip ${formData.sexo === sexo ? 'activo' : ''}`}
                      onClick={() => handleSexoSelect(sexo)}
                    >
                      {sexo}
                    </span>
                  ))}
                </div>
              ) : (
                <input type="text" value={mascota.gender || ''} disabled />
              )}

              <label>{formData.esFechaRescate ? 'Fecha de rescate:' : 'Edad:'}</label>
              {editMode ? (
                <>
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
                </>
              ) : (
                <input
                  type="text"
                  value={
                    mascota.rescue_date
                      ? `Rescatado el ${formatearFecha(mascota.rescue_date)}`
                      : mascota.age_years === 0 && mascota.age_months === 0
                        ? 'No informada'
                        : `${mascota.age_years} año${mascota.age_years !== 1 ? 's' : ''} y ${mascota.age_months} mes${mascota.age_months !== 1 ? 'es' : ''}`
                  }
                  disabled
                />
              )}

              <label>Tamaño:</label>
              {editMode ? (
                <div className="chip-selector">
                  {['Pequeño', 'Mediano', 'Grande'].map((tam) => (
                    <span
                      key={tam}
                      className={`tamano-chip ${formData.tamaño === tam ? 'activo' : ''}`}
                      onClick={() => handleTamañoSelect(tam)}
                    >
                      {tam}
                    </span>
                  ))}
                </div>
              ) : (
                <input type="text" value={mascota.size || ''} disabled />
              )}
            </div>

            {/* Columna derecha: Datos secundarios */}
            <div className="columna secundarios-col">
              <label>Raza:</label>
              {editMode ? (
                <select name="raza" value={formData.raza} onChange={handleInputChange}>
                  <option value="">Seleccionar raza</option>
                  <option value="raza1">Raza 1</option>
                  <option value="raza2">Raza 2</option>
                  <option value="raza3">Raza 3</option>
                  <option value="no-raza">No es de raza</option>
                </select>
              ) : (
                <input type="text" value={mascota.breed || 'No informada'} disabled />
              )}

              <label>Color del pelaje:</label>
              {editMode ? (
                <div className="checkbox-group">
                  {['Blanco', 'Negro', 'Marrón', 'Tricolor', 'Otro'].map((color) => (
                    <label key={color} className="checkbox-label">
                      <input
                        type="checkbox"
                        name="coloresPelaje"
                        value={color.toLowerCase()} // Mantener en minúsculas para el value
                        checked={formData.coloresPelaje.includes(color.toLowerCase())}
                        onChange={handleInputChange}
                      />
                      {color}
                    </label>
                  ))}
                </div>
              ) : (
                <input type="text" value={mascota.colors?.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ') || 'No informado'} disabled />
              )}

              <label>Largo del pelaje:</label>
              {editMode ? (
                <div className="chip-selector">
                  {['Corto', 'Medio', 'Largo'].map((largo) => (
                    <span
                      key={largo}
                      className={`largo-chip ${formData.largoPelo === largo ? 'activo' : ''}`}
                      onClick={() => handleLargoPeloSelect(largo)}
                    >
                      {largo}
                    </span>
                  ))}
                </div>
              ) : (
                <input type="text" value={mascota.fur_length || 'No informado'} disabled />
              )}

              <label>Descripción:</label>
              {editMode ? (
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Contanos cómo es la mascota: personalidad, hábitos, etc."
                />
              ) : (
                <textarea value={mascota.description || 'Sin descripción'} disabled />
              )}

              <label>Castrado/a:</label>
              {editMode ? (
                <div className="chip-selector">
                  {['Sí', 'No', 'No sé'].map((opcion) => (
                    <span
                      key={opcion}
                      className={`castrado-chip ${formData.castrado === opcion ? 'activo' : ''}`}
                      onClick={() => handleCastradoSelect(opcion)}
                    >
                      {opcion}
                    </span>
                  ))}
                </div>
              ) : (
                <input type="text" value={mascota.sterilized || 'No informado'} disabled />
              )}

              <label>Vacunas al día:</label>
              {editMode ? (
                <div className="chip-selector">
                  {['Sí', 'No', 'No sé'].map((opcion) => (
                    <span
                      key={opcion}
                      className={`vacunas-chip ${formData.vacunasAlDia === opcion ? 'activo' : ''}`}
                      onClick={() => handleVacunasSelect(opcion)}
                    >
                      {opcion}
                    </span>
                  ))}
                </div>
              ) : (
                <input type="text" value={mascota.vaccinated || 'No informado'} disabled />
              )}

              <label>Compatibilidad:</label>
              {editMode ? (
                <div className="chip-selector multiple">
                  {['Niños', 'Perros', 'Gatos'].map((comp) => (
                    <span
                      key={comp}
                      className={`compat-chip ${formData.compatibilidad.includes(comp) ? 'activo' : ''}`}
                      onClick={() => handleCompatibilidadToggle(comp)}
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              ) : (
                <input type="text" value={mascota.compatibility?.join(', ') || 'No informada'} disabled />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modales y botones */}
      {edicionExitosa && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>¡Cambios guardados con éxito!</h3>
            <p>La información de la mascota se actualizó correctamente.</p>
            <button className="boton-aceptar" onClick={() => setEdicionExitosa(false)}>
              Aceptar
            </button>
          </div>
        </div>
      )}

      {eliminacionExitosa && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Mascota eliminada con éxito</h3>
            <p>La información de la mascota fue borrada correctamente.</p>
            <button className="boton-aceptar" onClick={() => navigate('/registrar-mascota')}>
              Aceptar
            </button>
          </div>
        </div>
      )}

      <div className="botones-container">
        <div className="botones-edicion">
          {editMode ? (
            <>
              <button className="editar-button guardar" onClick={handleGuardar}>Guardar</button>
              <button className="editar-button cancelar" onClick={handleCancelar}>Cancelar</button>
            </>
          ) : (
            <button className="editar-button" onClick={() => setEditMode(true)}>Editar</button>
          )}
        </div>
        {editMode && (
          <div className="boton-eliminar">
            <button className="editar-button eliminar" onClick={handleEliminar}>
              <FaTrashAlt />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatosMascota;