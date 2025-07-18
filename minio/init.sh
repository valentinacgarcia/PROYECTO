#!/bin/bash

# Esperar a que MinIO esté listo
sleep 5

# Crear el bucket 'mascotas' si no existe
mc alias set local http://localhost:9000 petmatch petmatch
mc mb local/mascotas --ignore-existing

# Aplicar la política de solo lectura al bucket
mc policy set-json /policies/public-read.json local/mascotas

echo "Bucket 'mascotas' creado y política aplicada"