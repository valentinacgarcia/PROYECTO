import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaBell } from 'react-icons/fa';

const NotificationBell = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

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

  // Merge de notificaciones para mostrar
  const allNotifications = [...ownerNotifications, ...matchNotifications];

  return (
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
  );
};

export default NotificationBell;