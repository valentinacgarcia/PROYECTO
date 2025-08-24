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
  const [modalMessage, setModalMessage] = useState('');

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

  const handleEditClick = () => setEditMode(true);
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

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const validatePhone = (phone) => {
    const phoneRegex = /^\+?\d{8,15}$/;
    return phoneRegex.test(phone);
  };

  const handleSaveClick = () => {
    if (!validateEmail(formData.email)) {
      setModalMessage('Por favor ingrese un email válido.');
      return;
    }

    if (!validatePhone(formData.telefono)) {
      setModalMessage('Por favor ingrese un teléfono válido (solo números y 8-15 dígitos).');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setModalMessage('No hay usuario logueado.');
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
      setEditMode(false);
      setModalMessage('Datos actualizados con éxito.');
    })
    .catch(error => {
      console.error('Error al actualizar:', error);
      setModalMessage('Hubo un error al actualizar los datos.');
    });
  };

  const closeModal = () => setModalMessage('');

  return (
    <div className="datos-container">
      <div className="profile-photo-container-user">
        <img src={profilePhoto} alt="Foto de perfil" className="profile-ph" />
      </div>

      <h2>Mis Datos</h2>

      <form className="datos-form" onSubmit={e => e.preventDefault()}>
        <label>
          Nombre:
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} disabled={!editMode} />
        </label>

        <label>
          Apellido:
          <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} disabled={!editMode} />
        </label>

        <label>
          Email:
          <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={!editMode} />
        </label>

        <label>
          Teléfono:
          <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} disabled={!editMode} />
        </label>

        <label>
          Dirección:
          <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} disabled={!editMode} />
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

      {modalMessage && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <p>{modalMessage}</p>
            <button className="modal-close-button" onClick={closeModal}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Datos;
