<?php

namespace App\Controller;

use App\Entity\Pet;
use App\Entity\Photo;
use App\Repository\PetRepository;
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

#[Route('/pet')]
class PetController extends AbstractController
{
    #[Route('/list/{userId}', name: 'pet_list', methods: ['GET'])]
    public function list(PetRepository $petRepository, UserRepository $userRepository, int $userId): JsonResponse
    {
        $user = $userRepository->find($userId);
        if (!$user) {
            return $this->json(['error' => 'Usuario no encontrado'], 404);
        }

        $pets = $petRepository->findBy(['owner' => $user]);
        $data = array_map(fn($pet) => $this->serializePet($pet), $pets);

        return $this->json($data);
    }

    #[Route('/detail/{id}', name: 'pet_detail', methods: ['GET'])]
    public function detail(PetRepository $petRepository, int $id): JsonResponse
    {
        $pet = $petRepository->find($id);

        if (!$pet) {
            return $this->json(['error' => 'Mascota inexistente'], 404);
        }

        return $this->json($this->serializePet($pet));
    }

    #[Route('/create', name: 'pet_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em, UserRepository $userRepository): JsonResponse
    {
        $userId = $request->get('owner_id');
        $user = $userRepository->find($userId);

        if (!$user) {
            return $this->json(['error' => 'Usuario no encontrado'], 404);
        }

        $pet = new Pet();
        $pet->setOwner($user)
            ->setName($request->get('name') ?: '')
            ->setType($request->get('type') ?: '')
            ->setGender($request->get('gender') ?: '')
            ->setAgeYears((int)$request->get('age_years'))
            ->setAgeMonths((int)$request->get('age_months'))
            ->setSize($request->get('size') ?: '')
            ->setIsPurebred(filter_var($request->get('is_purebred'), FILTER_VALIDATE_BOOLEAN))
            ->setBreed($request->get('breed') ?: '')
            ->setColors(json_decode($request->get('colors'), true) ?: [])
            ->setFurLength($request->get('fur_length') ?: '')
            ->setSterilized($request->get('sterilized') ?: '')
            ->setVaccinated($request->get('vaccinated') ?: '')
            ->setCompatibility(json_decode($request->get('compatibility'), true) ?: [])
            ->setDescription($request->get('description') ?: '')
            ->setLocation($request->get('location') ?: '')
            ->setIsAdopted(false);

        $em->persist($pet);
        $em->flush(); // Necesario para tener el ID del pet

        $files = $request->files->get('photos');
        if ($files) {
            foreach ($files as $file) {
                // Acá guardamos solo la "key" que devuelve uploadToMinio
                $fileKey = $this->uploadToMinio($file, $user->getId(), $pet->getId());
                $photo = new Photo();
                $photo->setUrl($fileKey)->setPet($pet);
                $em->persist($photo);
            }
        }

        $em->flush();

        return $this->json(['message' => 'Mascota creada con éxito', 'id' => $pet->getId()], 201);
    }

    /**
     * El dueño pasa a EN ADOPCION o la saca a su mascota
     */
    #[Route('/forAdoption/{petId}', name: 'for_adoption', methods: ['PUT'])]
    public function forAdoption(string $petId, Request $request, PetRepository $petRepository, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $pet = $petRepository->find($petId);
        if($data['for_adoption'] ==True){
            $pet->setIsAdopted(true);
            $em->flush();
            return $this->json(['message' => 'Pet marked for adoption']);
        }else{
            $pet->setIsAdopted(false);
            $em->flush();
            return $this->json(['message' => 'Pet marked as not for adoption']);
        }
    }

    #[Route('/edit/{id}', name: 'pet_edit', methods: ['PUT', 'POST'])]
    public function edit(Request $request, PetRepository $petRepository, EntityManagerInterface $em, int $id): JsonResponse
    {
        $pet = $petRepository->find($id);

        if (!$pet) {
            return $this->json(['error' => 'Mascota Inexistente'], 404);
        }

        // Para datos tipo application/json
        $data = json_decode($request->getContent(), true) ?? [];

        // Actualizar campos de texto
        $pet->setName($data['name'] ?? $pet->getName())
            ->setType($data['type'] ?? $pet->getType())
            ->setGender($data['gender'] ?? $pet->getGender())
            ->setAgeYears($data['age_years'] ?? $pet->getAgeYears())
            ->setAgeMonths($data['age_months'] ?? $pet->getAgeMonths())
            ->setSize($data['size'] ?? $pet->getSize())
            ->setIsPurebred($data['is_purebred'] ?? $pet->isPurebred())
            ->setBreed($data['breed'] ?? $pet->getBreed())
            ->setColors($data['colors'] ?? $pet->getColors())
            ->setFurLength($data['fur_length'] ?? $pet->getFurLength())
            ->setSterilized($data['sterilized'] ?? $pet->getSterilized())
            ->setVaccinated($data['vaccinated'] ?? $pet->getVaccinated())
            ->setCompatibility($data['compatibility'] ?? $pet->getCompatibility())
            ->setDescription($data['description'] ?? $pet->getDescription())
            ->setLocation($data['location'] ?? $pet->getLocation());

        // 1. Eliminar fotos
        if (!empty($data['remove_photo_ids'])) {
            foreach ($pet->getPhotos() as $photo) {
                if (in_array($photo->getId(), $data['remove_photo_ids'])) {
                    $em->remove($photo);
                }
            }
        }

        // 2. Agregar nuevas fotos si se subieron
        $files = $request->files->get('photos');
        if ($files) {
            foreach ($files as $file) {
                $fileUrl = $this->uploadToMinio($file, $pet->getOwner()->getId(), $pet->getId());
                $photo = new Photo();
                $photo->setUrl($fileUrl)->setPet($pet);
                $em->persist($photo);
            }
        }

        $em->flush();

        return $this->json(['message' => 'Mascota editada con éxito']);
    }

    #[Route('/delete/{id}', name: 'pet_delete', methods: ['DELETE'])]
    public function delete(PetRepository $petRepository, EntityManagerInterface $em, int $id): JsonResponse
    {
        $pet = $petRepository->find($id);

        if (!$pet) {
            return $this->json(['error' => 'Mascota Inexistente'], 404);
        }

        $em->remove($pet);
        $em->flush();

        return $this->json(['message' => 'Mascota eliminada con éxito']);
    }
    
    private function serializePet(Pet $pet): array
    {
        return $this->serializePetNormalized($pet);
    }

    private function uploadToMinio(UploadedFile $file, int $userId, int $petId): string
    {
        $bucket = 'mascotas';
        $key = "user_{$userId}/pet_{$petId}/" . uniqid() . '.' . $file->guessExtension();

        $s3 = new S3Client([
            'version' => 'latest',
            'region' => 'us-east-1',
            'endpoint' => $_ENV['MINIO_ENDPOINT'] ?? 'http://minio:9000', // ✅ Cambio principal
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


    #[Route('/list-all', methods: ['GET'])]
    public function listAll(Request $request, PetRepository $petRepository): JsonResponse
    {
        file_put_contents('/tmp/debug.log', "🚀 Iniciando listAll desde: " . $request->getHost() . "\n", FILE_APPEND);
        try {
            $filters = $this->extractFiltersFromRequest($request);
            
            // Obtener user_id del request
            $userId = $request->query->get('user_id');
            if ($userId !== null && $userId !== '' && $userId !== 'null') {
                $filters['exclude_user_id'] = (int) $userId;
            }
            
            $page = max(1, (int) $request->query->get('page', 1));
            $limit = max(1, min(50, (int) $request->query->get('limit', 12)));
            $result = $petRepository->findAvailableForAdoptionPaginated($filters, $page, $limit);

            // Normalizar datos antes de serializar
            $data = array_map(fn($pet) => $this->serializePetNormalized($pet), $result['pets']);

            $response = new JsonResponse([
                'success' => true,
                'data' => $data,
                'pagination' => [
                    'current_page' => $result['page'],
                    'total_pages' => $result['totalPages'],
                    'total_items' => $result['total'],
                    'items_per_page' => $result['limit'],
                    'has_next' => $result['hasNext'],
                    'has_previous' => $result['hasPrev'],
                ],
            ]);
            
            // Configurar el encoding para caracteres Unicode
            $response->setEncodingOptions(JSON_UNESCAPED_UNICODE);
            
            return $response;
            
        } catch (\Exception $e) {
            $errorResponse = new JsonResponse([
                'success' => false,
                'error' => 'Error al obtener las mascotas: ' . $e->getMessage(),
            ], 500);
            
            $errorResponse->setEncodingOptions(JSON_UNESCAPED_UNICODE);
            
            return $errorResponse;
        }
    }

    private function extractFiltersFromRequest(Request $request): array
    {
        $filters = [];
        $filterKeys = [
            'region', 'tipo', 'raza', 'genero', 'edad', 'tamaño', 'colors', 'largoPelaje', 'castrado', 'compatibilidad'
        ];

        foreach ($filterKeys as $key) {
            $value = $request->query->get($key);
            if ($value !== null && $value !== '') {
                if (is_string($value)) {
                    $decoded = json_decode($value, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                        $filters[$key] = $decoded;
                    } else {
                        $filters[$key] = [$value];
                    }
                } elseif (is_array($value)) {
                    $filters[$key] = $value;
                } else {
                    $filters[$key] = [$value];
                }
            }
        }

        return $filters;
    }

    private function serializePetNormalized(Pet $pet): array
    {
        error_log("🔄 Serializando mascota: " . $pet->getName());
        $photos = [];
        foreach ($pet->getPhotos() as $photo) {
            $photos[] = $this->getPresignedUrl($photo->getUrl());
        }

        return [
            'id' => $pet->getId(),
            'name' => $this->normalizeString($pet->getName()),
            'type' => strtolower($this->normalizeString($pet->getType())), // 🔧 En minúsculas para consistencia
            'gender' => $this->normalizeString($pet->getGender()),
            'age_years' => $pet->getAgeYears(),
            'age_months' => $pet->getAgeMonths(),
            'size' => $this->normalizeString($pet->getSize()), // 🔧 Normalizado
            'is_purebred' => $pet->isPurebred(),
            'breed' => $this->normalizeString($pet->getBreed()),
            'colors' => $pet->getColors() ? array_map([$this, 'normalizeString'], $pet->getColors()) : [], // 🔧 Normalizado
            'fur_length' => $this->normalizeString($pet->getFurLength()), // 🔧 Normalizado
            'sterilized' => $pet->getSterilized() ?: 'No', // 🔧 Usar valor directo de la BD
            'vaccinated' => $pet->getVaccinated() ?: 'No', // 🔧 Usar valor directo de la BD
            'compatibility' => $pet->getCompatibility() ?: [], // ✅ SIN normalizeString
            'description' => $this->normalizeString($pet->getDescription()),
            'location' => $this->normalizeString($pet->getLocation()),
            'is_adopted' => $pet->isAdopted(),
            'created_at' => $pet->getCreatedAt()->format('Y-m-d H:i:s'),
            'owner_id' => $pet->getOwner()?->getId(),
            'photos' => $photos,
        ];
    }
    
    private function normalizeString(?string $str): ?string
    {
        if (!$str) {
            return $str;
        }
        
        if (class_exists('Normalizer')) {
            $normalized = \Normalizer::normalize($str, \Normalizer::FORM_C);
            return $normalized ?: $str;
        }
     
        return mb_convert_encoding($str, 'UTF-8', 'UTF-8');
    }

   #[Route('/list-preferences/{userId}', methods: ['GET'])]
    public function findRecommendedForUser(
        int $userId,
        UserRepository $userRepository,
        EntityManagerInterface $em,
        PetRepository $petRepository,
        Request $request
    ): JsonResponse {
        $user = $userRepository->find($userId);
        if (!$user) {
            return $this->json(['error' => 'Usuario no encontrado'], 404);
        }

        $limit = max(1, (int) $request->query->get('limit', 10));

        // 1. AdoptionRequest del usuario
        $adoptionRequest = $em->getRepository(AdoptionRequest::class)
                            ->findOneBy(['user' => $user]);

        // 2. Historial de likes 
        $likes = $em->getRepository(PetLike::class)
                    ->createQueryBuilder('pl')
                    ->where('pl.interestedUser = :user')
                    ->setParameter('user', $user)
                    ->getQuery()
                    ->getResult();

        // 3. Generar perfil de keywords a partir de descripciones de mascotas que le gustaron
        $keywords = [];
        foreach ($likes as $like) {
            $desc = strtolower($like->getPet()->getDescription() ?? '');
            foreach (preg_split('/\W+/', $desc) as $word) {
                if (strlen($word) > 3) {
                    $keywords[$word] = ($keywords[$word] ?? 0) + 1;
                }
            }
        }

        // 4. Buscar mascotas candidatas (todas en adopción que no sean del mismo user)
        $qb = $petRepository->createQueryBuilder('p')
            ->andWhere('p.is_adopted = 1')
            ->andWhere('p.owner != :user')
            ->setParameter('user', $user);

        $pets = $qb->getQuery()->getResult();

        // 5. Scoring manual
        $scored = [];
        foreach ($pets as $pet) {
            $score = 0;

            // Reglas según AdoptionRequest
            if ($adoptionRequest) {
                if ($adoptionRequest->getHasChildren() && $pet->getCompatibility() && !in_array('niños', $pet->getCompatibility())) {
                    continue; 
                }
                if (!$adoptionRequest->getHasYard() && $pet->getSize() === 'grande') {
                    $score -= 20;
                }
            }

            // Match con keywords
            $desc = strtolower($pet->getDescription() ?? '');
            foreach (array_keys($keywords) as $kw) {
                if (str_contains($desc, $kw)) {
                    $score += $keywords[$kw];
                }
            }

            // Bonus por tipo/género según likes pasados
            foreach ($likes as $like) {
                if ($like->getPet()->getType() === $pet->getType()) {
                    $score += 5;
                }
            }

            $scored[] = ['pet' => $pet, 'score' => $score];
        }

        // 6. Ordenar y limitar
        usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);
        $scored = array_slice($scored, 0, $limit);

        // 7. Serializar
        $data = array_map(fn($row) => $this->serializePetNormalized($row['pet']), $scored);

        return $this->json(['success' => true, 'data' => $data]);
    }

    private function getPresignedUrl(string $key): string
    {
        $bucket = 'mascotas';
        
        // Detectar si el request viene desde Cloudflare Tunnel (celular) o localhost (PC)
        $request = $this->container->get('request_stack')->getCurrentRequest();
        $host = $request ? $request->getHost() : '';
        $forwardedHost = $request ? $request->headers->get('X-Forwarded-Host') : '';
        $originalHost = $request ? $request->headers->get('Host') : '';
        
        // Debug temporal
        file_put_contents('/tmp/debug.log', "🔍 Host detectado: " . $host . "\n", FILE_APPEND);
        file_put_contents('/tmp/debug.log', "🔍 X-Forwarded-Host: " . $forwardedHost . "\n", FILE_APPEND);
        file_put_contents('/tmp/debug.log', "🔍 Host header: " . $originalHost . "\n", FILE_APPEND);
        
        // Detectar Cloudflare por sus cabeceras características
        $isCloudflare = false;
        if ($request) {
            // Cloudflare agrega al menos una de estas cabeceras siempre
            $cfHeaders = [
                'CF-RAY',
                'CF-Connecting-IP',
                'CF-Visitor',
                'CF-IPCountry'
            ];
            foreach ($cfHeaders as $header) {
                if ($request->headers->has($header)) {
                    $isCloudflare = true;
                    file_put_contents('/tmp/debug.log', "✅ Detectado Cloudflare por cabecera: " . $header . "\n", FILE_APPEND);
                    break;
                }
            }
        }
        
        // Si viene desde Cloudflare Tunnel, usar el proxy público
        if ($isCloudflare) {
            file_put_contents('/tmp/debug.log', "✅ Detectado Cloudflare Tunnel, usando proxy\n", FILE_APPEND);
            $publicEndpoint = $_ENV['MINIO_PUBLIC_ENDPOINT'] ?? null;
            if ($publicEndpoint) {
                $url = $publicEndpoint . '/proxy-image/mascotas/' . $key;
                file_put_contents('/tmp/debug.log', "🔗 URL generada: " . $url . "\n", FILE_APPEND);
                return $url;
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

        $cmd = $s3->getCommand('GetObject', [
            'Bucket' => $bucket,
            'Key' => $key,
        ]);

        $request = $s3->createPresignedRequest($cmd, '+20 minutes');
        $presignedUrl = (string) $request->getUri();

        return $presignedUrl;
    }   

    #[Route('/proxy-image/{path}', name: 'proxy_image', methods: ['GET'], requirements: ['path' => '.+'])]
    public function proxyImage(Request $request, string $path): Response
    {
        try {
            $bucket = 'mascotas';
            $decodedPath = urldecode($path);
            $cacheDir = '/var/cache/images';
            $cachePath = $cacheDir . '/' . md5($decodedPath) . '.jpg';

            // 1️⃣ Si existe en cache, servir directo
            if (file_exists($cachePath) && filemtime($cachePath) > (time() - 86400)) { // Cache válido por 24 horas
                error_log("🟢 Sirviendo imagen desde cache: " . basename($cachePath));
                return new Response(file_get_contents($cachePath), 200, [
                    'Content-Type' => 'image/jpeg',
                    'Cache-Control' => 'public, max-age=86400',
                    'X-Cache-Status' => 'HIT',
                ]);
            }

            // 2️⃣ Si no existe o está expirado, traer desde MinIO
            error_log("🔄 Descargando imagen desde MinIO: " . $decodedPath);
            
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
            error_log("💾 Imagen guardada en cache: " . basename($cachePath));

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
            error_log("❌ Error en proxy: " . $e->getMessage());
            return new Response('Imagen no encontrada: ' . $e->getMessage(), 404);
        }
    }

    /**
     * Endpoint para subir imágenes temporalmente desde el celular
     * Las imágenes se guardan localmente y se sincronizan con MinIO después
     */
    #[Route('/upload-temp', name: 'upload_temp', methods: ['POST'])]
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

            $tempDir = '/var/uploads/temp';
            if (!is_dir($tempDir)) {
                mkdir($tempDir, 0777, true);
            }

            // Generar nombre único para el archivo temporal
            $filename = 'temp_' . uniqid() . '_' . time() . '.' . $file->guessExtension();
            $filePath = $tempDir . '/' . $filename;
            
            // Mover archivo a directorio temporal
            $file->move($tempDir, $filename);

            error_log("📱 Imagen temporal guardada desde celular: " . $filename);

            return $this->json([
                'success' => true,
                'temp_filename' => $filename,
                'message' => 'Imagen guardada temporalmente. Se sincronizará con MinIO automáticamente.',
                'sync_status' => 'pending'
            ]);

        } catch (\Exception $e) {
            error_log("❌ Error en upload temporal: " . $e->getMessage());
            return $this->json(['error' => 'Error al subir archivo: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Endpoint para verificar el estado de sincronización de imágenes temporales
     */
    #[Route('/sync-status/{filename}', name: 'sync_status', methods: ['GET'])]
    public function syncStatus(string $filename): JsonResponse
    {
        try {
            $tempDir = '/var/uploads/temp';
            $tempPath = $tempDir . '/' . $filename;
            
            if (!file_exists($tempPath)) {
                return $this->json([
                    'success' => true,
                    'sync_status' => 'completed',
                    'message' => 'Imagen ya sincronizada con MinIO'
                ]);
            }

            return $this->json([
                'success' => true,
                'sync_status' => 'pending',
                'message' => 'Imagen pendiente de sincronización'
            ]);

        } catch (\Exception $e) {
            return $this->json(['error' => 'Error al verificar estado: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Endpoint para obtener estadísticas del sistema de cache y sincronización
     */
    #[Route('/cache-stats', name: 'cache_stats', methods: ['GET'])]
    public function cacheStats(): JsonResponse
    {
        try {
            // Obtener estadísticas básicas del sistema
            $cacheDir = '/var/cache/images';
            $tempDir = '/var/uploads/temp';
            
            $stats = [
                'cache' => [
                    'files_count' => is_dir($cacheDir) ? count(glob($cacheDir . '/*.jpg')) : 0,
                    'size_mb' => 0,
                    'last_modified' => null,
                ],
                'temp_uploads' => [
                    'files_count' => is_dir($tempDir) ? count(glob($tempDir . '/temp_*')) : 0,
                    'files' => [],
                ],
                'system' => [
                    'timestamp' => date('Y-m-d H:i:s'),
                    'uptime' => $this->getSystemUptime(),
                ]
            ];

            // Calcular tamaño del cache
            if (is_dir($cacheDir)) {
                $cacheSize = 0;
                $lastModified = 0;
                foreach (glob($cacheDir . '/*.jpg') as $file) {
                    $cacheSize += filesize($file);
                    $lastModified = max($lastModified, filemtime($file));
                }
                $stats['cache']['size_mb'] = round($cacheSize / 1024 / 1024, 2);
                $stats['cache']['last_modified'] = $lastModified ? date('Y-m-d H:i:s', $lastModified) : null;
            }

            // Listar archivos temporales
            if (is_dir($tempDir)) {
                $tempFiles = glob($tempDir . '/temp_*');
                foreach ($tempFiles as $file) {
                    $stats['temp_uploads']['files'][] = [
                        'filename' => basename($file),
                        'size_mb' => round(filesize($file) / 1024 / 1024, 2),
                        'created' => date('Y-m-d H:i:s', filemtime($file)),
                    ];
                }
            }

            return $this->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return $this->json(['error' => 'Error al obtener estadísticas: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Endpoint para forzar sincronización manual
     */
    #[Route('/force-sync', name: 'force_sync', methods: ['POST'])]
    public function forceSync(): JsonResponse
    {
        try {
            // Ejecutar comando de sincronización
            $output = [];
            $returnCode = 0;
            
            exec('cd /var/www/backend/symfony && php bin/console app:sync-temp-images --full-sync 2>&1', $output, $returnCode);
            
            if ($returnCode === 0) {
                return $this->json([
                    'success' => true,
                    'message' => 'Sincronización ejecutada exitosamente',
                    'output' => implode("\n", $output)
                ]);
            } else {
                return $this->json([
                    'success' => false,
                    'error' => 'Error en sincronización',
                    'output' => implode("\n", $output)
                ], 500);
            }

        } catch (\Exception $e) {
            return $this->json(['error' => 'Error al ejecutar sincronización: ' . $e->getMessage()], 500);
        }
    }

    private function getSystemUptime(): string
    {
        try {
            $uptime = shell_exec('uptime -p 2>/dev/null || uptime 2>/dev/null || echo "N/A"');
            return trim($uptime) ?: 'N/A';
        } catch (\Exception $e) {
            return 'N/A';
        }
    }

}