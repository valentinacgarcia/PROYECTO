import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaBell } from 'react-icons/fa';

const NotificationBell = ({ isLoggedIn, isOpen, onClick, onClose }) => {
  const navigate = useNavigate();
  const [ownerNotifications, setOwnerNotifications] = useState([]);
  const [matchNotifications, setMatchNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenNotifications = useRef(new Set());

  // Función para cargar notificaciones vistas desde localStorage
  const loadSeenNotifications = (userId) => {
    const stored = localStorage.getItem(`seenNotifications_${userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        seenNotifications.current = new Set(parsed);
      } catch (err) {
        console.error('Error parsing seen notifications:', err);
        seenNotifications.current = new Set();
      }
    } else {
      seenNotifications.current = new Set();
    }
  };

  // Función para guardar notificaciones vistas en localStorage
  const saveSeenNotifications = (userId) => {
    try {
      const seenArray = Array.from(seenNotifications.current);
      localStorage.setItem(`seenNotifications_${userId}`, JSON.stringify(seenArray));
    } catch (err) {
      console.error('Error saving seen notifications:', err);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) return;

    // Cargar notificaciones vistas al inicializar
    loadSeenNotifications(user.id);

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
        
        if (newOnes.length > 0) {
          // Marcar nuevas notificaciones como vistas para futuras cargas
          newOnes.forEach(n => seenNotifications.current.add(n.petition_id));
          saveSeenNotifications(user.id);
          
          setOwnerNotifications(prev => [...newOnes, ...prev]);
          setUnreadCount(prev => prev + newOnes.length);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchMatches = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/adoptions/notifications/match/${user.id}`);
        const mapped = res.data
          .filter(item => Number(item.interested_user_id) === Number(user.id))
          .map(item => ({
            petition_id: `match-${item.petition_id}`,
            type: "match",
            postulante: item.interested_user_name,
            mascota: item.pet_name
          }));
        
        const newOnes = mapped.filter(n => !seenNotifications.current.has(n.petition_id));
        
        if (newOnes.length > 0) {
          // Marcar nuevas notificaciones como vistas para futuras cargas
          newOnes.forEach(n => seenNotifications.current.add(n.petition_id));
          saveSeenNotifications(user.id);
          
          setMatchNotifications(prev => [...newOnes, ...prev]);
          setUnreadCount(prev => prev + newOnes.length);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchPostulations();
    fetchMatches();

    const interval1 = setInterval(fetchPostulations, 5000);
    const interval2 = setInterval(fetchMatches, 5000);

    return () => {
      clearInterval(interval1);
      clearInterval(interval2);
    };
  }, [isLoggedIn]);

  const handleNotificationItemClick = (petitionId) => {
    const user = JSON.parse(localStorage.getItem("user"));
    
    // Actualizar estado local
    setOwnerNotifications(prev => prev.filter(n => n.petition_id !== petitionId));
    setMatchNotifications(prev => prev.filter(n => n.petition_id !== petitionId));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Asegurar que la notificación esté marcada como vista
    if (!seenNotifications.current.has(petitionId)) {
      seenNotifications.current.add(petitionId);
      if (user?.id) {
        saveSeenNotifications(user.id);
      }
    }
    
    navigate('/postulaciones');
    onClose();
  };

  const allNotifications = [...ownerNotifications, ...matchNotifications];

  return (
    <div className="bell-wrapper">
      <FaBell
        className="icon-button"
        onClick={onClick}
        title="Notificaciones"
      />
      {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}

      {isOpen && (
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