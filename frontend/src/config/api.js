// Configuración de URLs de la API
const API_CONFIG = {
  // Detectar si estamos en desarrollo local o en producción
  isLocal: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  
  // URLs base
  get BASE_URL() {
    // Si estamos accediendo desde Cloudflare Tunnel, usar rutas relativas (proxy)
    if (window.location.hostname.includes('trycloudflare.com')) {
      // Para Cloudflare Tunnel, usar rutas relativas que serán proxyadas
      return '';
    }
    
    // Si estamos accediendo desde LocalTunnel, usar rutas relativas (proxy)
    if (window.location.hostname.includes('loca.lt')) {
      // Para LocalTunnel, usar rutas relativas que serán proxyadas
      return '';
    }
    
    // Si estamos accediendo desde Cloudflare Tunnel, usar rutas relativas (proxy)
    if (window.location.hostname.includes('trycloudflare.com')) {
      // Para Cloudflare Tunnel, usar rutas relativas que serán proxyadas
      return '';
    }
    
    // Si estamos en local, usar localhost
    if (this.isLocal) {
      return 'http://localhost:8000';
    }
    
    // Para producción, usar la URL del servidor
    return 'https://api.petmatch.com';
  },
  
  // Endpoints específicos
  endpoints: {
    // Autenticación
    login: '/user/sesion',
    register: '/user/create',
    deleteUser: (id) => `/user/delete/${id}`,
    
    // Mascotas
    listPets: (userId) => `/pet/list/${userId}`,
    petDetail: (id) => `/pet/detail/${id}`,
    createPet: '/pet/create',
    updatePetForAdoption: (id) => `/pet/forAdoption/${id}`,
    editPet: (id) => `/pet/edit/${id}`,
    deletePet: (id) => `/pet/delete/${id}`,
    listAllPets: '/pet/list-all',
    
    // Adopción
    checkAdoptionForm: (userId) => `/adoption/check-form/${userId}`,
    submitAdoptionForm: '/adoption/submit',
    requestAdoption: '/adoptions/request',
    listRecommendations: (userId) => `/recommendations/list-preferences/${userId}`,
    
    // Servicios
    listServices: '/services/list-all',
    
    // Chats
    getUserChats: (userId) => `/chats/user/${userId}`,
    getChatMessages: (chatId) => `/chats/${chatId}/messages`,
    sendMessage: (chatId) => `/chats/${chatId}/message/send`,
    
    // Imágenes (proxy)
    proxyImage: (path) => `/pet/api/proxy-image/${encodeURIComponent(path)}`,
  },
};

export const buildApiUrl = (endpoint) => {
  const baseUrl = API_CONFIG.BASE_URL;
  // Si el endpoint ya es una URL completa, usarla directamente
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  // Si el endpoint es una ruta relativa, construirla con la base URL
  return `${baseUrl}${endpoint}`;
};

export default API_CONFIG;