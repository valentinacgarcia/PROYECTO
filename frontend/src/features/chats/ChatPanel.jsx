import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaTimes, FaPaperPlane, FaPaperclip, FaCamera, FaPaw, FaComments } from 'react-icons/fa';
import './ChatPanel.css';

const ChatPanel = ({ userId, onClose, isOpen, onToggle }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messagesByChat, setMessagesByChat] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatsWithNewMessages, setChatsWithNewMessages] = useState(new Set());

  const lastReadMessages = useRef(new Map());
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const loggedUser = JSON.parse(localStorage.getItem('user'));
  const loggedUserId = loggedUser?.id;

  const loadLastReadMessages = () => {
    const stored = localStorage.getItem(`lastReadMessages_${userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        lastReadMessages.current = new Map(Object.entries(parsed));
      } catch (err) {
        console.error('Error loading last read messages:', err);
        lastReadMessages.current = new Map();
      }
    }
  };

  const saveLastReadMessages = () => {
    try {
      const obj = Object.fromEntries(lastReadMessages.current);
      localStorage.setItem(`lastReadMessages_${userId}`, JSON.stringify(obj));
    } catch (err) {
      console.error('Error saving last read messages:', err);
    }
  };

  const checkForUnreadMessages = (allChats, allMessages) => {
    if (!allChats || allChats.length === 0 || !loggedUserId) return;
    
    let totalUnread = 0;
    const newChatsWithNew = new Set();
    
    allChats.forEach(chat => {
      const lastReadId = lastReadMessages.current.get(chat.id.toString());
      const messages = allMessages[chat.id] || [];
      
      const unreadInChat = messages.filter(msg => 
        msg.senderId !== loggedUserId && 
        (!lastReadId || msg.id > lastReadId)
      ).length;
      
      if (unreadInChat > 0) {
        totalUnread += unreadInChat;
        newChatsWithNew.add(chat.id);
      }
    });
    
    // Solo actualizar si realmente cambió algo
    setUnreadCount(prevCount => {
      if (prevCount !== totalUnread) {
        return totalUnread;
      }
      return prevCount;
    });
    
    setChatsWithNewMessages(prevChats => {
      const prevSet = Array.from(prevChats).sort();
      const newSet = Array.from(newChatsWithNew).sort();
      
      if (JSON.stringify(prevSet) !== JSON.stringify(newSet)) {
        return newChatsWithNew;
      }
      return prevChats;
    });
  };

  const fetchChats = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/chats/user/${userId}`);
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchMessagesForChat = async (chatId) => {
    try {
      const response = await axios.get(`http://localhost:8000/chats/${chatId}/messages`);
      const backendMessages = response.data.map(msg => ({
        id: msg.messageId,
        chatId,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msg.createdAt,
        fileUrl: msg.fileUrl
      }));
      
      setMessagesByChat(prev => {
        const updated = {
          ...prev,
          [chatId]: backendMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        };
        return updated;
      });
      
    } catch (error) {
      console.error(`Error fetching messages for chat ${chatId}:`, error);
    }
  };

  // Función para marcar mensajes como leídos y actualizar contador inmediatamente
  const markMessagesAsRead = (chatId, messages) => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      lastReadMessages.current.set(chatId.toString(), lastMessage.id);
      saveLastReadMessages();
      
      // Actualizar el contador inmediatamente después de marcar como leído
      checkForUnreadMessages(chats, messagesByChat);
    }
  };

  useEffect(() => {
    loadLastReadMessages();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchChats();
    const chatInterval = setInterval(fetchChats, 5000);
    return () => clearInterval(chatInterval);
  }, [userId]);
  
  useEffect(() => {
    if (chats.length > 0) {
      const messageIntervals = chats.map(chat => {
        fetchMessagesForChat(chat.id);
        return setInterval(() => fetchMessagesForChat(chat.id), 3000);
      });

      return () => {
        messageIntervals.forEach(interval => clearInterval(interval));
      };
    }
  }, [chats]);
  
  // Efecto principal para actualizar el contador de no leídos - SIEMPRE SE EJECUTA
  useEffect(() => {
    if (chats.length > 0 && Object.keys(messagesByChat).length > 0) {
      checkForUnreadMessages(chats, messagesByChat);
    }
  }, [chats, messagesByChat, loggedUserId]);

  // Efecto para manejar la selección de chat - SOLO cuando el panel está abierto
  useEffect(() => {
    if (isOpen && selectedChat && messagesByChat[selectedChat.id]) {
      const messages = messagesByChat[selectedChat.id];
      markMessagesAsRead(selectedChat.id, messages);
    }
  }, [selectedChat, isOpen]);

  // Efecto adicional para actualizar cuando los mensajes del chat seleccionado cambian - SOLO cuando el panel está abierto
  useEffect(() => {
    if (isOpen && selectedChat && messagesByChat[selectedChat.id]) {
      const messages = messagesByChat[selectedChat.id];
      markMessagesAsRead(selectedChat.id, messages);
    }
  }, [selectedChat, messagesByChat, isOpen]);
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAdoptionClick = () => {
    setShowAdoptionModal(true);
  };

  const handleAdoptionDecision = (decision) => {
    console.log('Decisión adopción:', decision);
    setShowAdoptionModal(false);
  };

  const handleCameraClick = async () => {
    const cameraInput = document.getElementById('cameraInput');
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      cameraInput.click();
    } else {
      try {
        setShowCamera(true);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        console.error('Error accessing camera:', error);
        setShowCamera(false);
        document.getElementById('fileInput').click();
      }
    }
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      canvas.toBlob(blob => {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        closeCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  const closeCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedChat || loading) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('senderId', userId);
      if (newMessage.trim()) formData.append('content', newMessage.trim());
      if (selectedFile) formData.append('file', selectedFile);

      const response = await axios.post(
        `http://localhost:8000/chats/${selectedChat.id}/message/send`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data?.messageId) {
        const newMsg = {
          id: response.data.messageId,
          chatId: selectedChat.id,
          senderId: userId,
          content: newMessage.trim() || (selectedFile ? "[📷 Imagen]" : ""),
          createdAt: response.data.createdAt,
          fileUrl: response.data.image || null
        };
        
        setMessagesByChat(prev => {
          const updatedMessages = [...(prev[selectedChat.id] || []), newMsg].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          return {
            ...prev,
            [selectedChat.id]: updatedMessages
          };
        });
        
        // Marcar este mensaje como leído inmediatamente ya que lo enviamos nosotros
        lastReadMessages.current.set(selectedChat.id.toString(), newMsg.id);
        saveLastReadMessages();
        
        setNewMessage('');
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error sending message:', error.response || error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectChat = (chat) => {
    setSelectedChat(chat);
    
    // Solo marcar como leído si el panel está abierto (usuario está interactuando)
    if (isOpen) {
      const messages = messagesByChat[chat.id] || [];
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        lastReadMessages.current.set(chat.id.toString(), lastMessage.id);
        saveLastReadMessages();
        
        // Forzar recálculo inmediato del contador
        setTimeout(() => {
          checkForUnreadMessages(chats, messagesByChat);
        }, 0);
      }
    }
  };

  const backToChats = () => {
    setSelectedChat(null);
  };

  const ChatIcon = () => (
    <div 
      className="chat-icon-wrapper" 
      style={{ 
        position: 'relative', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: '8px',
        minWidth: '40px',
        minHeight: '40px'
      }}
      onClick={onToggle}
    >
      <FaComments className="chat-icon" style={{ fontSize: '20px' }} />
      {unreadCount > 0 && (
        <span className="chat-notification-badge" style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          backgroundColor: '#ff4444',
          color: 'white',
          borderRadius: '50%',
          minWidth: '18px',
          height: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 'bold',
          zIndex: 1
        }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  );

  // Siempre mostrar el ícono cuando no está abierto
  if (!isOpen) {
    return <ChatIcon />;
  }

  if (!selectedChat) {
    return (
      <div className="chat-panel chat-list-panel">
        <div className="chat-header">
          <h4>Mis Chats</h4>
          <FaTimes onClick={onClose} className="close-button" aria-label="Cerrar chat" />
        </div>
        {chats.length === 0 ? (
          <p className="no-chats">Cargando chats...</p>
        ) : (
          <div className="chat-list">
            {chats.map(chat => {
              const hasNewMessages = chatsWithNewMessages.has(chat.id);
              const lastMessage = messagesByChat[chat.id]?.slice(-1)[0] || {};
              return (
                <div 
                  key={chat.id} 
                  className={`chat-item ${hasNewMessages ? 'chat-item-unread' : ''}`}
                  onClick={() => selectChat(chat)}
                >
                  <div className="chat-info">
                    <strong>{chat.name || `Chat con ${chat.petName} 🐾`}</strong>
                    <small>{lastMessage.content || 'Sin mensajes'}</small>
                  </div>
                  <div className="chat-meta">
                    <div className="chat-time">
                      {lastMessage.createdAt ? new Date(lastMessage.createdAt).toLocaleTimeString() : ''}
                    </div>
                    {hasNewMessages && <div className="chat-unread-indicator"></div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const currentMessages = messagesByChat[selectedChat.id] || [];

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h4>
          <button onClick={backToChats} className="back-button" aria-label="Volver a chats">←</button>
          {selectedChat.name || 'Chat'}
        </h4>
        <FaTimes onClick={onClose} className="close-button" aria-label="Cerrar chat" />
      </div>

      <div className="chat-messages-container">
        <div className="messages-list">
          {currentMessages.length === 0 ? (
            <div className="no-messages">No hay mensajes aún</div>
          ) : (
            currentMessages.map(message => {
              const isMine = message.senderId === loggedUserId;
              return (
                <div key={message.id} className={`message ${isMine ? 'own-message' : 'other-message'}`}>
                  <div className="message-content">
                    {message.fileUrl && (
                      <img
                        src={message.fileUrl}
                        alt="Adjunto"
                        className="message-image"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    {message.content && <div>{message.content}</div>}
                  </div>
                  <div className="message-time">
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="message-input-container">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Escribe un mensaje a ${selectedChat.name || 'tu contacto'}...`}
            rows="2"
            disabled={loading}
            className="message-input"
          />

          <input type="file" accept="image/*" style={{ display: 'none' }} id="fileInput" onChange={handleFileChange} />
          <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} id="cameraInput" onChange={handleFileChange} />

          <button onClick={handleAdoptionClick} className="adoption-button">
            <FaPaw />
          </button>

          <button onClick={() => document.getElementById('fileInput').click()} className="attach-button" aria-label="Adjuntar archivo"><FaPaperclip /></button>

          <button onClick={handleCameraClick} className="camera-button" aria-label="Abrir cámara"><FaCamera /></button>
          <button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || loading}
            className="send-button"
            aria-label="Enviar mensaje"
          >
            <FaPaperPlane />
          </button>
        </div>
        {showAdoptionModal && (
        <div className="adoption-modal-container">
          <div className="adoption-modal">
            <h4>¿Querés concretar la adopción?</h4>
            <div className="adoption-buttons">
              <button onClick={() => handleAdoptionDecision(true)} className="yes-button">Sí</button>
              <button onClick={() => handleAdoptionDecision(false)} className="no-button">No</button>
            </div>
          </div>
        </div>
        )}
      </div>

      {selectedFile && (
        <div className="file-preview">
          <img src={URL.createObjectURL(selectedFile)} alt="Preview" />
          <div className="file-info">
            <div>Imagen seleccionada</div>
            <div>{selectedFile.name}</div>
          </div>
          <button onClick={() => setSelectedFile(null)}>✕</button>
        </div>
      )}

      {showCamera && (
        <div className="camera-overlay">
          <div className="camera-header">
            <h4>Tomar foto</h4>
            <FaTimes onClick={closeCamera} className="close-button" aria-label="Cerrar cámara" />
          </div>
          <div className="camera-video">
            <video ref={videoRef} autoPlay playsInline muted />
          </div>
          <div className="camera-controls">
            <button onClick={capturePhoto} className="capture-button"><div /></button>
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
      )}
    </div>
  );
};

export default ChatPanel;