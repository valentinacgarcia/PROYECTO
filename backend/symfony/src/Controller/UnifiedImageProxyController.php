<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Annotation\Route;
use Aws\S3\S3Client;

class UnifiedImageProxyController extends AbstractController
{
    /**
     * Proxy unificado para imágenes con cache
     * Soporta: mascotas, servicios, chats
     */
    #[Route('/proxy-image/{type}/{path}', name: 'unified_proxy_image', methods: ['GET'], requirements: ['type' => 'mascotas|servicios|chats', 'path' => '.+'])]
    public function proxyImage(string $type, string $path): Response
    {
        try {
            // Configuración de buckets y directorios
            $buckets = [
                'mascotas' => 'mascotas',
                'servicios' => 'servicios',
                'chats' => 'chats'
            ];
            
            $cacheDirs = [
                'mascotas' => '/var/cache/images',
                'servicios' => '/var/cache/images/services',
                'chats' => '/var/cache/images/chats'
            ];

            $bucket = $buckets[$type];
            $decodedPath = urldecode($path);
            $cacheDir = $cacheDirs[$type];
            
            // Para mascotas, las imágenes están directamente en /var/cache/images/ con el nombre del archivo
            if ($type === 'mascotas') {
                $cachePath = $cacheDir . '/' . basename($decodedPath);
            } else {
                $cachePath = $cacheDir . '/' . md5($decodedPath) . '.jpg';
            }

            // 1️⃣ Si existe en cache, servir directo
            if (file_exists($cachePath) && filemtime($cachePath) > (time() - 86400)) { // Cache válido por 24 horas
                error_log("🟢 Sirviendo imagen de $type desde cache: " . basename($cachePath));
                return new Response(file_get_contents($cachePath), 200, [
                    'Content-Type' => 'image/jpeg',
                    'Cache-Control' => 'public, max-age=86400',
                    'X-Cache-Status' => 'HIT',
                    'X-Image-Type' => $type,
                ]);
            }

            // 2️⃣ Si no existe o está expirado, traer desde MinIO
            error_log("🔄 Descargando imagen de $type desde MinIO: " . $decodedPath);
            
            $s3 = new S3Client([
                'version' => 'latest',
                'region' => 'us-east-1',
                'endpoint' => $_ENV['MINIO_ENDPOINT'] ?? 'http://minio:9000',
                'use_path_style_endpoint' => true,
                'credentials' => [
                    'key' => $_ENV['MINIO_KEY'] ?? 'petmatch',
                    'secret' => $_ENV['MINIO_SECRET'] ?? 'petmatch',
                ],
            ]);

            $result = $s3->getObject([
                'Bucket' => $bucket,
                'Key' => $decodedPath,
            ]);

            // 3️⃣ Guardar copia local en cache
            if (!is_dir($cacheDir)) {
                mkdir($cacheDir, 0777, true);
            }
            
            // Para mascotas, usar el nombre del archivo original
            if ($type === 'mascotas') {
                $cachePath = $cacheDir . '/' . basename($decodedPath);
            }
            
            file_put_contents($cachePath, $result['Body']);
            error_log("💾 Imagen de $type guardada en cache: " . basename($cachePath));

            // 4️⃣ Servir respuesta
            $response = new StreamedResponse();
            $response->setCallback(function () use ($result) {
                echo $result['Body'];
            });
            $response->headers->set('Content-Type', $result['ContentType'] ?? 'image/jpeg');
            $response->headers->set('Cache-Control', 'public, max-age=86400');
            $response->headers->set('X-Cache-Status', 'MISS');
            $response->headers->set('X-Image-Type', $type);

            return $response;

        } catch (\Exception $e) {
            error_log("❌ Error en proxy de $type: " . $e->getMessage());
            return new Response("Imagen de $type no encontrada: " . $e->getMessage(), 404);
        }
    }

    /**
     * Subir imagen temporal desde el celular (unificado)
     */
    #[Route('/upload-temp/{type}', name: 'unified_upload_temp', methods: ['POST'], requirements: ['type' => 'mascotas|servicios|chats'])]
    public function uploadTemp(string $type): Response
    {
        try {
            $request = $this->container->get('request_stack')->getCurrentRequest();
            $file = $request->files->get('photo');
            
            if (!$file) {
                return $this->json(['error' => 'Archivo no encontrado'], 400);
            }

            // Validar tipo de archivo
            $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!in_array($file->getMimeType(), $allowedTypes)) {
                return $this->json(['error' => 'Tipo de archivo no permitido'], 400);
            }

            // Validar tamaño (máximo 10MB)
            if ($file->getSize() > 10 * 1024 * 1024) {
                return $this->json(['error' => 'Archivo demasiado grande (máximo 10MB)'], 400);
            }

            // Configurar directorios según tipo
            $tempDirs = [
                'mascotas' => '/var/uploads/temp',
                'servicios' => '/var/uploads/temp/services',
                'chats' => '/var/uploads/temp/chats'
            ];

            $tempDir = $tempDirs[$type];
            if (!is_dir($tempDir)) {
                mkdir($tempDir, 0777, true);
            }

            // Generar nombre único para el archivo temporal
            $filename = "temp_{$type}_" . uniqid() . '_' . time() . '.' . $file->guessExtension();
            $filePath = $tempDir . '/' . $filename;
            
            // Mover archivo a directorio temporal
            $file->move($tempDir, $filename);

            error_log("📱 Imagen temporal de $type guardada desde celular: " . $filename);

            return $this->json([
                'success' => true,
                'temp_filename' => $filename,
                'type' => $type,
                'message' => "Imagen de $type guardada temporalmente. Se sincronizará con MinIO automáticamente.",
                'sync_status' => 'pending'
            ]);

        } catch (\Exception $e) {
            error_log("❌ Error en upload temporal de $type: " . $e->getMessage());
            return $this->json(['error' => 'Error al subir archivo: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Estadísticas del sistema de cache unificado
     */
    #[Route('/cache-stats', name: 'unified_cache_stats', methods: ['GET'])]
    public function cacheStats(): Response
    {
        try {
            $stats = [
                'total_temp_files' => 0,
                'total_cache_files' => 0,
                'total_cache_size_mb' => 0,
                'by_type' => [],
                'timestamp' => date('Y-m-d H:i:s'),
            ];

            $types = ['mascotas', 'servicios', 'chats'];
            $tempDirs = [
                'mascotas' => '/var/uploads/temp',
                'servicios' => '/var/uploads/temp/services',
                'chats' => '/var/uploads/temp/chats'
            ];
            $cacheDirs = [
                'mascotas' => '/var/cache/images',
                'servicios' => '/var/cache/images/services',
                'chats' => '/var/cache/images/chats'
            ];

            foreach ($types as $type) {
                $tempDir = $tempDirs[$type];
                $cacheDir = $cacheDirs[$type];
                
                $tempFiles = is_dir($tempDir) ? count(glob($tempDir . '/temp*')) : 0;
                $cacheFiles = is_dir($cacheDir) ? count(glob($cacheDir . '/*.jpg')) : 0;
                
                $cacheSize = 0;
                if (is_dir($cacheDir)) {
                    foreach (glob($cacheDir . '/*.jpg') as $file) {
                        $cacheSize += filesize($file);
                    }
                }
                $cacheSizeMB = round($cacheSize / 1024 / 1024, 2);
                
                $stats['total_temp_files'] += $tempFiles;
                $stats['total_cache_files'] += $cacheFiles;
                $stats['total_cache_size_mb'] += $cacheSizeMB;
                
                $stats['by_type'][$type] = [
                    'temp_files' => $tempFiles,
                    'cache_files' => $cacheFiles,
                    'cache_size_mb' => $cacheSizeMB,
                ];
            }

            return $this->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            error_log("❌ Error obteniendo estadísticas: " . $e->getMessage());
            return $this->json(['error' => 'Error obteniendo estadísticas: ' . $e->getMessage()], 500);
        }
    }
}
