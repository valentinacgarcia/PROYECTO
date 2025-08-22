// ChatPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';

const ChatPanel = ({ userId, onClose }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const seenChats = useRef(new Set());
  const seenMessages = useRef(new Set());

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
      const response = await axios.get(`http://localhost:8000/messages/chat/${chatId}`);
      const newMessages = response.data.filter(msg => !seenMessages.current.has(msg.id));
      newMessages.forEach(msg => seenMessages.current.add(msg.id));
      
      if (newMessages.length > 0) {
        setMessages(prevMessages => {
          const existingIds = new Set(prevMessages.map(m => m.id));
          const filtered = newMessages.filter(m => !existingIds.has(m.id));
          return [...prevMessages, ...filtered].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        });
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

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || loading) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('senderId', userId);
      formData.append('content', newMessage.trim());

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
          content: newMessage.trim(),
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, newMsg]);
        seenMessages.current.add(newMsg.id);
        setNewMessage('');
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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Mensajes */}
          <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                <p>No hay mensajes aún</p>
              </div>
            ) : (
              messages.map(message => {
                const isMine = message.senderId === loggedUserId;
                return (
                  <div key={message.id} style={{ maxWidth: '80%', alignSelf: isMine ? 'flex-start' : 'flex-end', marginBottom: '8px' }}>
                    <div style={{ padding: '10px 15px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: isMine ? '#f1f1f1' : '#53a57d', color: isMine ? '#333' : 'white', fontSize: '14px', wordWrap: 'break-word' }}>
                      {message.content}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px', textAlign: 'center' }}>
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Input y botón enviar */}
          <div style={{ display: 'flex', padding: '15px', borderTop: '1px solid #eee', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe un mensaje..."
              rows="2"
              disabled={loading}
              style={{ flex: 1, border: '1px solid #ddd', borderRadius: '20px', padding: '8px 15px', resize: 'none', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }}
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || loading}
              style={{ background: !newMessage.trim() || loading ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: !newMessage.trim() || loading ? 'not-allowed' : 'pointer' }}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default ChatPanel;
