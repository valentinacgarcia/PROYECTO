# Usar una imagen base de Node.js
FROM node:16

# Crear y establecer el directorio de trabajo en el contenedor
WORKDIR /app

# Copiar los archivos de tu proyecto React al contenedor
COPY . .

# Instalar las dependencias de tu proyecto
RUN npm install

# Exponer el puerto 3000 para la aplicación React
EXPOSE 3000

# Iniciar la aplicación React
CMD ["npm", "start"]
