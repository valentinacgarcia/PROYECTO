import React, { useState, useEffect } from 'react';
import './Datos.css';
import profilePhoto from '../../assets/foto1.jpg';

const Datos = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    password: '',
  });

  const [editMode, setEditMode] = useState(false);

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
        password: '', // Por seguridad no cargamos la contraseña
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

  const validateEmail = (email) => {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
};

  const handleCancelClick = () => {
    setEditMode(false);
    // Opcional: Resetear datos a los que están en localStorage si se cancela
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setFormData({
        nombre: user.name || '',
        apellido: user.last_name || '',
        email: user.email || '',
        telefono: user.phone || '',
        direccion: user.address || '',
        password: '',
      });
    }
  };



  const handleSaveClick = () => {
    setEditMode(false);

    // Validar campos antes (opcional)
    if (!validateEmail(formData.email)) {
      alert('Por favor ingrese un email válido.');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('No hay usuario logueado');
      return;
    }

    fetch(`http://localhost:8000/user/edit/${user.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: formData.nombre,
        last_name: formData.apellido,
        email: formData.email,
        phone: formData.telefono,
        address: formData.direccion,
        // password: formData.password, // si permitís cambiar contraseña
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al actualizar datos');
        }
        return response.json();
      })
      .then((updatedUser) => {
        // Actualizar localStorage con el usuario actualizado
        localStorage.setItem('user', JSON.stringify(updatedUser));
        alert('Datos actualizados con éxito');
        // También podés actualizar formData si querés sincronizar la UI
        setFormData({
          nombre: updatedUser.name || '',
          apellido: updatedUser.last_name || '',
          email: updatedUser.email || '',
          telefono: updatedUser.phone || '',
          direccion: updatedUser.address || '',
          password: '', // contraseña no se maneja aquí
        });
      })
      .catch((error) => {
        console.error('Error al actualizar:', error);
        alert('Hubo un error al actualizar los datos.');
      });
  };

  return (
    <div className="datos-container">
      <div className="profile-photo-container">
        <img src={profilePhoto} alt="Foto de perfil" className="profile-photo" />
      </div>

      <h2>Mis Datos</h2>
      <form className="datos-form" onSubmit={e => e.preventDefault()}>
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

        <label>
          Contraseña:
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            disabled={!editMode}
            placeholder="Ingrese nueva contraseña si desea cambiar"
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