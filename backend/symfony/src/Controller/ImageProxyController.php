<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Attribute\Route;
use Aws\S3\S3Client;
use Aws\Exception\AwsException;

class ImageProxyController extends AbstractController
{
    #[Route('/pet/api/proxy-image/{path}', name: 'proxy_image', methods: ['GET'], requirements: ['path' => '.+'])]
    public function proxyImage(string $path): Response
    {
        try {
            // Log para debug
            error_log("🚀 ImageProxyController ejecutándose para path: " . $path);
            
            // Configuración de MinIO
            // Usar la URL interna del contenedor para acceso desde dentro del backend
            $minioEndpoint = $_ENV['MINIO_ENDPOINT'] ?? 'http://minio:9000';
            $minioKey = $_ENV['MINIO_KEY'] ?? 'petmatch';
            $minioSecret = $_ENV['MINIO_SECRET'] ?? 'petmatch';
            $minioBucket = $_ENV['MINIO_BUCKET'] ?? 'mascotas';
            
            error_log("🔧 Configuración MinIO: endpoint=$minioEndpoint, bucket=$minioBucket, key=$minioKey");
            
            // Crear cliente S3 para MinIO
            $s3Client = new S3Client([
                'version' => 'latest',
                'region' => 'us-east-1',
                'endpoint' => $minioEndpoint,
                'use_path_style_endpoint' => true,
                'credentials' => [
                    'key' => $minioKey,
                    'secret' => $minioSecret,
                ],
            ]);
            
            // Decodificar el path
            $decodedPath = urldecode($path);
            error_log("📁 Path decodificado: " . $decodedPath);
            
            // Intentar obtener el objeto de MinIO
            $result = $s3Client->getObject([
                'Bucket' => $minioBucket,
                'Key' => $decodedPath,
            ]);
            
            // Obtener el contenido y metadatos
            $content = $result['Body']->getContents();
            $contentType = $result['ContentType'] ?? 'image/jpeg';
            
            // Crear respuesta con el contenido de la imagen
            $response = new Response($content);
            $response->headers->set('Content-Type', $contentType);
            $response->headers->set('Cache-Control', 'public, max-age=3600');
            
            error_log("✅ Imagen servida exitosamente: " . $decodedPath);
            return $response;
            
        } catch (AwsException $e) {
            error_log("❌ Error de AWS/MinIO: " . $e->getMessage());
            return new Response('Error al cargar la imagen: ' . $e->getMessage(), 404);
        } catch (\Exception $e) {
            error_log("❌ Error general: " . $e->getMessage());
            return new Response('Error interno del servidor: ' . $e->getMessage(), 500);
        }
    }
}
