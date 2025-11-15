#!/bin/bash

# Script para iniciar el cron automático en el contenedor Docker

echo "🔄 Configurando cron automático para PetMatch..."

# Instalar cron si no está disponible
if ! command -v cron &> /dev/null; then
    echo "📦 Instalando cron..."
    apt-get update && apt-get install -y cron
fi

# Copiar crontab
echo "📋 Configurando tareas programadas..."
cp /var/www/backend/symfony/crontab /etc/cron.d/petmatch-sync

# Dar permisos correctos
chmod 0644 /etc/cron.d/petmatch-sync
chown root:root /etc/cron.d/petmatch-sync

# Crear directorio de logs si no existe
mkdir -p /var/log

# Iniciar cron
echo "🚀 Iniciando servicio cron..."
service cron start

# Verificar que cron esté corriendo
echo "✅ Cron iniciado exitosamente"
echo "📊 Tareas programadas:"
crontab -l

# Mantener el proceso activo
echo "🔄 Cron ejecutándose en background..."
echo "📝 Logs de sincronización disponibles en /var/log/petmatch_sync.log"

# Mantener el contenedor activo
while true; do
    sleep 60
    echo "🔄 Daemon activo - $(date)"
done
