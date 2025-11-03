import React, { useState, useEffect } from 'react';
import { FaComments, FaTimes } from 'react-icons/fa';
import ChatPanel from '../features/chats/ChatPanel';
import { buildApiUrl } from '../config/api';
import axios from 'axios';
import './MobileChatBubble.css';

const MobileChatBubble = ({ userId, isLoggedIn }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedChatId, setSelectedChatId] = useState(null);

  // Función para obtener el conteo de mensajes no leídos
  const fetchUnreadCount = async () => {
    if (!isLoggedIn || !userId) return;
    
    try {
      const response = await axios.get(buildApiUrl(`/chats/user/${userId}`));
      const chats = response.data;
      
      let totalUnread = 0;
      for (const chat of chats) {
        if (chat.unread_count) {
          totalUnread += chat.unread_count;
        }
      }
      
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    if (isLoggedIn && userId) {
      fetchUnreadCount();
      // Polling cada 5 segundos para actualizar el conteo (Cloudflare no tiene límites)
      const interval = setInterval(fetchUnreadCount, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, userId]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpenChatFromNotification = (chatId = null) => {
    setSelectedChatId(chatId);
    setIsOpen(true);
  };

  // No mostrar si no está logueado
  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      {/* Burbuja flotante del chat */}
      <div className="mobile-chat-bubble" onClick={handleToggle}>
        <FaComments className="chat-bubble-icon" />
        {unreadCount > 0 && (
          <span className="chat-bubble-badge">{unreadCount}</span>
        )}
      </div>

      {/* Panel de chat cuando está abierto */}
      {isOpen && (
        <div className="mobile-chat-overlay">
          <div className="mobile-chat-panel">
            <div className="mobile-chat-header">
              <h3>Chats</h3>
              <button className="mobile-chat-close" onClick={handleClose}>
                <FaTimes />
              </button>
            </div>
            <div className="mobile-chat-content">
              <ChatPanel
                userId={userId}
                isOpen={true}
                onClose={handleClose}
                onToggle={handleToggle}
                selectedChatId={selectedChatId}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileChatBubble;
