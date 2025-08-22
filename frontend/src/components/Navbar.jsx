import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

  // Estados separados
  const [ownerNotifications, setOwnerNotifications] = useState([]);
  const [matchNotifications, setMatchNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // IDs ya mostrados (evita duplicados entre polls)
  const seenNotifications = useRef(new Set());

  useEffect(() => {
    if (!isLoggedIn) return;
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) return;

    // --- Notificaciones para dueños (postulaciones pendientes) ---
    const fetchPostulations = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/adoptions/notifications/${user.id}`);
        const mapped = res.data.map(item => ({
          petition_id: `postulation-${item.petition_id}`,
          type: "postulation",
          postulante: item.interested_user_name,
          mascota: item.pet_name
        }));

        const newOnes = mapped.filter(n => !seenNotifications.current.has(n.petition_id));
        newOnes.forEach(n => seenNotifications.current.add(n.petition_id));

        if (newOnes.length > 0) {
          setOwnerNotifications(prev => [...newOnes, ...prev]);
          setUnreadCount(prev => prev + newOnes.length);
        }
      } catch (err) {
        console.error("Error al traer notificaciones de postulaciones:", err);
      }
    };

    // --- Notificaciones para interesados (match aceptado) ---
    const fetchMatches = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/adoptions/notifications/match/${user.id}`);

        // Mostrar SOLO los match cuyo interesado sea el usuario logueado
        const mapped = res.data
          .filter(item => Number(item.interested_user_id) === Number(user.id))
          .map(item => ({
            petition_id: `match-${item.petition_id}`,
            type: "match",
            postulante: item.interested_user_name,
            mascota: item.pet_name
          }));

        const newOnes = mapped.filter(n => !seenNotifications.current.has(n.petition_id));
        newOnes.forEach(n => seenNotifications.current.add(n.petition_id));

        if (newOnes.length > 0) {
          setMatchNotifications(prev => [...newOnes, ...prev]);
          setUnreadCount(prev => prev + newOnes.length);
        }
      } catch (err) {
        console.error("Error al traer notificaciones de match:", err);
      }
    };

    // Primer fetch inmediato
    fetchPostulations();
    fetchMatches();

    // Polling cada 5s
    const interval1 = setInterval(fetchPostulations, 5000);
    const interval2 = setInterval(fetchMatches, 5000);

    return () => {
      clearInterval(interval1);
      clearInterval(interval2);
    };
  }, [isLoggedIn]);

  const toggleNotifications = () => {
    setShowNotifications(prev => {
      const newShowValue = !prev;
      setShowChats(false);
      if (newShowValue) setUnreadCount(0);
      return newShowValue;
    });
  };

  const handleNotificationItemClick = (petitionId) => {
    // Eliminar la tarjeta al click
    setOwnerNotifications(prev => prev.filter(n => n.petition_id !== petitionId));
    setMatchNotifications(prev => prev.filter(n => n.petition_id !== petitionId));

    // Redirigir a solicitudes
    navigate('/postulaciones');
    setShowNotifications(false);
  };

  const toggleChats = () => {
    setShowChats(prev => !prev);
    setShowNotifications(false);
  };

  const handleLoginClick = () => navigate('/login');
  const handleRegisterClick = () => navigate('/register');
  const handleClickNuevaAdopcion = () => navigate('/formulario_nueva_adopcion');
  const handleProfileClick = () => {
    setMenuOpen(prev => !prev);
    setShowChats(false);
    setShowNotifications(false);
  };
  const handleDatosClick = () => { setMenuOpen(false); navigate('/datos'); };
  const handleRegistrarMascota = () => { setMenuOpen(false); navigate('/registrar-mascota'); };
  const handleHomeClick = () => navigate('/home');
  const handleMisSolicitudes = () => { setMenuOpen(false); navigate('/postulaciones'); };
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

  // Merge de notificaciones para mostrar
  const allNotifications = [...ownerNotifications, ...matchNotifications];

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
            <div className="bell-wrapper">
              <FaBell className="icon-button" onClick={toggleNotifications} title="Notificaciones" />
              {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
              {showNotifications && (
                <div className="dropdown-panel notifications-dropdown">
                  <h4>Notificaciones</h4>
                  {allNotifications.length === 0 ? (
                    <p>No hay nuevas notificaciones</p>
                  ) : (
                    allNotifications.map(n => (
                      <div
                        key={n.petition_id}
                        className="notification-item"
                        onClick={() => handleNotificationItemClick(n.petition_id)}
                      >
                        {n.type === "postulation"
                          ? (<><strong>🐾{n.postulante}</strong> quiere adoptar a <em>{n.mascota}</em></>)
                          : (<>🎉 ¡Tuviste un <strong>match</strong> con <em>{n.mascota}</em>🐾!</>)
                        }
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Chats */}
            <div className="icon-wrapper">
              <FaComments className="icon-button" onClick={toggleChats} title="Chats" />
              {showChats && (
                <div className="dropdown-panel">
                  <h4>Chats</h4>
                </div>
              )}
            </div>

            {/* Perfil */}
            <button className="nav-button profile" onClick={handleProfileClick}>Perfil</button>
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
                  onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                  style={{ fontWeight: 'bold' }}
                >
                  Eliminar cuenta
                </span>
                <hr className="dropdown-separator" />
                <span onClick={handleLogout}>Cerrar sesión</span>
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
