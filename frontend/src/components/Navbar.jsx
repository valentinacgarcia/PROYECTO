import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';
import logo from '../assets/logo.png';
import { FaBell, FaComments } from 'react-icons/fa';

const Navbar = ({ isLoggedIn, handleLogout }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChats, setShowChats] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [isLoggedIn]);

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
    setShowChats(false);
  };

  const toggleChats = () => {
    setShowChats((prev) => !prev);
    setShowNotifications(false);
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const handleClickNuevaAdopcion = () => {
    navigate('/formulario_nueva_adopcion');
  }

  const handleProfileClick = () => {
    setMenuOpen((prev) => !prev);
    setShowChats(false);
    setShowNotifications(false);
  };

  const handleDatosClick = () => {
    setMenuOpen(false);
    navigate('/datos');
  };

  const handleRegistrarMascota = () => {
    setMenuOpen(false);
    navigate('/registrar-mascota')
  }

  const handleHomeClick = () => {
    navigate('/home');
  };

  const handleMisSolicitudes = () => {
    setMenuOpen(false);
    navigate('/postulaciones');
  }
  
  const handleClickAdoptar = () => {
    navigate('/panel_adopcion');
  }

  const handleDeleteAccount = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      setDeleteError('No se encontró usuario logueado.');
      return;
    }

    setLoadingDelete(true);
    setDeleteError(null);
    setDeleteMessage(null);

    fetch(`http://localhost:8000/user/delete/${user.id}`, {
      method: 'DELETE',
    })
      .then((response) => {
        setLoadingDelete(false);
        if (!response.ok) {
          throw new Error('Error al eliminar la cuenta');
        }
        return response.json();
      })
      .then(() => {
        localStorage.removeItem('user');
        handleLogout();
        setDeleteMessage('Cuenta eliminada con éxito. Redirigiendo...');
        setTimeout(() => {
          navigate('/home');
          setConfirmDelete(false);
        }, 2000);
      })
      .catch((error) => {
        setLoadingDelete(false);
        setDeleteError('Hubo un error al eliminar la cuenta. Intente más tarde.');
        console.error(error);
      });
  };

  return (
    <nav className="navbar">
      <div className="navbar-left" onClick={handleHomeClick} style={{ cursor: 'pointer' }}>
        <img src={logo} alt="Logo" className="logo" />
        <span className="brand-name">PetMatch</span>
      </div>

      <div className="navbar-center">
        <span className="nav-item" onClick={handleHomeClick}>Inicio</span>
        <span className="nav-item" onClick={handleClickAdoptar}>Adopta</span>
        <span className="nav-item" onClick={handleClickNuevaAdopcion}>Da en adopción</span>
        <span className="nav-item">Servicios</span>
        <span className="nav-item">Nosotros</span>
      </div>

      <div className="navbar-right">
        {!isLoggedIn ? (
          <>
            <button className="nav-button" onClick={handleLoginClick}>
              Iniciar sesión
            </button>
            <button className="nav-button register" onClick={handleRegisterClick}>
              Registrarse
            </button>
          </>
        ) : (
          <div className="navbar-icons">
            {/* Notificaciones */}
            <div className="icon-wrapper">
              <FaBell
                className="icon-button"
                onClick={toggleNotifications}
                title="Notificaciones"
              />
              {showNotifications && (
                <div className="dropdown-panel">
                  <h4>Notificaciones</h4>
                </div>
              )}
            </div>

            {/* Chats */}
            <div className="icon-wrapper">
              <FaComments
                className="icon-button"
                onClick={toggleChats}
                title="Chats"
              />
              {showChats && (
                <div className="dropdown-panel">
                  <h4>Chats</h4>
                </div>
              )}
            </div>

            {/* Botón Perfil */}
            <button className="nav-button profile" onClick={handleProfileClick}>
              Perfil
            </button>

            {menuOpen && (
              <div className="perfil-dropdown">
                <span onClick={handleDatosClick}>Mis datos</span>
                <span onClick={handleRegistrarMascota}>Mis mascotas</span>
                <span onClick={handleMisSolicitudes}>Mis solicitudes</span>
                <hr className="dropdown-separator"/>
                <span>Favoritos</span>
                <hr className="dropdown-separator"/>
                <span onClick={handleLogout}>Cerrar sesión</span>
                <span
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmDelete(true);
                  }}
                  style={{ fontWeight: 'bold' }}
                >
                  Eliminar cuenta
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>¿Eliminar cuenta?</h3>
            <p>Esta acción es irreversible. ¿Estás seguro?</p>
            {deleteError && <p className="modal-error">{deleteError}</p>}
            {deleteMessage && <p className="modal-success">{deleteMessage}</p>}
            <div className="modal-buttons">
              <button
                onClick={handleDeleteAccount}
                disabled={loadingDelete}
                className="modal-button delete"
              >
                {loadingDelete ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={loadingDelete}
                className="modal-button cancel"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;