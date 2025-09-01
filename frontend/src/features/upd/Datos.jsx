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
    direccion: '',
  });

  const [editMode, setEditMode] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });

  // Regex para validaciones
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^(?:\+54|0)?[1-9]\d{9,10}$/;

  // Cargar datos desde localStorage al montar el componente
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setFormData({
        nombre: user.name || '',
        apellido: user.last_name || '',
        email: user.email || '',
        telefono: user.phone || '',
        direccion: user.address || '',
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancelClick = () => {
    setEditMode(false);
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setFormData({
        nombre: user.name || '',
        apellido: user.last_name || '',
        email: user.email || '',
        telefono: user.phone || '',
        direccion: user.address || '',
      });
    }
  };

  // Función para mostrar mensajes de feedback
  const showFeedback = (message, type = 'error') => {
    setFeedback({ message, type });
    setTimeout(() => {
      setFeedback({ message: '', type: '' });
    }, 3000); // desaparece después de 3s
  };

  const handleSaveClick = () => {
    // Validaciones
    if (!formData.nombre.trim()) {
      showFeedback('El nombre es obligatorio');
      return;
    }

    if (!formData.email.trim()) {
      showFeedback('El email es obligatorio');
      return;
    }

    if (!emailRegex.test(formData.email)) {
      showFeedback('Por favor ingrese un email válido');
      return;
    }

    if (formData.telefono && !phoneRegex.test(formData.telefono)) {
      showFeedback('Por favor ingrese un teléfono válido (Argentina)');
      return;
    }

    setEditMode(false);

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      showFeedback('No hay usuario logueado');
      return;
    }

    axios.put(`http://localhost:8000/user/edit/${user.id}`, {
      name: formData.nombre,
      last_name: formData.apellido,
      email: formData.email,
      phone: formData.telefono,
      address: formData.direccion,
    })
    .then(response => {
      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setFormData({
        nombre: updatedUser.name || '',
        apellido: updatedUser.last_name || '',
        email: updatedUser.email || '',
        telefono: updatedUser.phone || '',
        direccion: updatedUser.address || '',
      });
      showFeedback('Datos actualizados con éxito', 'success');
    })
    .catch(error => {
      console.error('Error al actualizar:', error);
      showFeedback('Hubo un error al actualizar los datos');
    });
  };

  return (
    <div className="datos-container-usuario">
      {/* Mensaje de feedback */}
      {feedback.message && (
        <div className={`feedback-message ${feedback.type === 'success' ? 'success' : ''}`}>
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

        <label>
          Dirección:
          <input
            type="text"
            name="direccion"
            value={formData.direccion}
            onChange={handleChange}
            disabled={!editMode}
          />
        </label>

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
