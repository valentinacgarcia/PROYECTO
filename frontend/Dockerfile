# Usar imagen oficial de Node.js con Alpine para peso reducido
FROM node:18-alpine

# Crear y establecer el directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json para aprovechar cache de capas
COPY package*.json ./

# Instalar dependencias (incluyendo react-router-dom si está en package.json)
RUN npm install

# Copiar el resto del código fuente
COPY . .

# Exponer puerto 3000 para React
EXPOSE 3000

# Arrancar el servidor de desarrollo y escuchar en 0.0.0.0 para que sea accesible desde fuera del contenedor
CMD ["npm", "start"]
