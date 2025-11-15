<?php

require_once '/var/www/backend/symfony/vendor/autoload.php';

use Aws\S3\S3Client;

echo "=== DEBUG SYNC ===\n";

// Configuración
$endpoint = $_ENV['MINIO_ENDPOINT'] ?? 'http://minio:9000';
echo "Endpoint: $endpoint\n";

$s3 = new S3Client([
    'version' => 'latest',
    'region' => 'us-east-1',
    'endpoint' => $endpoint,
    'use_path_style_endpoint' => true,
    'credentials' => [
        'key' => 'petmatch',
        'secret' => 'petmatch',
    ],
]);

$buckets = ['mascotas', 'servicios', 'chats'];
$cacheDirs = [
    'mascotas' => '/var/www/backend/symfony/var/cache/images',
    'servicios' => '/var/www/backend/symfony/var/cache/images/services',
    'chats' => '/var/www/backend/symfony/var/cache/images/chats'
];

foreach ($buckets as $bucket) {
    echo "\n--- Bucket: $bucket ---\n";
    
    try {
        $objects = $s3->listObjectsV2([
            'Bucket' => $bucket,
            'MaxKeys' => 5,
        ]);
        
        if (!isset($objects['Contents'])) {
            echo "No hay objetos en el bucket\n";
            continue;
        }
        
        echo "Objetos encontrados: " . count($objects['Contents']) . "\n";
        
        $cacheDir = $cacheDirs[$bucket];
        echo "Cache dir: $cacheDir\n";
        echo "Cache dir existe: " . (is_dir($cacheDir) ? 'Sí' : 'No') . "\n";
        
        foreach ($objects['Contents'] as $object) {
            $key = $object['Key'];
            $lastModified = $object['LastModified']->getTimestamp();
            
            if (str_starts_with($key, 'temp_uploads/')) {
                echo "Saltando temp: $key\n";
                continue;
            }
            
            $cachePath = $cacheDir . '/' . md5($key) . '.jpg';
            echo "Key: $key\n";
            echo "Cache path: $cachePath\n";
            echo "Existe en cache: " . (file_exists($cachePath) ? 'Sí' : 'No') . "\n";
            
            if (file_exists($cachePath)) {
                $cacheTime = filemtime($cachePath);
                echo "Cache time: $cacheTime\n";
                echo "MinIO time: $lastModified\n";
                echo "MinIO más reciente: " . ($lastModified > $cacheTime ? 'Sí' : 'No') . "\n";
            }
            
            // Intentar descargar
            try {
                echo "Intentando descargar...\n";
                $result = $s3->getObject([
                    'Bucket' => $bucket,
                    'Key' => $key,
                ]);
                
                if (!is_dir($cacheDir)) {
                    mkdir($cacheDir, 0777, true);
                }
                
                file_put_contents($cachePath, $result['Body']);
                echo "✅ Descargado exitosamente\n";
                break; // Solo probar uno
                
            } catch (Exception $e) {
                echo "❌ Error descargando: " . $e->getMessage() . "\n";
            }
        }
        
    } catch (Exception $e) {
        echo "❌ Error general: " . $e->getMessage() . "\n";
    }
}

