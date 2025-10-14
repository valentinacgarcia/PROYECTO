#!/bin/bash
set -e

echo "🚀 Generador de URL de Cloudflare Tunnel"

# Instalar cloudflared si no está
if ! command -v cloudflared &> /dev/null; then
  echo "📦 Instalando Cloudflared..."
  curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o ./cloudflared
  chmod +x ./cloudflared
  CLOUDFLARED_CMD="./cloudflared"
else
  CLOUDFLARED_CMD="cloudflared"
fi

extract_url() {
  grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' | head -1
}

update_docker_compose() {
  local new_url="$1"
  local old_url="$2"

  if [ -f "docker-compose.yml" ]; then
    echo "🔄 Actualizando docker-compose.yml con nueva URL: $new_url"
    cp docker-compose.yml docker-compose.yml.backup
    
    # Actualizar todas las referencias a CLOUDFLARE_URL con la nueva URL
    sed "s|\${CLOUDFLARE_URL:-[^}]*}|\${CLOUDFLARE_URL:-$new_url}|g" docker-compose.yml > docker-compose.tmp
    mv docker-compose.tmp docker-compose.yml
    echo "✅ docker-compose.yml actualizado"
  else
    echo "⚠️  No se encontró docker-compose.yml en el directorio actual"
  fi
}

get_new_url() {
  echo "🌐 Obteniendo nueva URL de Cloudflare Tunnel..."
  
  # Detener cualquier túnel existente
  pkill -f cloudflared 2>/dev/null || true
  rm -f /tmp/cloudflared.log

  # Ejecutar cloudflared y capturar la salida
  $CLOUDFLARED_CMD tunnel --url http://localhost:8000 > /tmp/cloudflared.log 2>&1 &
  sleep 8

  local new_url
  new_url=$(extract_url < /tmp/cloudflared.log || true)
  
  if [ -n "$new_url" ]; then
    echo "$new_url" > /tmp/current_cloudflare_url.txt
    echo "✅ Nueva URL obtenida: $new_url"
    return 0
  else
    echo "❌ No se pudo obtener la URL"
    tail -5 /tmp/cloudflared.log || true
    return 1
  fi
}

main() {
  local old_url=""
  [ -f /tmp/current_cloudflare_url.txt ] && old_url=$(cat /tmp/current_cloudflare_url.txt)

  if get_new_url; then
    local new_url
    new_url=$(cat /tmp/current_cloudflare_url.txt)

    echo ""
    echo "🎉 Nueva URL de Cloudflare Tunnel:"
    echo "🌍 $new_url"
    echo ""

    if [ -n "$old_url" ] && [ "$old_url" != "$new_url" ]; then
      update_docker_compose "$new_url" "$old_url"
      echo ""
      echo "📋 Para aplicar los cambios, ejecuta:"
      echo "   docker compose down && docker compose up -d"
    else
      echo "📋 Para usar esta URL, actualiza manualmente tu docker-compose.yml"
    fi

    echo ""
    echo "📋 El túnel ya está activo en background"
    echo "📋 Para detenerlo: pkill -f cloudflared"
    echo "📋 Para ver logs: tail -f /tmp/cloudflared.log"
  else
    echo "❌ Error al obtener la URL del túnel"
    exit 1
  fi
}

main