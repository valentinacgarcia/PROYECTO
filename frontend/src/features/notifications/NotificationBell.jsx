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

  useEffect(() => {
    if (!isLoggedIn) return;
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) return;

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
        newOnes.forEach(n => seenNotifications.current.add(n.petition_id));
        if (newOnes.length > 0) {
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
    setOwnerNotifications(prev => prev.filter(n => n.petition_id !== petitionId));
    setMatchNotifications(prev => prev.filter(n => n.petition_id !== petitionId));
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
