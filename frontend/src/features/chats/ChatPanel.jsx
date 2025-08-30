// ChatPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaTimes, FaPaperPlane, FaPaperclip, FaCamera } from 'react-icons/fa';

const ChatPanel = ({ userId, onClose }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const seenChats = useRef(new Set());
  const seenMessages = useRef(new Set());
  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const loggedUser = JSON.parse(localStorage.getItem('user'));
  const loggedUserId = loggedUser?.id;

  // Función para hacer scroll automático al final
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll automático cuando cambian los mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // ✅ Usando la ruta correcta del backend
      const response = await axios.get(`http://localhost:8000/chats/${chatId}/messages`);
      
      // ✅ Mapear correctamente los campos del backend
      const backendMessages = response.data.map(msg => ({
        id: msg.messageId,           // Backend devuelve messageId
        chatId: chatId,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msg.createdAt,
        fileUrl: msg.fileUrl         // Backend devuelve fileUrl
      }));

      const newMessages = backendMessages.filter(msg => !seenMessages.current.has(msg.id));
      newMessages.forEach(msg => seenMessages.current.add(msg.id));
      
      if (newMessages.length > 0) {
        setMessages(prevMessages => {
          const existingIds = new Set(prevMessages.map(m => m.id));
          const filtered = newMessages.filter(m => !existingIds.has(m.id));
          return [...prevMessages, ...filtered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
      } else if (messages.length === 0) {
        // Si no hay mensajes nuevos pero el array está vacío, cargar todos
        setMessages(backendMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
        backendMessages.forEach(msg => seenMessages.current.add(msg.id));
      }
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

  const handleCameraClick = async () => {
    // Primero intentar con input file con capture
    const cameraInput = document.getElementById('cameraInput');
    
    // En móviles, esto debería abrir la cámara
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      cameraInput.click();
    } else {
      // En escritorio, mostrar interfaz de cámara personalizada
      try {
        setShowCamera(true);
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment' // Cámara trasera en móviles
          } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        // Fallback a input file normal
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
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        closeCamera();
      }, 'image/jpeg', 0.8);
    }
  };

  const closeCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
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
        // ✅ Mapear correctamente la respuesta del backend
        const newMsg = {
          id: response.data.messageId,
          chatId: selectedChat.id,
          senderId: userId,
          content: newMessage.trim() || (selectedFile ? "[📷 Imagen]" : ""),
          createdAt: response.data.createdAt,
          fileUrl: response.data.image || null  // Backend devuelve 'image'
        };
        setMessages(prev => [...prev, newMsg]);
        seenMessages.current.add(newMsg.id);
        setNewMessage('');
        setSelectedFile(null);
        // Limpiar la URL del objeto para liberar memoria
        if (selectedFile) {
          URL.revokeObjectURL(URL.createObjectURL(selectedFile));
        }
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
    setMessages([]);
    seenMessages.current.clear();
  };

  const backToChats = () => {
    setSelectedChat(null);
    setMessages([]);
    seenMessages.current.clear();
  };

  if (!selectedChat) {
    return (
      <div className="dropdown-panel notifications-dropdown">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4>Mis Chats</h4>
          <FaTimes onClick={onClose} style={{ cursor: 'pointer', color: '#666' }} />
        </div>
        {chats.length === 0 ? (
          <p>Cargando chats...</p>
        ) : (
          chats.map(chat => (
            <div
              key={chat.id}
              className="notification-item"
              onClick={() => selectChat(chat)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', marginBottom: '8px', border: '1px solid #f0f0f0' }}
            >
              <div>
                <strong>{chat.name || `Chat con ${chat.petName} 🐾`}</strong>
                <br />
                <small style={{ color: '#666' }}>{chat.lastMessage || 'Sin mensajes'}</small>
              </div>
              <small style={{ color: '#999', fontSize: '11px' }}>
                {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString() : ''}
              </small>
            </div>
          ))
        )}
      </div>
    );
  } else {
    return (
      <div className="chat-panel" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'white', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
        <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={backToChats} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#007bff' }}>←</button>
            {selectedChat.name || 'Chat'}
          </h4>
          <FaTimes onClick={onClose} style={{ cursor: 'pointer', color: '#666', fontSize: '16px' }} />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 70px)' }}>
          {/* Mensajes - Área con scroll independiente */}
          <div style={{ 
            flex: 1, 
            padding: '15px', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            minHeight: 0 // Importante para que funcione el scroll
          }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                <p>No hay mensajes aún</p>
              </div>
            ) : (
              <>
                {messages.map(message => {
                  const isMine = message.senderId === loggedUserId;
                  return (
                    <div key={message.id} style={{ maxWidth: '80%', alignSelf: isMine ? 'flex-start' : 'flex-end', marginBottom: '8px' }}>
                      <div style={{ padding: '10px 15px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMine ? '#f1f1f1' : '#53a57d', color: isMine ? '#333' : 'white', fontSize: '14px', wordWrap: 'break-word' }}>
                        {/* ✅ Mostrar imagen si existe fileUrl */}
                        {message.fileUrl ? (
                          <div>
                            <img 
                              src={message.fileUrl} 
                              alt="imagen adjunta" 
                              style={{ 
                                maxWidth: '200px', 
                                borderRadius: '10px',
                                display: 'block',
                                marginBottom: message.content ? '8px' : '0'
                              }} 
                              onError={(e) => {
                                console.error('Error loading image:', message.fileUrl);
                                e.target.style.display = 'none';
                              }}
                            />
                            {/* Mostrar texto si existe además de la imagen */}
                            {message.content && message.content !== "[📷 Imagen]" && (
                              <div>{message.content}</div>
                            )}
                          </div>
                        ) : (
                          message.content
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#666', marginTop: '2px', textAlign: 'center' }}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  )
                })}
                {/* Elemento invisible para hacer scroll al final */}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input y botones - Posición fija en la parte inferior */}
          <div style={{ 
            flexShrink: 0, // No se encoge
            display: 'flex', 
            padding: '15px', 
            borderTop: '1px solid #eee', 
            gap: '10px', 
            alignItems: 'flex-end',
            background: 'white'
          }}>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              rows="2"
              disabled={loading}
              style={{ 
                flex: 1, 
                border: '1px solid #ddd', 
                borderRadius: '20px', 
                padding: '8px 15px', 
                resize: 'none', 
                fontFamily: 'inherit', 
                fontSize: '14px', 
                outline: 'none',
                maxHeight: '80px',
                minHeight: '40px'
              }}
            />

            {/* Inputs ocultos */}
            <input 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              id="fileInput" 
              onChange={handleFileChange} 
            />
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              style={{ display: 'none' }} 
              id="cameraInput" 
              onChange={handleFileChange} 
            />

            {/* Botón adjuntar */}
            <button
              onClick={() => document.getElementById('fileInput').click()}
              style={{ background: '#f1f1f1', border: 'none', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <FaPaperclip />
            </button>

            {/* Botón cámara */}
            <button
              onClick={handleCameraClick}
              style={{ background: '#f1f1f1', border: 'none', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <FaCamera />
            </button>

            {/* Botón enviar */}
            <button
              onClick={sendMessage}
              disabled={(!newMessage.trim() && !selectedFile) || loading}
              style={{ background: (!newMessage.trim() && !selectedFile) || loading ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (!newMessage.trim() && !selectedFile) || loading ? 'not-allowed' : 'pointer' }}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>

        {/* Interfaz de cámara personalizada */}
        {showCamera && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'black',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header con botón cerrar */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '15px', 
              color: 'white',
              background: 'rgba(0,0,0,0.8)',
              zIndex: 10001
            }}>
              <h4 style={{ margin: 0 }}>Tomar foto</h4>
              <FaTimes onClick={closeCamera} style={{ cursor: 'pointer', fontSize: '20px' }} />
            </div>
            
            {/* Área del video - con altura calculada */}
            <div style={{ 
              flex: 1, 
              position: 'relative', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: 'calc(100vh - 140px)', // Resta header (70px) + controles (70px)
              overflow: 'hidden'
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
            
            {/* Controles de captura - fijos en la parte inferior */}
            <div style={{
              padding: '20px',
              display: 'flex',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.9)',
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 10001
            }}>
              <button
                onClick={capturePhoto}
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  border: '4px solid white',
                  background: 'transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'white'
                }} />
              </button>
            </div>
            
            {/* Canvas oculto para capturar la foto */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}

        {/* Preview del archivo seleccionado estilo WhatsApp */}
        {selectedFile && (
          <div style={{ 
            position: 'absolute', 
            bottom: '80px', 
            left: '15px', 
            right: '15px',
            background: 'rgba(0,0,0,0.9)', 
            borderRadius: '12px', 
            padding: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{ position: 'relative' }}>
              <img 
                src={URL.createObjectURL(selectedFile)} 
                alt="Preview" 
                style={{ 
                  width: '60px', 
                  height: '60px', 
                  objectFit: 'cover', 
                  borderRadius: '8px' 
                }} 
              />
            </div>
            <div style={{ flex: 1, color: 'white' }}>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>Imagen seleccionada</div>
              <div style={{ fontSize: '12px', color: '#ccc' }}>{selectedFile.name}</div>
            </div>
            <button 
              onClick={() => setSelectedFile(null)} 
              style={{ 
                background: 'rgba(255,255,255,0.2)', 
                border: 'none', 
                color: 'white', 
                cursor: 'pointer',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  }
};

export default ChatPanel;