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

        return $this->json($this->serializeService($service));
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

            $service = new Service();
            $service->setProvider($user)
                ->setServiceName($request->get('serviceName'))
                ->setDescription($request->get('description'))
                ->setCategory($request->get('category'))
                ->setAddress($request->get('address'))
                ->setLatitude($request->get('latitude'))
                ->setLongitude($request->get('longitude'))
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
            ->setLatitude($data['latitude'] ?? $service->getLatitude())
            ->setLongitude($data['longitude'] ?? $service->getLongitude())
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
}
