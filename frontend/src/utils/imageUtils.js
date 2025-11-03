// utils/imageUtils.js

import { buildApiUrl } from '../config/api';

export const processImageUrls = (urls) => {
  if (!urls || !Array.isArray(urls)) {
    return [];
  }

  return urls.map(originalUrl => {
    // Si estamos en Cloudflare Tunnel, convertir URLs de MinIO a URLs del proxy
    if (window.location.hostname.includes('trycloudflare.com')) {
      try {
        const url = new URL(originalUrl);
        const pathParts = url.pathname.split('/');
        
        // Si es una URL de MinIO (contiene 'mascotas/' o 'chats/'), convertirla
        if (pathParts.includes('mascotas') || pathParts.includes('chats')) {
          const imagePath = pathParts.slice(pathParts.indexOf('mascotas') > -1 ? pathParts.indexOf('mascotas') : pathParts.indexOf('chats')).join('/');
          return buildApiUrl(`/pet/api/proxy-image/${encodeURIComponent(imagePath)}`);
        }
      } catch (e) {
        // Si hay error al parsear la URL, usar la original
        console.warn("Error parsing image URL, using original:", originalUrl, e);
        return originalUrl;
      }
    }
    return originalUrl;
  });
};
