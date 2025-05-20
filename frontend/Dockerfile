# Usar una imagen base de Node.js
FROM node:18-alpine

# Crear y establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Copiar package.json y package-lock.json primero (para cache)
COPY package*.json ./

# Instalar las dependencias de tu proyecto
RUN npm install

# Copiar el resto de los archivos del proyecto
COPY . .

# Exponer el puerto 3000 para la aplicación React
EXPOSE 3000

# Iniciar la aplicación React
CMD ["npm", "start"]