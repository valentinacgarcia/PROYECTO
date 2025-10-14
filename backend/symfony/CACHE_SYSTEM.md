# 🖼️ Sistema de Cache de Imágenes - PetMatch

## 📋 Resumen

Este sistema implementa un cache local de imágenes con **sincronización automática** que permite:

1. **Cachear imágenes** cuando se acceden desde la PC (para que luego estén disponibles en el celular)
2. **Subir temporalmente** desde el celular y sincronizar después con MinIO
3. **Persistir cache** entre reinicios de Docker
4. **🆕 Sincronización automática** con polling cada 5 minutos
5. **🆕 Monitoreo en tiempo real** del estado del sistema
6. **🆕 Soporte multi-bucket** para mascotas, servicios y chats

## 🔧 Cómo funciona

### 1. Cache de Imágenes (proxyImage)

Cuando se accede a una imagen a través del endpoint `/pet/proxy-image/{path}`:

- ✅ **Si existe en cache** → Se sirve directamente desde `/var/cache/images/`
- 🔄 **Si no existe** → Se descarga desde MinIO y se guarda en cache
- ⏰ **Cache expira** → Después de 24 horas se vuelve a descargar

### 2. Subida Temporal desde Celular

Cuando se sube una imagen desde el celular:

- 📱 **Se guarda temporalmente** en `/var/uploads/temp/`
- 🔄 **Se sincroniza automáticamente** con MinIO usando el comando de sincronización
- ✅ **Se elimina** del directorio temporal una vez sincronizada

## 🚀 Endpoints Disponibles

### Cache de Imágenes (Unificado)
```
GET /proxy-image/{type}/{path}
```
- **Tipos soportados**: `mascotas`, `servicios`, `chats`
- Sirve imágenes desde cache local o MinIO
- Headers: `X-Cache-Status: HIT/MISS`, `X-Image-Type: {type}`

### Cache de Imágenes (Legacy - Mascotas)
```
GET /pet/proxy-image/{path}
```
- Sirve imágenes de mascotas desde cache local o MinIO
- Headers: `X-Cache-Status: HIT/MISS`

### Subida Temporal (Unificada)
```
POST /upload-temp/{type}
Content-Type: multipart/form-data
Body: photo (archivo)
```
- **Tipos soportados**: `mascotas`, `servicios`, `chats`
- Sube imagen temporalmente desde celular
- Respuesta: `{ "temp_filename": "...", "type": "...", "sync_status": "pending" }`

### Subida Temporal (Legacy - Mascotas)
```
POST /pet/upload-temp
Content-Type: multipart/form-data
Body: photo (archivo)
```
- Sube imagen temporalmente desde celular
- Respuesta: `{ "temp_filename": "...", "sync_status": "pending" }`

### Subida Temporal (Chats)
```
POST /chats/upload-temp
Content-Type: multipart/form-data
Body: photo (archivo)
```
- Sube imagen temporal de chat desde celular
- Respuesta: `{ "temp_filename": "...", "sync_status": "pending" }`

### Estado de Sincronización
```
GET /pet/sync-status/{filename}
```
- Verifica si una imagen temporal ya fue sincronizada
- Respuesta: `{ "sync_status": "pending|completed" }`

### 🆕 Estadísticas del Sistema (Unificadas)
```
GET /cache-stats
```
- Obtiene estadísticas completas del sistema de cache para todos los tipos
- Respuesta: `{ "total_temp_files": 0, "total_cache_files": 0, "by_type": {...} }`

### 🆕 Estadísticas del Sistema (Legacy)
```
GET /pet/cache-stats
```
- Obtiene estadísticas del sistema de cache de mascotas
- Respuesta: `{ "cache": {...}, "temp_uploads": {...}, "system": {...} }`

### 🆕 Forzar Sincronización
```
POST /pet/force-sync
```
- Ejecuta sincronización manual desde la API
- Respuesta: `{ "success": true, "output": "..." }`

## 🛠️ Comandos de Sincronización

### Comandos Básicos
```bash
# Sincronización completa (temp + cache + limpieza)
php bin/console app:sync-temp-images --full-sync

# Solo sincronizar imágenes temporales
php bin/console app:sync-temp-images

# Limpiar cache expirado
php bin/console app:sync-temp-images --clean-cache --max-age=7

# Ver estadísticas del sistema
php bin/console app:sync-temp-images --stats
```

### 🆕 Sincronización Automática
```bash
# Ejecutar sincronización continua (cada 5 minutos)
php bin/console app:auto-sync

# Ejecutar como daemon (sin output interactivo)
php bin/console app:auto-sync --daemon

# Intervalo personalizado (cada 2 minutos)
php bin/console app:auto-sync --interval=120

# Número limitado de iteraciones
php bin/console app:auto-sync --max-iterations=10
```

### 🆕 Automatización con Docker
El sistema incluye un **servicio de sincronización automática** que se ejecuta en Docker:

```bash
# Iniciar todos los servicios (incluye sync-daemon)
docker-compose up -d

# Ver logs del daemon de sincronización
docker-compose logs -f sync-daemon

# Reiniciar solo el daemon
docker-compose restart sync-daemon
```

**Configuración automática:**
- ✅ **Cada 5 minutos**: Sincronización completa
- ✅ **Diariamente a las 2 AM**: Limpieza de cache expirado
- ✅ **Semanalmente**: Rotación de logs

## 📁 Estructura de Directorios

```
/var/cache/images/          # Cache de imágenes (persistente)
├── abc123def456.jpg       # Imágenes cacheadas (MD5 del path)
└── .gitkeep              # Mantiene la carpeta en Git

/var/uploads/temp/          # Subidas temporales (se limpia automáticamente)
├── temp_64f8a1b2c3d4_1699123456.jpg
└── .gitkeep              # Mantiene la carpeta en Git
```

## 🐳 Configuración Docker

Los volúmenes están configurados para persistir el cache:

```yaml
volumes:
  - symfony-cache:/var/www/backend/symfony/var/cache/images
  - symfony-uploads:/var/www/backend/symfony/var/uploads/temp
```

## 🔄 Flujo de Trabajo

### Desde PC (localhost)
1. Usuario accede a `/pet/list-all`
2. Imágenes se descargan desde MinIO y se cachean
3. Próximas visitas usan cache local

### Desde Celular (Cloudflare Tunnel)
1. Usuario accede a la misma URL
2. Imágenes se sirven desde cache (si ya fueron cacheadas desde PC)
3. Si no están en cache, se descargan y cachean

### Subida desde Celular
1. Usuario sube imagen → Se guarda en `/var/uploads/temp/`
2. Comando de sincronización la mueve a MinIO
3. Imagen queda disponible para todos los dispositivos

## 🧹 Limpieza Automática

- **Cache de imágenes**: Expira después de 24 horas
- **Subidas temporales**: Se eliminan después de sincronizar
- **Comando de limpieza**: Elimina archivos de cache más antiguos de X días

## 📊 Monitoreo

Los logs muestran el estado del cache:

```
🟢 Sirviendo imagen desde cache: abc123def456.jpg
🔄 Descargando imagen desde MinIO: user_1/pet_5/64f8a1b2c3d4.jpg
💾 Imagen guardada en cache: abc123def456.jpg
📱 Imagen temporal guardada desde celular: temp_64f8a1b2c3d4_1699123456.jpg
✅ Sincronizado: temp_64f8a1b2c3d4_1699123456.jpg → temp_uploads/2023/11/04/temp_64f8a1b2c3d4_1699123456.jpg
```

## ⚡ Beneficios

- **Velocidad**: Imágenes se cargan instantáneamente desde cache
- **Resiliencia**: Funciona aunque MinIO esté temporalmente inaccesible
- **Eficiencia**: Reduce llamadas a MinIO
- **Flexibilidad**: Permite subir desde celular sin acceso directo a MinIO
- **Persistencia**: Cache se mantiene entre reinicios de Docker
- **🆕 Automatización**: Sincronización automática sin intervención manual
- **🆕 Monitoreo**: Estadísticas en tiempo real del sistema
- **🆕 Escalabilidad**: Sistema preparado para múltiples dispositivos

## 🚀 Inicio Rápido

### 1. Iniciar el Sistema
```bash
# Reiniciar Docker con el nuevo servicio de sincronización
docker-compose down && docker-compose up -d

# Verificar que el daemon esté corriendo
docker-compose ps
```

### 2. Verificar Sincronización Automática
```bash
# Ver logs del daemon
docker-compose logs -f sync-daemon

# Verificar estadísticas
curl http://localhost:8000/pet/cache-stats
```

### 3. Probar el Sistema
1. **Desde PC**: Accede a `localhost:8000/pet/list-all` → Las imágenes se cachean
2. **Desde Celular**: Accede vía Cloudflare Tunnel → Las imágenes se cargan desde cache
3. **Subir desde Celular**: Usa `/pet/upload-temp` → Se sincroniza automáticamente en 5 minutos

## 📊 Monitoreo y Logs

### Logs del Sistema
```bash
# Logs de sincronización
tail -f /var/log/petmatch_sync.log

# Logs de limpieza
tail -f /var/log/petmatch_cleanup.log

# Logs del daemon Docker
docker-compose logs -f sync-daemon
```

### Estadísticas en Tiempo Real
```bash
# Ver estadísticas completas
curl http://localhost:8000/pet/cache-stats | jq

# Forzar sincronización manual
curl -X POST http://localhost:8000/pet/force-sync
```
