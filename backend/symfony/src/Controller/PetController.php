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
            ->setName($request->get('name'))
            ->setType($request->get('type'))
            ->setGender($request->get('gender'))
            ->setAgeYears((int)$request->get('age_years'))
            ->setAgeMonths((int)$request->get('age_months'))
            ->setSize($request->get('size'))
            ->setIsPurebred(filter_var($request->get('is_purebred'), FILTER_VALIDATE_BOOLEAN))
            ->setBreed($request->get('breed'))
            ->setColors(json_decode($request->get('colors'), true))
            ->setFurLength($request->get('fur_length'))
            ->setSterilized($request->get('sterilized'))
            ->setVaccinated($request->get('vaccinated'))
            ->setCompatibility(json_decode($request->get('compatibility'), true))
            ->setDescription($request->get('description'))
            ->setLocation($request->get('location'))
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

    private function getPresignedUrl(string $key): string
    {
        $bucket = 'mascotas';

        $s3 = new S3Client([
            'version' => 'latest',
            'region' => 'us-east-1',
            'endpoint' => 'http://localhost:9000', // ✅ Usar localhost directamente
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

    #[Route('/list-all', methods: ['GET'])]
    public function listAll(Request $request, PetRepository $petRepository): JsonResponse
    {
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
            'sterilized' => $pet->getSterilized() ? 'Sí' : 'No', // 🔧 Convertir a texto
            'vaccinated' => $pet->getVaccinated() ? 'Sí' : 'No', // 🔧 Convertir a texto
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
}