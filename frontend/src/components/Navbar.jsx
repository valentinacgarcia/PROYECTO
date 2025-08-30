import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';
import logo from '../assets/logo.png';
import { FaComments } from 'react-icons/fa';
import NotificationBell from '../features/notifications/NotificationBell';
import ChatPanel from '../features/chats/ChatPanel';

const Navbar = ({ isLoggedIn, handleLogout }) => {
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null); // "perfil" | "chats" | "notificaciones" | null
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const handleLoginClick = () => navigate('/login');
  const handleRegisterClick = () => navigate('/register');
  const handleClickNuevaAdopcion = () => navigate('/formulario_nueva_adopcion');
  const handleDatosClick = () => { setActiveDropdown(null); navigate('/datos'); };
  const handleRegistrarMascota = () => { setActiveDropdown(null); navigate('/registrar-mascota'); };
  const handleHomeClick = () => navigate('/home');
  const handleMisSolicitudes = () => { setActiveDropdown(null); navigate('/postulaciones'); };
  const handleClickAdoptar = () => navigate('/panel_adopcion');

  const handleDeleteAccount = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) { setDeleteError('No se encontró usuario logueado.'); return; }

    setLoadingDelete(true);
    setDeleteError(null);
    setDeleteMessage(null);

    axios.delete(`http://localhost:8000/user/delete/${user.id}`)
      .then(() => {
        setLoadingDelete(false);
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

  const toggleDropdown = (dropdown) => {
    setActiveDropdown((prev) => (prev === dropdown ? null : dropdown));
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
            <button className="nav-button" onClick={handleLoginClick}>Iniciar sesión</button>
            <button className="nav-button register" onClick={handleRegisterClick}>Registrarse</button>
          </>
        ) : (
          <div className="navbar-icons">
            {/* Notificaciones */}
            <div className="icon-wrapper">
              <NotificationBell
                isLoggedIn={isLoggedIn}
                isOpen={activeDropdown === "notificaciones"}
                onClick={() => toggleDropdown("notificaciones")}
                onClose={() => setActiveDropdown(null)}
              />
            </div>

            {/* Chats */}
            <div className="icon-wrapper">
              <FaComments
                className="icon-button"
                onClick={() => toggleDropdown("chats")}
                title="Chats"
              />
              {activeDropdown === "chats" && (
                <ChatPanel
                  userId={JSON.parse(localStorage.getItem("user"))?.id}
                  onClose={() => setActiveDropdown(null)}
                />
              )}
            </div>

            {/* Perfil */}
            <button
              className="nav-button profile"
              onClick={() => toggleDropdown("perfil")}
            >
              Perfil
            </button>
            {activeDropdown === "perfil" && (
              <div className="perfil-dropdown">
                <span onClick={handleDatosClick}>Mis datos</span>
                <span onClick={handleRegistrarMascota}>Mis mascotas</span>
                <span onClick={handleMisSolicitudes}>Mis solicitudes</span>
                <hr className="dropdown-separator" />
                <span>Favoritos</span>
                <hr className="dropdown-separator" />
                <span onClick={handleLogout}>Cerrar sesión</span>
                <span
                  onClick={() => { setActiveDropdown(null); setConfirmDelete(true); }}
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
