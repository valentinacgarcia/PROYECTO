<?php

namespace App\Controller;

use App\Entity\Service;
use App\Entity\Photo;
use App\Entity\Marcador;
use App\Repository\ServiceRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\Routing\Annotation\Route;
use Aws\S3\S3Client;

#[Route('/services')]
class ServiceController extends AbstractController
{
    #[Route('/list-all', name: 'service_list_all', methods: ['GET'])]
    public function listAll(Request $request, ServiceRepository $serviceRepository): JsonResponse
    {
        $availabilityDaysParam = $request->query->get('availabilityDays');
        $availabilityDays = null;
        if ($availabilityDaysParam) {
            // Si viene como JSON string, decodificarlo
            if (is_string($availabilityDaysParam) && str_starts_with($availabilityDaysParam, '[')) {
                $availabilityDays = json_decode($availabilityDaysParam, true);
            } else {
                // Si viene como array, usarlo directamente
                $availabilityDays = $availabilityDaysParam;
            }
        }

        $filters = [
            'search' => $request->query->get('search'),
            'category' => $request->query->get('category'),
            'modality' => $request->query->get('modality'),
            'priceType' => $request->query->get('priceType'),
            'availabilityDays' => $availabilityDays,
            'minPrice' => $request->query->get('minPrice'),
            'maxPrice' => $request->query->get('maxPrice'),
        ];

        // Debug: Log de los filtros recibidos
        error_log('Filtros recibidos: ' . json_encode($filters));

        $page = (int) $request->query->get('page', 1);
        $limit = (int) $request->query->get('limit', 12);

        $services = $serviceRepository->findWithPagination($filters, $page, $limit);
        $totalServices = $serviceRepository->countWithFilters($filters);

        $data = array_map(fn($service) => $this->serializeService($service), $services);

        return $this->json([
            'success' => true,
            'data' => $data,
            'pagination' => [
                'current_page' => $page,
                'total_items' => $totalServices,
                'items_per_page' => $limit,
                'total_pages' => ceil($totalServices / $limit)
            ]
        ]);
    }

    #[Route('/user/{userId}', name: 'service_list_by_user', methods: ['GET'])]
    public function listByUser(
        int $userId,
        UserRepository $userRepository,
        ServiceRepository $serviceRepository
    ): JsonResponse {
        $user = $userRepository->find($userId);

        if (!$user) {
            error_log("Usuario $userId no encontrado");
            return $this->json(['error' => 'Usuario no encontrado'], 404);
        }

        error_log("Buscando servicios del usuario $userId (entity id={$user->getId()})");

        // Buscar servicios activos del usuario
        $services = $serviceRepository->findBy(['provider' => $user, 'isActive' => true]);

        error_log("Servicios encontrados: " . count($services));

        // Para debug: IDs de los servicios
        $ids = array_map(fn($s) => $s->getId(), $services);
        error_log("IDs encontrados: " . json_encode($ids));

        $data = array_map(fn($service) => [
            'id' => $service->getId(),
            'serviceName' => $service->getServiceName(),
            'description' => $service->getDescription(),
            'category' => $service->getCategory(),
            'address' => $service->getAddress(),
            'latitude' => $service->getLatitude(),
            'longitude' => $service->getLongitude(),
            'price' => $service->getPrice(),
            'priceType' => $service->getPriceType(),
            'modalities' => $service->getModalities(),
            'availabilityDays' => $service->getAvailabilityDays(),
            'photos' => array_map(
                fn($photo) => $this->getPresignedUrl($photo->getUrl()),
                $service->getPhotos()->toArray()
            ),
            'createdAt' => $service->getCreatedAt()->format('Y-m-d H:i:s'),
        ], $services);

        return $this->json([
            'success' => true,
            'data' => $data
        ]);
    }

    #[Route('/detail/{id}', name: 'service_detail', methods: ['GET'])]
    public function detail(ServiceRepository $serviceRepository, int $id): JsonResponse
    {
        $service = $serviceRepository->find($id);

        if (!$service) {
            return $this->json(['error' => 'Servicio no encontrado'], 404);
        }

        return $this->json([
            'success' => true,
            'data' => $this->serializeService($service)
        ]);
    }

    #[Route('/create', name: 'service_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em, UserRepository $userRepository): JsonResponse
    {
        try {
            // Debug: Log de los datos recibidos
            error_log('Datos recibidos: ' . json_encode($request->request->all()));
            
            $userId = $request->get('provider_id');
            if (!$userId) {
                return $this->json(['error' => 'provider_id es requerido'], 400);
            }
            
            $user = $userRepository->find($userId);
            if (!$user) {
                return $this->json(['error' => 'Usuario no encontrado'], 404);
            }

            // Obtener coordenadas automáticamente si no se proporcionan
            $latitude = $request->get('latitude');
            $longitude = $request->get('longitude');
            $address = $request->get('address');
            
            // Si no hay coordenadas pero sí hay dirección, geocodificar automáticamente
            if ((!$latitude || !$longitude) && $address) {
                try {
                    $geocodingResult = $this->geocodeAddress($address);
                    if ($geocodingResult) {
                        $latitude = $geocodingResult['lat'];
                        $longitude = $geocodingResult['lng'];
                        error_log("Geocodificación automática exitosa para: $address -> lat: $latitude, lng: $longitude");
                    }
                } catch (\Exception $e) {
                    error_log("Error en geocodificación automática: " . $e->getMessage());
                }
            }

            $service = new Service();
            $service->setProvider($user)
                ->setServiceName($request->get('serviceName'))
                ->setDescription($request->get('description'))
                ->setCategory($request->get('category'))
                ->setAddress($address)
                ->setLatitude($latitude ?: null)
                ->setLongitude($longitude ?: null)
                ->setPrice($request->get('price'))
                ->setPriceType($request->get('priceType'))
                ->setModalities(json_decode($request->get('modalities'), true) ?? [])
                ->setAvailabilityDays(json_decode($request->get('availabilityDays'), true) ?? [])
                ->setIsActive(true);

            $em->persist($service);
            $em->flush(); // Necesario para tener el ID del servicio

            // Crear marcador automáticamente si hay coordenadas
            if ($service->getLatitude() && $service->getLongitude()) {
                $marker = new Marcador();
                $marker->setName($service->getServiceName())
                    ->setDescription($service->getDescription())
                    ->setAddress($service->getAddress())
                    ->setLat((float) $service->getLatitude())
                    ->setLng((float) $service->getLongitude())
                    ->setActivo(true);
                
                $service->setMarker($marker);
                $em->persist($marker);
            }

            $files = $request->files->get('photos');
            if ($files) {
                foreach ($files as $file) {
                    $fileKey = $this->uploadToMinio($file, $user->getId(), $service->getId());
                    $photo = new Photo();
                    $photo->setUrl($fileKey)->setService($service);
                    $em->persist($photo);
                }
            }

            $em->flush();

            return $this->json(['message' => 'Servicio creado con éxito', 'id' => $service->getId()], 201);
            
        } catch (\Exception $e) {
            error_log('Error al crear servicio: ' . $e->getMessage());
            return $this->json(['error' => 'Error interno del servidor: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/edit/{id}', name: 'service_edit', methods: ['PUT', 'POST'])]
    public function edit(Request $request, ServiceRepository $serviceRepository, EntityManagerInterface $em, int $id): JsonResponse
    {
        $service = $serviceRepository->find($id);

        if (!$service) {
            return $this->json(['error' => 'Servicio no encontrado'], 404);
        }

        $data = json_decode($request->getContent(), true) ?? [];

        // Actualizar campos
        $service->setServiceName($data['serviceName'] ?? $service->getServiceName())
            ->setDescription($data['description'] ?? $service->getDescription())
            ->setCategory($data['category'] ?? $service->getCategory())
            ->setAddress($data['address'] ?? $service->getAddress())
            ->setLatitude(!empty($data['latitude']) ? $data['latitude'] : null)
            ->setLongitude(!empty($data['longitude']) ? $data['longitude'] : null)
            ->setPrice($data['price'] ?? $service->getPrice())
            ->setPriceType($data['priceType'] ?? $service->getPriceType())
            ->setModalities($data['modalities'] ?? $service->getModalities())
            ->setAvailabilityDays($data['availabilityDays'] ?? $service->getAvailabilityDays());

        // Manejar fotos
        if (!empty($data['remove_photo_ids'])) {
            foreach ($service->getPhotos() as $photo) {
                if (in_array($photo->getId(), $data['remove_photo_ids'])) {
                    $em->remove($photo);
                }
            }
        }

        $em->flush();

        return $this->json(['message' => 'Servicio actualizado con éxito']);
    }

    #[Route('/delete/{id}', name: 'service_delete', methods: ['DELETE'])]
    public function delete(ServiceRepository $serviceRepository, EntityManagerInterface $em, int $id): JsonResponse
    {
        $service = $serviceRepository->find($id);

        if (!$service) {
            return $this->json(['error' => 'Servicio no encontrado'], 404);
        }

        $service->setIsActive(false);
        $em->flush();

        return $this->json(['message' => 'Servicio desactivado con éxito']);
    }

    #[Route('/markers', name: 'service_markers', methods: ['GET'])]
    public function getServiceMarkers(ServiceRepository $serviceRepository): JsonResponse
    {
        try {
            // Obtener todos los servicios activos con marcadores
            $services = $serviceRepository->createQueryBuilder('s')
                ->leftJoin('s.marker', 'm')
                ->where('s.isActive = :active')
                ->andWhere('m.id IS NOT NULL')
                ->setParameter('active', true)
                ->getQuery()
                ->getResult();

            $markers = [];
            foreach ($services as $service) {
                $marker = $service->getMarker();
                if ($marker) {
                    $markers[] = [
                        'id' => $marker->getId(),
                        'name' => $marker->getName(),
                        'description' => $marker->getDescription(),
                        'address' => $marker->getAddress(),
                        'lat' => $marker->getLat(),
                        'lng' => $marker->getLng(),
                        'service_id' => $service->getId(),
                        'service_name' => $service->getServiceName(),
                        'category' => $service->getCategory(),
                        'price' => $service->getPrice(),
                        'price_type' => $service->getPriceType(),
                        'photos' => array_map(fn($photo) => $this->getPresignedUrl($photo->getUrl()), $service->getPhotos()->toArray())
                    ];
                }
            }

            return $this->json([
                'success' => true,
                'data' => $markers
            ]);

        } catch (\Exception $e) {
            error_log('Error al obtener marcadores de servicios: ' . $e->getMessage());
            return $this->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    /**
     * Proxy para imágenes de servicios con cache
     */
    #[Route('/proxy-image/{path}', name: 'service_proxy_image', methods: ['GET'], requirements: ['path' => '.+'])]
    public function proxyImage(Request $request, string $path): Response
    {
        try {
            $bucket = 'servicios';
            $decodedPath = urldecode($path);
            $cacheDir = '/var/cache/images/services';
            $cachePath = $cacheDir . '/' . md5($decodedPath) . '.jpg';

            // 1️⃣ Si existe en cache, servir directo
            if (file_exists($cachePath) && filemtime($cachePath) > (time() - 86400)) { // Cache válido por 24 horas
                error_log("🟢 Sirviendo imagen de servicio desde cache: " . basename($cachePath));
                return new Response(file_get_contents($cachePath), 200, [
                    'Content-Type' => 'image/jpeg',
                    'Cache-Control' => 'public, max-age=86400',
                    'X-Cache-Status' => 'HIT',
                ]);
            }

            // 2️⃣ Si no existe o está expirado, traer desde MinIO
            error_log("🔄 Descargando imagen de servicio desde MinIO: " . $decodedPath);
            
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
            file_put_contents($cachePath, $result['Body']);
            error_log("💾 Imagen de servicio guardada en cache: " . basename($cachePath));

            // 4️⃣ Servir respuesta
            $response = new StreamedResponse();
            $response->setCallback(function () use ($result) {
                echo $result['Body'];
            });
            $response->headers->set('Content-Type', $result['ContentType'] ?? 'image/jpeg');
            $response->headers->set('Cache-Control', 'public, max-age=86400');
            $response->headers->set('X-Cache-Status', 'MISS');

            return $response;

        } catch (\Exception $e) {
            error_log("❌ Error en proxy de servicio: " . $e->getMessage());
            return new Response('Imagen de servicio no encontrada: ' . $e->getMessage(), 404);
        }
    }

    /**
     * Subir imagen temporal de servicio desde el celular
     */
    #[Route('/upload-temp', name: 'service_upload_temp', methods: ['POST'])]
    public function uploadTemp(Request $request): JsonResponse
    {
        try {
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

            $tempDir = '/var/uploads/temp/services';
            if (!is_dir($tempDir)) {
                mkdir($tempDir, 0777, true);
            }

            // Generar nombre único para el archivo temporal
            $filename = 'temp_service_' . uniqid() . '_' . time() . '.' . $file->guessExtension();
            $filePath = $tempDir . '/' . $filename;
            
            // Mover archivo a directorio temporal
            $file->move($tempDir, $filename);

            error_log("📱 Imagen temporal de servicio guardada desde celular: " . $filename);

            return $this->json([
                'success' => true,
                'temp_filename' => $filename,
                'message' => 'Imagen de servicio guardada temporalmente. Se sincronizará con MinIO automáticamente.',
                'sync_status' => 'pending'
            ]);

        } catch (\Exception $e) {
            error_log("❌ Error en upload temporal de servicio: " . $e->getMessage());
            return $this->json(['error' => 'Error al subir archivo: ' . $e->getMessage()], 500);
        }
    }

    private function serializeService(Service $service): array
    {
        return [
            'id' => $service->getId(),
            'serviceName' => $service->getServiceName(),
            'description' => $service->getDescription(),
            'category' => $service->getCategory(),
            'address' => $service->getAddress(),
            'latitude' => $service->getLatitude(),
            'longitude' => $service->getLongitude(),
            'price' => $service->getPrice(),
            'priceType' => $service->getPriceType(),
            'modalities' => $service->getModalities(),
            'availabilityDays' => $service->getAvailabilityDays(),
            'photos' => array_map(fn($photo) => $this->getPresignedUrl($photo->getUrl()), $service->getPhotos()->toArray()),
            'createdAt' => $service->getCreatedAt()->format('Y-m-d H:i:s'),
            'provider' => [
                'id' => $service->getProvider()->getId(),
                'name' => $service->getProvider()->getName(),
                'email' => $service->getProvider()->getEmail(),
            ]
        ];
    }

    private function uploadToMinio(UploadedFile $file, int $userId, int $serviceId): string
    {
        $bucket = 'servicios';
        $key = "services/{$userId}/{$serviceId}/" . uniqid() . '.' . $file->guessExtension();

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

        // Subir archivo
        $s3->putObject([
            'Bucket' => $bucket,
            'Key' => $key,
            'Body' => fopen($file->getPathname(), 'rb'),
            'ContentType' => $file->getMimeType(),
        ]);

        // Guardar y devolver el key (la ruta dentro del bucket)
        return $key;
    }

    private function getPresignedUrl(string $key): string
    {
        $bucket = 'servicios';
        
        // Detectar si el request viene desde Cloudflare Tunnel (celular) o localhost (PC)
        $request = $this->container->get('request_stack')->getCurrentRequest();
        $host = $request ? $request->getHost() : '';
        $forwardedHost = $request ? $request->headers->get('X-Forwarded-Host') : '';
        $originalHost = $request ? $request->headers->get('Host') : '';
        
        // Si viene desde Cloudflare Tunnel, usar el proxy público
        if (str_contains($host, 'trycloudflare.com') || str_contains($forwardedHost, 'trycloudflare.com') || str_contains($originalHost, 'trycloudflare.com')) {
            $publicEndpoint = $_ENV['MINIO_PUBLIC_ENDPOINT'] ?? null;
            if ($publicEndpoint) {
                // Cambiar urlencode por rawurlencode para mantener las barras
                return $publicEndpoint . '/proxy-image/servicios/' . $key;
            }
        }
        
        // Para localhost: generar URL pre-firmada de MinIO directamente
        $s3 = new S3Client([
            'version' => 'latest',
            'region' => 'us-east-1',
            'endpoint' => 'http://localhost:9000',
            'use_path_style_endpoint' => true,
            'credentials' => [
                'key' => 'petmatch',
                'secret' => 'petmatch',
            ],
        ]);

        // Generar URL presignada válida por 1 hora
        $cmd = $s3->getCommand('GetObject', [
            'Bucket' => $bucket,
            'Key' => $key,
        ]);

        $request = $s3->createPresignedRequest($cmd, '+1 hour');
        return (string) $request->getUri();
    }

    private function geocodeAddress(string $address): ?array
    {
        try {
            $client = \Symfony\Component\HttpClient\HttpClient::create();
            
            // Usar la URL actual del request en lugar de localhost
            $request = $this->container->get('request_stack')->getCurrentRequest();
            $host = $request ? $request->getHost() : 'localhost:8000';
            $scheme = $request ? $request->getScheme() : 'http';
            $baseUrl = $scheme . '://' . $host;
            
            $response = $client->request('GET', $baseUrl . '/api/geocode', [
                'query' => ['address' => $address]
            ]);

            if ($response->getStatusCode() === 200) {
                $data = $response->toArray();
                if ($data['success'] && isset($data['data'])) {
                    return $data['data'];
                }
            }
        } catch (\Exception $e) {
            error_log("Error en geocodificación: " . $e->getMessage());
        }

        return null;
    }

    #[Route('/update-coordinates/{id}', name: 'update_service_coordinates', methods: ['POST'])]
    public function updateCoordinates(int $id, ServiceRepository $serviceRepository, EntityManagerInterface $em): JsonResponse
    {
        try {
            $service = $serviceRepository->find($id);
            
            if (!$service) {
                return $this->json(['error' => 'Servicio no encontrado'], 404);
            }
            
            if ($service->getLatitude() && $service->getLongitude()) {
                return $this->json(['message' => 'El servicio ya tiene coordenadas']);
            }
            
            if (!$service->getAddress()) {
                return $this->json(['error' => 'El servicio no tiene dirección']);
            }
            
            $geocodingResult = $this->geocodeAddress($service->getAddress());
            if ($geocodingResult) {
                $service->setLatitude($geocodingResult['lat']);
                $service->setLongitude($geocodingResult['lng']);
                $em->flush();
                
                return $this->json([
                    'message' => 'Coordenadas actualizadas exitosamente',
                    'service_id' => $id,
                    'address' => $service->getAddress(),
                    'coordinates' => [
                        'lat' => $geocodingResult['lat'],
                        'lng' => $geocodingResult['lng']
                    ]
                ]);
            } else {
                return $this->json(['error' => 'No se pudo geocodificar la dirección: ' . $service->getAddress()], 400);
            }
            
        } catch (\Exception $e) {
            error_log('Error al actualizar coordenadas: ' . $e->getMessage());
            return $this->json(['error' => 'Error interno del servidor: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/check-marker/{id}', name: 'check_service_marker', methods: ['GET'])]
    public function checkMarker(int $id, ServiceRepository $serviceRepository): JsonResponse
    {
        try {
            $service = $serviceRepository->find($id);
            
            if (!$service) {
                return $this->json(['error' => 'Servicio no encontrado'], 404);
            }
            
            $marker = $service->getMarker();
            
            return $this->json([
                'service_id' => $id,
                'service_name' => $service->getServiceName(),
                'has_coordinates' => $service->getLatitude() && $service->getLongitude(),
                'coordinates' => [
                    'lat' => $service->getLatitude(),
                    'lng' => $service->getLongitude()
                ],
                'has_marker' => $marker !== null,
                'marker_id' => $marker ? $marker->getId() : null,
                'marker_name' => $marker ? $marker->getName() : null
            ]);
            
        } catch (\Exception $e) {
            error_log('Error al verificar marcador: ' . $e->getMessage());
            return $this->json(['error' => 'Error interno del servidor: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/create-marker/{id}', name: 'create_service_marker', methods: ['POST'])]
    public function createMarker(int $id, ServiceRepository $serviceRepository, EntityManagerInterface $em): JsonResponse
    {
        try {
            $service = $serviceRepository->find($id);
            
            if (!$service) {
                return $this->json(['error' => 'Servicio no encontrado'], 404);
            }
            
            if ($service->getMarker()) {
                return $this->json(['message' => 'El servicio ya tiene marcador']);
            }
            
            if (!$service->getLatitude() || !$service->getLongitude()) {
                return $this->json(['error' => 'El servicio no tiene coordenadas']);
            }
            
            // Crear marcador
            $marker = new Marcador();
            $marker->setName($service->getServiceName())
                ->setDescription($service->getDescription())
                ->setAddress($service->getAddress())
                ->setLat((float) $service->getLatitude())
                ->setLng((float) $service->getLongitude())
                ->setActivo(true);
            
            $service->setMarker($marker);
            $em->persist($marker);
            $em->flush();
            
            return $this->json([
                'message' => 'Marcador creado exitosamente',
                'service_id' => $id,
                'marker_id' => $marker->getId(),
                'coordinates' => [
                    'lat' => $marker->getLat(),
                    'lng' => $marker->getLng()
                ]
            ]);
            
        } catch (\Exception $e) {
            error_log('Error al crear marcador: ' . $e->getMessage());
            return $this->json(['error' => 'Error interno del servidor: ' . $e->getMessage()], 500);
        }
    }
}