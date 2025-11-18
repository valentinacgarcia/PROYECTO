import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl } from '../config/api';
import './Navbar.css';
import logo from '../assets/logo.png';
import NotificationBell from '../features/notifications/NotificationBell';
import ChatPanel from '../features/chats/ChatPanel';

const Navbar = ({ isLoggedIn, handleLogout }) => {
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(null); // "perfil" | "chats" | "notificaciones" | null
  const [selectedChatId, setSelectedChatId] = useState(null); // Para abrir un chat específico
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Estado para menú móvil

  const handleLoginClick = () => navigate('/login');
  const handleRegistrarServicios = () => { setActiveDropdown(null); navigate('/servicios'); };
  const handleServiciosClick = () => navigate('/panel_servicios');
  const handleRegisterClick = () => navigate('/register');
  const handleClickNuevaAdopcion = () => navigate('/formulario_nueva_adopcion');
  const handleDatosClick = () => { setActiveDropdown(null); navigate('/datos'); };
  const handleRegistrarMascota = () => { setActiveDropdown(null); navigate('/registrar-mascota'); };
  const handleHomeClick = () => navigate('/home');
  const handleMisSolicitudes = () => { setActiveDropdown(null); navigate('/postulaciones'); };
  const handleClickAdoptar = () => navigate('/panel_adopcion');
  const handleDashboard = () => { setActiveDropdown(null); navigate('/dashboard_adopciones'); };

  // Funciones para menú móvil
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleMobileNavClick = (action) => {
    action();
    closeMobileMenu();
  };

  const handleDeleteAccount = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) { setDeleteError('No se encontró usuario logueado.'); return; }

    setLoadingDelete(true);
    setDeleteError(null);
    setDeleteMessage(null);

    axios.delete(buildApiUrl(`/user/delete/${user.id}`))
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

  const handleChatClose = () => {
    setActiveDropdown(null);
    setSelectedChatId(null); // Limpiar el chat seleccionado al cerrar
  };

  // Nueva función para abrir chat desde notificaciones
  const handleOpenChatFromNotification = (chatId = null) => {
    setSelectedChatId(chatId);
    setActiveDropdown("chats");
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
        <span className="nav-item" onClick={handleServiciosClick}>Servicios</span>
        <span className="nav-item">Nosotros</span>
      </div>

      <div className="navbar-right">
        {/* Notificaciones móviles - solo en móvil */}
        {isLoggedIn && (
          <div className="mobile-notifications">
            <NotificationBell
              isLoggedIn={isLoggedIn}
              isOpen={activeDropdown === "notificaciones"}
              onClick={() => toggleDropdown("notificaciones")}
              onClose={() => setActiveDropdown(null)}
              onOpenChat={handleOpenChatFromNotification}
            />
          </div>
        )}

        {/* Botón hamburguesa para móvil */}
        <button 
          className="mobile-menu-toggle" 
          onClick={toggleMobileMenu}
          aria-label="Abrir menú"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Contenido desktop */}
        <div className="navbar-desktop">
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
                  onOpenChat={handleOpenChatFromNotification} // Nueva prop
                />
              </div>

              {/* Chat - UN SOLO ChatPanel que maneja tanto el ícono como el panel */}
              <div className="icon-wrapper">
                <ChatPanel
                  userId={JSON.parse(localStorage.getItem("user"))?.id}
                  isOpen={activeDropdown === "chats"}
                  onClose={handleChatClose}
                  onToggle={() => toggleDropdown("chats")}
                  selectedChatId={selectedChatId} // Nueva prop para chat específico
                />
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
                  <span>Favoritos</span>
                  <hr className="dropdown-separator" />
                  <span onClick={handleRegistrarServicios}>Mis Servicios</span>
                  <hr className="dropdown-separator" />
                  <span onClick={handleDashboard}>Reportes</span>
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
      </div>

      {/* Menú móvil desplegable */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-content">
          <div className="mobile-nav-items">
            <span className="mobile-nav-item" onClick={() => handleMobileNavClick(handleHomeClick)}>🏠 Inicio</span>
            <span className="mobile-nav-item" onClick={() => handleMobileNavClick(handleClickAdoptar)}>🐕 Adoptar</span>
            <span className="mobile-nav-item" onClick={() => handleMobileNavClick(handleClickNuevaAdopcion)}>📝 Dar en adopción</span>
            <span className="mobile-nav-item" onClick={() => handleMobileNavClick(handleServiciosClick)}>🛠️ Servicios</span>
            <span className="mobile-nav-item">👥 Nosotros</span>
          </div>
          
          {!isLoggedIn ? (
            <div className="mobile-auth-buttons">
              <button className="mobile-nav-button" onClick={() => handleMobileNavClick(handleLoginClick)}>Iniciar sesión</button>
              <button className="mobile-nav-button register" onClick={() => handleMobileNavClick(handleRegisterClick)}>Registrarse</button>
            </div>
          ) : (
            <div className="mobile-user-section">
              <div className="mobile-user-actions">
                <span className="mobile-nav-item" onClick={() => handleMobileNavClick(handleDatosClick)}>👤 Mis datos</span>
                <span className="mobile-nav-item" onClick={() => handleMobileNavClick(handleRegistrarMascota)}>🐾 Mis mascotas</span>
                <span className="mobile-nav-item" onClick={() => handleMobileNavClick(handleMisSolicitudes)}>📋 Mis solicitudes</span>
                <span className="mobile-nav-item" onClick={() => handleMobileNavClick(handleRegistrarServicios)}>🛠️ Mis Servicios</span>
                <span className="mobile-nav-item">❤️ Favoritos</span>
              </div>
              
              <div className="mobile-logout-section">
                <button className="mobile-nav-button logout" onClick={() => handleMobileNavClick(handleLogout)}>Cerrar sesión</button>
                <button 
                  className="mobile-nav-button delete" 
                  onClick={() => handleMobileNavClick(() => setConfirmDelete(true))}
                >
                  Eliminar cuenta
                </button>
              </div>
            </div>
          )}
        </div>
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