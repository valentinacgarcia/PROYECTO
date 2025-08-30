import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaTimes, FaPaperPlane, FaPaperclip, FaCamera, FaPaw} from 'react-icons/fa';
import './ChatPanel.css';

const ChatPanel = ({ userId, onClose }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messagesByChat, setMessagesByChat] = useState({});
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showAdoptionModal, setShowAdoptionModal] = useState(false);


  const seenChats = useRef(new Set());
  const seenMessages = useRef(new Set());
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const loggedUser = JSON.parse(localStorage.getItem('user'));
  const loggedUserId = loggedUser?.id;

  const fetchChats = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/chats/user/${userId}`);
      const newChats = response.data.filter(chat => !seenChats.current.has(chat.id));
      newChats.forEach(chat => seenChats.current.add(chat.id));
      if (newChats.length > 0) {
        setChats(prevChats => {
          const existingIds = new Set(prevChats.map(c => c.id));
          const filtered = newChats.filter(c => !existingIds.has(c.id));
          return [...filtered, ...prevChats];
        });
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchMessages = async (chatId) => {
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

      const newMessages = backendMessages.filter(msg => !seenMessages.current.has(msg.id));
      newMessages.forEach(msg => seenMessages.current.add(msg.id));

      setMessagesByChat(prev => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), ...newMessages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchChats();
    const chatInterval = setInterval(fetchChats, 3000);
    return () => clearInterval(chatInterval);
  }, [userId]);

  useEffect(() => {
    if (!selectedChat) return;
    fetchMessages(selectedChat.id);
    const messageInterval = setInterval(() => fetchMessages(selectedChat.id), 2000);
    return () => clearInterval(messageInterval);
  }, [selectedChat]);

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

        setMessagesByChat(prev => ({
          ...prev,
          [selectedChat.id]: [...(prev[selectedChat.id] || []), newMsg]
        }));

        seenMessages.current.add(newMsg.id);
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
    seenMessages.current.clear();
  };

  const backToChats = () => {
    setSelectedChat(null);
    seenMessages.current.clear();
  };

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
            {chats.map(chat => (
              <div key={chat.id} className="chat-item" onClick={() => selectChat(chat)}>
                <div className="chat-info">
                  <strong>{chat.name || `Chat con ${chat.petName} 🐾`}</strong>
                  <small>{chat.lastMessage || 'Sin mensajes'}</small>
                </div>
                <div className="chat-time">{chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString() : ''}</div>
              </div>
            ))}
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

      {/* Preview de imagen */}
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

      {/* Interfaz de cámara */}
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
