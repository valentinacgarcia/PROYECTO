import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Datos.css';
import profilePhoto from '../../assets/foto1.jpg';

const Datos = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: {
      calle: '',
      numero: '',
      ciudad: '',
      codigoPostal: '',
      provincia: '',
      pais: '',
    },
  });

  const [editMode, setEditMode] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [direccionVisible, setDireccionVisible] = useState(false);

  // Regex para validaciones
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(?:\+54|0)?[1-9]\d{9,10}$/;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      const direccionSeparada = user.address
        ? parseDireccion(user.address)
        : {
            calle: '',
            numero: '',
            ciudad: '',
            codigoPostal: '',
            provincia: '',
            pais: '',
          };
      setFormData({
        nombre: user.name || '',
        apellido: user.last_name || '',
        email: user.email || '',
        telefono: user.phone || '',
        direccion: direccionSeparada,
      });
    }
  }, []);

  const parseDireccion = (address) => {
    const partes = address.split(',').map(p => p.trim());
    return {
      calle: partes[0] || '',
      numero: '',
      ciudad: partes[1] || '',
      codigoPostal: partes[2]?.replace('CP ', '') || '',
      provincia: partes[3] || '',
      pais: partes[4] || '',
    };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('direccion.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        direccion: {
          ...prev.direccion,
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditClick = () => setEditMode(true);
  const handleCancelClick = () => {
    setEditMode(false);
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      const direccionSeparada = user.address
        ? parseDireccion(user.address)
        : {
            calle: '',
            numero: '',
            ciudad: '',
            codigoPostal: '',
            provincia: '',
            pais: '',
          };
      setFormData({
        nombre: user.name || '',
        apellido: user.last_name || '',
        email: user.email || '',
        telefono: user.phone || '',
        direccion: direccionSeparada,
      });
    }
  };

  const showFeedback = (message, type = 'error') => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback({ message: '', type: '' });
    }, 3000);
  };

  const handleSaveClick = () => {
  // Validaciones generales
  if (!formData.nombre.trim()) {
    showFeedback('El nombre es obligatorio');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    return;
  }
  if (!formData.email.trim()) {
    showFeedback('El email es obligatorio');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    return;
  }
  if (!emailRegex.test(formData.email)) {
    showFeedback('Por favor ingrese un email válido');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    return;
  }
  if (formData.telefono && !phoneRegex.test(formData.telefono)) {
    showFeedback('Por favor ingrese un teléfono válido (Argentina)');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    return;
  }

  // Validaciones obligatorias de dirección
  if (!formData.direccion.calle.trim()) {
    showFeedback('La calle es obligatoria');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    return;
  }
  if (!formData.direccion.numero.trim()) {
    showFeedback('El número es obligatorio');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    return;
  }

  setEditMode(false);

  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    showFeedback('No hay usuario logueado');
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    return;
  }

  const direccionCompleta = `${formData.direccion.calle} ${formData.direccion.numero}, ${formData.direccion.ciudad}, CP ${formData.direccion.codigoPostal}, ${formData.direccion.provincia}, ${formData.direccion.pais}`;

  axios
    .put(`http://localhost:8000/user/edit/${user.id}`, {
      name: formData.nombre,
      last_name: formData.apellido,
      email: formData.email,
      phone: formData.telefono,
      address: direccionCompleta,
    })
    .then(response => {
      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      const direccionSeparada = updatedUser.address
        ? parseDireccion(updatedUser.address)
        : formData.direccion;
      setFormData({
        nombre: updatedUser.name || '',
        apellido: updatedUser.last_name || '',
        email: updatedUser.email || '',
        telefono: updatedUser.phone || '',
        direccion: direccionSeparada,
      });
      showFeedback('Datos actualizados con éxito', 'success');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    })
    .catch(error => {
      console.error('Error al actualizar:', error);
      showFeedback('Hubo un error al actualizar los datos');
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    });
};


  return (
    <div className="datos-container-usuario">
      {feedback.message && (
        <div
          className={`feedback-message ${feedback.type === 'success' ? 'success' : ''}`}
        >
          {feedback.message}
        </div>
      )}

      <div className="profile-photo-container-user">
        <img src={profilePhoto} alt="Foto de perfil" className="profile-ph" />
      </div>

      <h2>Mis Datos</h2>
      <form className="datos-form-usuario" onSubmit={e => e.preventDefault()}>
        <label>
          Nombre:
          <input
            type="text"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            disabled={!editMode}
          />
        </label>

        <label>
          Apellido:
          <input
            type="text"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            disabled={!editMode}
          />
        </label>

        <label>
          Email:
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={!editMode}
          />
        </label>

        <label>
          Teléfono:
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={handleChange}
            disabled={!editMode}
          />
        </label>

        {/* BLOQUE DE DIRECCIÓN */}
        <div className="direccion-section">
          <div
            className="direccion-header"
            onClick={() => setDireccionVisible(!direccionVisible)}
          >
            <span>Dirección</span>
            <span className="arrow">{direccionVisible ? '▲' : '▼'}</span>
          </div>

          <div className={`direccion-fields ${direccionVisible ? 'visible' : 'hidden'}`}>
            <label>
              Calle:
              <input
                type="text"
                name="direccion.calle"
                value={formData.direccion.calle}
                onChange={handleChange}
                disabled={!editMode}
              />
            </label>
            <label>
              Número:
              <input
                type="text"
                name="direccion.numero"
                value={formData.direccion.numero}
                onChange={handleChange}
                disabled={!editMode}
              />
            </label>
            <label>
              Ciudad:
              <input
                type="text"
                name="direccion.ciudad"
                value={formData.direccion.ciudad}
                onChange={handleChange}
                disabled={!editMode}
              />
            </label>
            <label>
              Código Postal:
              <input
                type="text"
                name="direccion.codigoPostal"
                value={formData.direccion.codigoPostal}
                onChange={handleChange}
                disabled={!editMode}
              />
            </label>
            <label>
              Provincia:
              <input
                type="text"
                name="direccion.provincia"
                value={formData.direccion.provincia}
                onChange={handleChange}
                disabled={!editMode}
              />
            </label>
            <label>
              País:
              <input
                type="text"
                name="direccion.pais"
                value={formData.direccion.pais}
                onChange={handleChange}
                disabled={!editMode}
              />
            </label>
          </div>
        </div>

        <div className="botones">
          {!editMode ? (
            <button type="button" className="edit-button" onClick={handleEditClick}>
              Editar
            </button>
          ) : (
            <>
              <button type="button" className="save-button" onClick={handleSaveClick}>
                Guardar
              </button>
              <button type="button" className="cancel-button" onClick={handleCancelClick}>
                Cancelar
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default Datos;
