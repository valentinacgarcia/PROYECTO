import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaTimes, FaPaperPlane, FaPaperclip, FaCamera, FaPaw, FaComments, FaTruck } from 'react-icons/fa';
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
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [adoptionStatus, setAdoptionStatus] = useState(null);
  const [adoptionLoading, setAdoptionLoading] = useState(false);
  const [receptionLoading, setReceptionLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatsWithNewMessages, setChatsWithNewMessages] = useState(new Set());
  
  // Nuevo estado para las fotos de mascotas
  const [petPhotos, setPetPhotos] = useState({});

  // Estado para el modal
  const [messageModal, setMessageModal] = useState({ show: false, text: '' });

  // Nuevos estados para manejar la información de usuarios del chat
  const [chatUsers, setChatUsers] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isInterestedUser, setIsInterestedUser] = useState(false);
  const [loadingChatUsers, setLoadingChatUsers] = useState(false);
  
  // Estados para polling
  const [lastStatusUpdate, setLastStatusUpdate] = useState(null);
  const statusPollingRef = useRef(null);

  const lastReadMessages = useRef(new Map());
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const loggedUser = JSON.parse(localStorage.getItem('user'));
  const loggedUserId = loggedUser?.id;

  // Tiempo relativo
  const timeAgo = (dateString) => {
  if (!dateString) return '';
  const dateUtc = new Date(dateString);
  const dateArg = new Date(dateUtc.getTime() - 3 * 60 * 60 * 1000);
  const now = new Date();
  const diff = Math.floor((now - dateArg) / 1000);
  if (diff < 0) return 'justo ahora'; 
  if (diff < 60) return `${diff} seg`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} d`;
  return `${Math.floor(diff / 604800)} sem`;
  };

  //Transformación de hora UTC a hora ARG
  const formatTimeARG = (dateString) => {
  if (!dateString) return '';
  const dateUtc = new Date(dateString); 
  const dateArg = new Date(dateUtc.getTime() - 3 * 60 * 60 * 1000);
  return dateArg.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
// Función para obtener la primera foto de una mascota
  const fetchPetPhoto = async (petId) => {
    try {
      const response = await axios.get(`http://localhost:8000/pet/detail/${petId}`);
      return response.data.photos?.[0] || null;
    } catch (error) {
      console.error('Error fetching pet photo:', error);
      return null;
    }
  };

  // Función para cargar las fotos de todas las mascotas de los chats
  const loadPetPhotos = async (chatList) => {
    const photoPromises = chatList.map(async (chat) => {
      if (chat.petId && !petPhotos[chat.petId]) {
        const photo = await fetchPetPhoto(chat.petId);
        return { petId: chat.petId, photo };
      }
      return null;
    });

    const results = await Promise.all(photoPromises);
    
    const newPhotos = {};
    results.forEach(result => {
      if (result && result.photo) {
        newPhotos[result.petId] = result.photo;
      }
    });

    if (Object.keys(newPhotos).length > 0) {
      setPetPhotos(prev => ({ ...prev, ...newPhotos }));
    }
  };

  // Funciones del modal
  const showMessageModal = (text) => {
    setMessageModal({ show: true, text });
  };

  const closeMessageModal = () => {
    setMessageModal({ show: false, text: '' });
  };
  
  // Función optimizada para obtener estado completo del chat (usuarios + adopción)
  const fetchChatStatus = async (chatId, isInitialLoad = false) => {
    if (!chatId) return;
    
    if (isInitialLoad) {
      setLoadingChatUsers(true);
    }
    
    try {
      // Usar los endpoints que ya tienes
      const [usersResponse, adoptionResponse] = await Promise.all([
        axios.post(`http://localhost:8000/chats/${chatId}/users`),
        axios.get(`http://localhost:8000/adoption/status/${chatId}`).catch(() => ({ data: null }))
      ]);
      
      const { owner_id, interested_id } = usersResponse.data;
      const adoption_status = adoptionResponse.data;
      const last_updated = Date.now();
      
      // Solo actualizar si hay cambios reales
      if (isInitialLoad || !chatUsers || 
          chatUsers.owner_id !== owner_id || 
          chatUsers.interested_id !== interested_id ||
          JSON.stringify(adoptionStatus) !== JSON.stringify(adoption_status)) {
        
        setChatUsers({ owner_id, interested_id });
        setAdoptionStatus(adoption_status);
        setLastStatusUpdate(last_updated);
        
        // Verificar si el usuario loggeado es owner o interested
        const userIsOwner = loggedUserId === owner_id;
        const userIsInterested = loggedUserId === interested_id;
        
        setIsOwner(userIsOwner);
        setIsInterestedUser(userIsInterested);
        
        console.log('Chat Status Updated:', {
          chatId,
          loggedUserId,
          owner_id,
          interested_id,
          userIsOwner,
          userIsInterested,
          adoption_status
        });
      }
      
    } catch (error) {
      console.error('Error fetching chat status:', error);
      if (isInitialLoad) {
        setChatUsers(null);
        setIsOwner(false);
        setIsInterestedUser(false);
        setAdoptionStatus(null);
      }
    } finally {
      if (isInitialLoad) {
        setLoadingChatUsers(false);
      }
    }
  };

  // Función para iniciar polling del estado del chat
  const startStatusPolling = (chatId) => {
    // Limpiar polling anterior si existe
    stopStatusPolling();
    
    // Hacer polling cada 3 segundos (más frecuente para mejor UX)
    statusPollingRef.current = setInterval(() => {
      fetchChatStatus(chatId, false);
    }, 3000);
  };

  // Función para detener polling
  const stopStatusPolling = () => {
    if (statusPollingRef.current) {
      clearInterval(statusPollingRef.current);
      statusPollingRef.current = null;
    }
  };

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

  // Cargar el estado de la adopción cuando se selecciona un chat
  const fetchAdoptionStatus = async (chatId) => {
    try {
      const response = await axios.get(`http://localhost:8000/adoption/status/${chatId}`);
      setAdoptionStatus(response.data);
    } catch (error) {
      console.error('Error fetching adoption status:', error);
      setAdoptionStatus(null);
    }
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

  const markMessagesAsRead = (chatId, messages) => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      lastReadMessages.current.set(chatId.toString(), lastMessage.id);
      saveLastReadMessages();
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
  
  // Efecto para cargar las fotos cuando cambian los chats
  useEffect(() => {
    if (chats.length > 0) {
      loadPetPhotos(chats);
    }
  }, [chats]);
  
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
  
  useEffect(() => {
    if (chats.length > 0 && Object.keys(messagesByChat).length > 0) {
      checkForUnreadMessages(chats, messagesByChat);
    }
  }, [chats, messagesByChat, loggedUserId]);

  useEffect(() => {
    if (isOpen && selectedChat && messagesByChat[selectedChat.id]) {
      const messages = messagesByChat[selectedChat.id];
      markMessagesAsRead(selectedChat.id, messages);
    }
  }, [selectedChat, isOpen]);

  useEffect(() => {
    if (isOpen && selectedChat && messagesByChat[selectedChat.id]) {
      const messages = messagesByChat[selectedChat.id];
      markMessagesAsRead(selectedChat.id, messages);
    }
  }, [selectedChat, messagesByChat, isOpen]);

  // Efecto para cargar usuarios del chat y estado de adopción cuando se selecciona un chat
  useEffect(() => {
    if (selectedChat && loggedUserId) {
      // Carga inicial
      fetchChatStatus(selectedChat.id, true);
      
      // Iniciar polling si el panel está abierto
      if (isOpen) {
        startStatusPolling(selectedChat.id);
      }
    } else {
      // Limpiar estados cuando no hay chat seleccionado
      stopStatusPolling();
      setChatUsers(null);
      setIsOwner(false);
      setIsInterestedUser(false);
      setAdoptionStatus(null);
      setLastStatusUpdate(null);
    }

    // Cleanup al desmontar
    return () => {
      stopStatusPolling();
    };
  }, [selectedChat, loggedUserId, isOpen]);

  // Efecto para manejar el polling cuando cambia la visibilidad del panel
  useEffect(() => {
    if (selectedChat) {
      if (isOpen) {
        // Si el panel se abre, iniciar polling
        startStatusPolling(selectedChat.id);
      } else {
        // Si el panel se cierra, detener polling
        stopStatusPolling();
      }
    }
  }, [isOpen, selectedChat]);
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAdoptionClick = () => {
    setShowAdoptionModal(true);
  };

  const handleReceptionClick = () => {
    setShowReceptionModal(true);
  };

  const handleAdoptionDecision = async (decision) => {
    if (!decision) {
      setShowAdoptionModal(false);
      return;
    }

    setAdoptionLoading(true);
    
    try {
      if (isOwner && !adoptionStatus?.exists) {
        // Owner inicia el proceso
        const response = await axios.post('http://localhost:8000/adoption/initiate', {
          chat_id: selectedChat.id,
          owner_id: chatUsers.owner_id
        });
        
        if (response.data.success) {
          await fetchChatStatus(selectedChat.id, false);
          showMessageModal('Proceso de adopción iniciado. El usuario interesado recibirá una notificación.');
        }

      } else if (isInterestedUser && adoptionStatus?.canUserConfirm) {
        const response = await axios.post(`http://localhost:8000/adoption/confirm/${adoptionStatus.adoption_id}`,{
          interested_id: chatUsers.interested_id
        });
        
        if (response.data.success) {
          await fetchChatStatus(selectedChat.id, false);
          showMessageModal('¡Felicitaciones! La adopción ha sido confirmada exitosamente.');
        }
      }
    } catch (error) {
      console.error('Error processing adoption:', error);
      const errorMessage = error.response?.data?.error || 'Error procesando la adopción';
      showMessageModal(`Error: ${errorMessage}`);
    } finally {
      setAdoptionLoading(false);
      setShowAdoptionModal(false);
    }
  };

  const handleReceptionDecision = async (decision) => {
    if (!decision) {
      setShowReceptionModal(false);
      return;
    }

    setReceptionLoading(true);
    
    try {
      const response = await axios.post(`http://localhost:8000/adoption/confirm/reception/${adoptionStatus.adoption_id}`, {
        interested_id: chatUsers.interested_id
      });
      
      if (response.data.success) {
        await fetchChatStatus(selectedChat.id, false);
        showMessageModal('¡Felicitaciones! Has confirmado la recepción de tu nueva mascota.');
      }
    } catch (error) {
      console.error('Error confirming reception:', error);
      const errorMessage = error.response?.data?.error || 'Error confirmando la recepción';
      showMessageModal(`Error: ${errorMessage}`);
    } finally {
      setReceptionLoading(false);
      setShowReceptionModal(false);
    }
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
    
    if (isOpen) {
      const messages = messagesByChat[chat.id] || [];
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        lastReadMessages.current.set(chat.id.toString(), lastMessage.id);
        saveLastReadMessages();
        
        setTimeout(() => {
          checkForUnreadMessages(chats, messagesByChat);
        }, 0);
      }
    }
  };

  const backToChats = () => {
    stopStatusPolling(); // Detener polling
    setSelectedChat(null);
    setAdoptionStatus(null);
    setChatUsers(null);
    setIsOwner(false);
    setIsInterestedUser(false);
    setLastStatusUpdate(null);
  };

  // Determinar si mostrar el botón y su texto/estado
  const getAdoptionButtonInfo = () => {
    // Si no hay chat seleccionado o está cargando usuarios, no mostrar
    if (!selectedChat || loadingChatUsers || !chatUsers) {
      return { show: false };
    }

    console.log('getAdoptionButtonInfo debug:', { 
      isOwner, 
      isInterestedUser, 
      adoptionStatus,
      chatUsers,
      loggedUserId
    });
    
    // Para el owner: mostrar el botón (excepto si ya está completada)
    if (isOwner) {
      if (!adoptionStatus) {
        // Mientras carga el estado, mostrar botón habilitado
        return {
          show: true,
          text: 'Concretar Adopción',
          enabled: true,
          variant: 'primary'
        };
      }
      
      if (!adoptionStatus.exists) {
        return {
          show: true,
          text: 'Concretar Adopción',
          enabled: true,
          variant: 'primary'
        };
      } else if (adoptionStatus.state === 'pending') {
        return {
          show: true,
          text: 'Esperando Confirmación',
          enabled: false,
          variant: 'waiting'
        };
      } else if (adoptionStatus.state === 'waiting') {
        return {
          show: true,
          text: 'Esperando Recepción',
          enabled: false,
          variant: 'waiting'
        };
      } else if (adoptionStatus.state === 'completed') {
        return {
          show: true,
          text: '¡Adopción Completada!',
          enabled: false,
          variant: 'completed'
        };
      }
    } 
    // Para el usuario interesado: solo mostrar si hay adopción pending o completada
    else if (isInterestedUser) {
      if (!adoptionStatus || !adoptionStatus.exists) {
        return { show: false };
      }
      
      if (adoptionStatus.state === 'pending') {
        return {
          show: true,
          text: 'Confirmar Adopción',
          enabled: true,
          variant: 'confirm'
        };
      } else if (adoptionStatus.state === 'waiting') {
        return {
          show: true,
          text: 'Esperando mi confirmación',
          enabled: false,
          variant: 'waiting'
        };
      } else if (adoptionStatus.state === 'completed') {
        return {
          show: true,
          text: '¡Adopción Completada!',
          enabled: false,
          variant: 'completed'
        };
      }
    }

    return { show: false };
  };

  // Determinar si mostrar el botón de recepción
  const getReceptionButtonInfo = () => {
    if (!selectedChat || loadingChatUsers || !chatUsers || !adoptionStatus) {
      return { show: false };
    }

    // Solo mostrar para el usuario interesado cuando la adopción está en estado "waiting"
    if (isInterestedUser && adoptionStatus.exists && adoptionStatus.state === 'waiting') {
      return {
        show: true,
        text: 'Recibí mi Mascota',
        enabled: true,
        variant: 'reception'
      };
    }

    return { show: false };
  };

  const adoptionButtonInfo = getAdoptionButtonInfo();
  const receptionButtonInfo = getReceptionButtonInfo();

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

  if (!isOpen) {
    return <ChatIcon />;
  }

  if (!selectedChat) {
  // Ordenamiento de chats por último mensaje
  const sortedChats = [...chats].sort((a, b) => {
    const lastMsgA = messagesByChat[a.id]?.slice(-1)[0];
    const lastMsgB = messagesByChat[b.id]?.slice(-1)[0];

    const timeA = lastMsgA ? new Date(lastMsgA.createdAt).getTime() : 0;
    const timeB = lastMsgB ? new Date(lastMsgB.createdAt).getTime() : 0;

    return timeB - timeA; 
  });

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
          {sortedChats.map(chat => {
            const hasNewMessages = chatsWithNewMessages.has(chat.id);
            const lastMessage = messagesByChat[chat.id]?.slice(-1)[0] || {};
            return (
              <div 
                key={chat.id} 
                className={`chat-item ${hasNewMessages ? 'chat-item-unread' : ''}`}
                onClick={() => selectChat(chat)}
              >
                {/* Avatar con foto de mascota */}
                <div className="chat-avatar-container">
                  {petPhotos[chat.petId] ? (
                    <img 
                      src={petPhotos[chat.petId]} 
                      alt="Mascota" 
                      className="chat-avatar"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <div 
                    className="chat-avatar-placeholder" 
                    style={{display: petPhotos[chat.petId] ? 'none' : 'block'}}
                  />
                </div>
                
                <div className="chat-info">
                  <strong>{chat.name || `Chat con ${chat.otherUserName}`}</strong>
                  <small>{lastMessage.content || 'Sin mensajes'}</small>
                </div>
                <div className="chat-meta">
                  <div className="chat-time">
                    <div className="chat-time">
                      {timeAgo(lastMessage.createdAt)}
                    </div>
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
          {loadingChatUsers && <span style={{ fontSize: '12px', marginLeft: '8px' }}>(Cargando...)</span>}
        </h4>
        <FaTimes onClick={onClose} className="close-button" aria-label="Cerrar chat" />
      </div>

      <div className="chat-messages-container">
        <div className="messages-list">
          {currentMessages.length === 0 ? (
            <div className="no-messages">No hay mensajes aún</div>
          ) : (
            currentMessages.map((message, index) => {
              const isMine = message.senderId === loggedUserId;

              // Formatear la fecha del mensaje
              const messageDate = new Date(message.createdAt);
              const parts = messageDate.toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              }).split(' ');
              const messageDateStr = parts.filter(p => p !== 'de').join(' ');

              // Comparar con el mensaje anterior para mostrar separador de fecha
              const prevMessage = currentMessages[index - 1];
              const prevMessageDate = prevMessage ? new Date(prevMessage.createdAt) : null;
              const shouldShowDate = !prevMessageDate || messageDate.toDateString() !== prevMessageDate.toDateString();

              return (
                <React.Fragment key={message.id}>
                  {shouldShowDate && (
                    <div className="chat-date-divider">{messageDateStr}</div>
                  )}

                  <div className={`message ${isMine ? 'own-message' : 'other-message'}`}>
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
                      {formatTimeARG(message.createdAt)}
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* Botón de recepción - Se muestra arriba del input cuando corresponde */}
        {receptionButtonInfo.show && (
          <div className="reception-button-container">
            <button
              onClick={handleReceptionClick}
              disabled={!receptionButtonInfo.enabled || receptionLoading}
              className="reception-button"
              title={receptionButtonInfo.text}
            >
              <FaTruck />
              <span>{receptionButtonInfo.text}</span>
            </button>
          </div>
        )}

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

          {adoptionButtonInfo.show && (
            <button 
              onClick={adoptionButtonInfo.enabled ? handleAdoptionClick : undefined}
              disabled={!adoptionButtonInfo.enabled || adoptionLoading}
              className={`adoption-button adoption-button-${adoptionButtonInfo.variant}`}
              title={adoptionButtonInfo.text}
            >
              <FaPaw />
            </button>
          )}

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

        {/* Modal de mensajes genérico */}
        {messageModal.show && (
          <div className="adoption-modal-container">
            <div className="adoption-modal">
              <h4>Mensaje</h4>
              <p>{messageModal.text}</p>
              <div className="adoption-buttons">
                <button onClick={closeMessageModal} className="yes-button">Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {showAdoptionModal && (
          <div className="adoption-modal-container">
            <div className="adoption-modal">
              <h4>
                {isOwner ? '¿Estás seguro de querer concretar la adopción?' : '¿Quieres confirmar la adopción de esta mascota?'}
              </h4>
              <p>
                {isOwner 
                  ? 'Se notificará al usuario interesado y deberá confirmar para completar el proceso.'
                  : 'Al confirmar, la adopción quedará finalizada y serás el nuevo dueño de la mascota.'
                }
              </p>
              <div className="adoption-buttons">
                <button 
                  onClick={() => handleAdoptionDecision(true)} 
                  className="yes-button"
                  disabled={adoptionLoading}
                >
                  {adoptionLoading ? 'Procesando...' : 'Sí'}
                </button>
                <button 
                  onClick={() => handleAdoptionDecision(false)} 
                  className="no-button"
                  disabled={adoptionLoading}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        )}

        {showReceptionModal && (
          <div className="adoption-modal-container">
            <div className="adoption-modal">
              <h4>¿Estás seguro de que recibiste tu mascota?</h4>
              <p>
                Al confirmar la recepción, completarás oficialmente la adopción y 
                la mascota quedará registrada como tuya.
              </p>
              <div className="adoption-buttons">
                <button 
                  onClick={() => handleReceptionDecision(true)} 
                  className="yes-button"
                  disabled={receptionLoading}
                >
                  {receptionLoading ? 'Procesando...' : 'Sí, la recibí'}
                </button>
                <button 
                  onClick={() => handleReceptionDecision(false)} 
                  className="no-button"
                  disabled={receptionLoading}
                >
                  Cancelar
                </button>
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