<?php

namespace App\Service;

use Aws\S3\S3Client;
use Psr\Log\LoggerInterface;

class ImageSyncService
{
    private S3Client $s3Client;
    private array $buckets;
    private array $tempDirs;
    private array $cacheDirs;
    private LoggerInterface $logger;

    public function __construct(LoggerInterface $logger)
    {
        $this->logger = $logger;
        
        // Configuración de buckets y directorios
        $this->buckets = [
            'mascotas' => 'mascotas',
            'servicios' => 'servicios', 
            'chats' => 'chats'
        ];
        
        $this->tempDirs = [
            'mascotas' => '/var/uploads/temp',
            'servicios' => '/var/uploads/temp/services',
            'chats' => '/var/uploads/temp/chats'
        ];
        
        $this->cacheDirs = [
            'mascotas' => '/var/cache/images',
            'servicios' => '/var/cache/images/services',
            'chats' => '/var/cache/images/chats'
        ];
        
        $this->s3Client = new S3Client([
            'version' => 'latest',
            'region' => 'us-east-1',
            'endpoint' => 'http://minio:9000', // Forzar endpoint correcto
            'use_path_style_endpoint' => true,
            'credentials' => [
                'key' => 'petmatch',
                'secret' => 'petmatch',
            ],
        ]);
    }

    /**
     * Sincroniza imágenes temporales con MinIO para todos los buckets
     */
    public function syncTempImages(): array
    {
        $results = [
            'synced' => 0,
            'errors' => 0,
            'details' => []
        ];

        foreach ($this->tempDirs as $type => $tempDir) {
            if (!is_dir($tempDir)) {
                continue;
            }

            $tempFiles = glob($tempDir . '/temp*');
            
            foreach ($tempFiles as $filePath) {
                try {
                    $filename = basename($filePath);
                    $extension = pathinfo($filename, PATHINFO_EXTENSION);
                    
                    // Determinar bucket basado en el tipo
                    $bucket = $this->buckets[$type];
                    
                    // Generar key para MinIO con timestamp
                    $key = 'temp_uploads/' . date('Y/m/d') . '/' . $filename;
                    
                    // Subir a MinIO
                    $this->s3Client->putObject([
                        'Bucket' => $bucket,
                        'Key' => $key,
                        'Body' => fopen($filePath, 'rb'),
                        'ContentType' => $this->getMimeType($extension),
                    ]);

                    // Eliminar archivo temporal
                    unlink($filePath);
                    
                    $results['synced']++;
                    $results['details'][] = "✅ Sincronizado ($type): $filename → $key";
                    $this->logger->info("Imagen temporal sincronizada ($type): $filename");
                    
                } catch (\Exception $e) {
                    $results['errors']++;
                    $results['details'][] = "❌ Error ($type): $filename - " . $e->getMessage();
                    $this->logger->error("Error sincronizando imagen temporal ($type): " . $e->getMessage());
                }
            }
        }

        return $results;
    }

    /**
     * Verifica cambios en MinIO y actualiza cache si es necesario para todos los buckets
     */
    public function checkAndUpdateCache(): array
    {
        $results = [
            'checked' => 0,
            'updated' => 0,
            'errors' => 0,
            'details' => []
        ];

        foreach ($this->buckets as $type => $bucket) {
            try {
                // Obtener lista de objetos en MinIO
                $objects = $this->s3Client->listObjectsV2([
                    'Bucket' => $bucket,
                    'MaxKeys' => 1000, // Ajustar según necesidad
                ]);

                if (!isset($objects['Contents'])) {
                    continue;
                }

                $cacheDir = $this->cacheDirs[$type];

                foreach ($objects['Contents'] as $object) {
                    $key = $object['Key'];
                    $lastModified = $object['LastModified']->getTimestamp();
                    
                    // Saltar subidas temporales
                    if (str_starts_with($key, 'temp_uploads/')) {
                        continue;
                    }

                    $results['checked']++;
                    $cachePath = $cacheDir . '/' . md5($key) . '.jpg';
                    
                    // Log para debug
                    $this->logger->info("Intentando actualizar cache ($type): $key → $cachePath");
                    
                    // Si no existe en cache o MinIO es más reciente
                    if (!file_exists($cachePath) || filemtime($cachePath) < $lastModified) {
                        try {
                            $this->downloadAndCacheImage($bucket, $key, $cachePath);
                            $results['updated']++;
                            $results['details'][] = "🔄 Actualizado cache ($type): " . basename($cachePath);
                        } catch (\Exception $e) {
                            $results['errors']++;
                            $results['details'][] = "❌ Error actualizando ($type): $key - " . $e->getMessage();
                            $this->logger->error("Error descargando ($type): " . $e->getMessage());
                        }
                    } else {
                        $this->logger->info("Cache actualizado para ($type): $key");
                    }
                }

            } catch (\Exception $e) {
                $results['errors']++;
                $results['details'][] = "❌ Error general ($type): " . $e->getMessage();
                $this->logger->error("Error verificando cambios en MinIO ($type): " . $e->getMessage());
            }
        }

        return $results;
    }

    /**
     * Limpia cache expirado para todos los tipos
     */
    public function cleanExpiredCache(int $maxAgeDays = 3): array
    {
        $results = [
            'cleaned' => 0,
            'errors' => 0,
            'details' => []
        ];

        $maxAgeSeconds = $maxAgeDays * 24 * 60 * 60;
        $cutoffTime = time() - $maxAgeSeconds;
        
        foreach ($this->cacheDirs as $type => $cacheDir) {
            if (!is_dir($cacheDir)) {
                continue;
            }
            
            $cacheFiles = glob($cacheDir . '/*.jpg');
            
            foreach ($cacheFiles as $filePath) {
                try {
                    if (filemtime($filePath) < $cutoffTime) {
                        unlink($filePath);
                        $results['cleaned']++;
                        $results['details'][] = "🗑️ Eliminado ($type): " . basename($filePath);
                    }
                } catch (\Exception $e) {
                    $results['errors']++;
                    $results['details'][] = "❌ Error eliminando ($type): " . basename($filePath) . " - " . $e->getMessage();
                }
            }
        }

        return $results;
    }

    /**
     * Ejecuta sincronización completa (temp + cache + limpieza)
     */
    public function runFullSync(): array
    {
        $this->logger->info("🔄 Iniciando sincronización completa");
        
        $results = [
            'timestamp' => date('Y-m-d H:i:s'),
            'temp_sync' => $this->syncTempImages(),
            'cache_update' => $this->checkAndUpdateCache(),
            'cache_cleanup' => $this->cleanExpiredCache(),
        ];

        $totalSynced = $results['temp_sync']['synced'];
        $totalUpdated = $results['cache_update']['updated'];
        $totalCleaned = $results['cache_cleanup']['cleaned'];
        $totalErrors = $results['temp_sync']['errors'] + $results['cache_update']['errors'] + $results['cache_cleanup']['errors'];

        $this->logger->info("✅ Sincronización completada: $totalSynced temp, $totalUpdated cache, $totalCleaned limpiados, $totalErrors errores");

        return $results;
    }

    /**
     * Descarga imagen desde MinIO y la guarda en cache
     */
    private function downloadAndCacheImage(string $bucket, string $key, string $cachePath): void
    {
        $result = $this->s3Client->getObject([
            'Bucket' => $bucket,
            'Key' => $key,
        ]);

        $cacheDir = dirname($cachePath);
        if (!is_dir($cacheDir)) {
            mkdir($cacheDir, 0777, true);
        }

        // ⚠️ Forzar conversión segura del stream a string
        $body = (string) $result['Body'];

        if ($body === '') {
            throw new \RuntimeException("Objeto vacío o no legible desde S3 ($bucket/$key)");
        }

        $written = file_put_contents($cachePath, $body);

        if ($written === false) {
            throw new \RuntimeException("No se pudo escribir archivo en cache: $cachePath");
        }
    }

    /**
     * Obtiene MIME type basado en extensión
     */
    private function getMimeType(string $extension): string
    {
        return match (strtolower($extension)) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            default => 'image/jpeg',
        };
    }

    /**
     * Obtiene estadísticas del sistema de cache para todos los tipos
     */
    public function getCacheStats(): array
    {
        $stats = [
            'total_temp_files' => 0,
            'total_cache_files' => 0,
            'total_cache_size_mb' => 0,
            'by_type' => [],
            'last_sync' => $this->getLastSyncTime(),
        ];

        foreach ($this->tempDirs as $type => $tempDir) {
            $tempFiles = is_dir($tempDir) ? count(glob($tempDir . '/temp*')) : 0;
            $stats['total_temp_files'] += $tempFiles;
            
            $cacheDir = $this->cacheDirs[$type];
            $cacheFiles = is_dir($cacheDir) ? count(glob($cacheDir . '/*.jpg')) : 0;
            $stats['total_cache_files'] += $cacheFiles;
            
            $cacheSize = 0;
            if (is_dir($cacheDir)) {
                foreach (glob($cacheDir . '/*.jpg') as $file) {
                    $cacheSize += filesize($file);
                }
            }
            $cacheSizeMB = round($cacheSize / 1024 / 1024, 2);
            $stats['total_cache_size_mb'] += $cacheSizeMB;
            
            $stats['by_type'][$type] = [
                'temp_files' => $tempFiles,
                'cache_files' => $cacheFiles,
                'cache_size_mb' => $cacheSizeMB,
            ];
        }

        return $stats;
    }

    /**
     * Obtiene timestamp de última sincronización
     */
    private function getLastSyncTime(): ?string
    {
        $syncFile = '/var/cache/last_sync.txt';
        if (file_exists($syncFile)) {
            return file_get_contents($syncFile);
        }
        return null;
    }

    /**
     * Actualiza timestamp de última sincronización
     */
    private function updateLastSyncTime(): void
    {
        $syncFile = '/var/cache/last_sync.txt';
        file_put_contents($syncFile, date('Y-m-d H:i:s'));
    }
}
