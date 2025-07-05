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
        $photos = [];
        foreach ($pet->getPhotos() as $photo) {
            // Opción 1: Usar presigned URLs (más seguro)
            $photos[] = $this->getPresignedUrl($photo->getUrl());
            
            // Opción 2: Usar URLs públicas directas (si el bucket es público)
            // $photos[] = $this->getPublicUrl($photo->getUrl());
        }

        return [
            'id' => $pet->getId(),
            'name' => $pet->getName(),
            'type' => $pet->getType(),
            'gender' => $pet->getGender(),
            'age_years' => $pet->getAgeYears(),
            'age_months' => $pet->getAgeMonths(),
            'size' => $pet->getSize(),
            'is_purebred' => $pet->isPurebred(),
            'breed' => $pet->getBreed(),
            'colors' => $pet->getColors(),
            'fur_length' => $pet->getFurLength(),
            'sterilized' => $pet->getSterilized(),
            'vaccinated' => $pet->getVaccinated(),
            'compatibility' => $pet->getCompatibility(),
            'description' => $pet->getDescription(),
            'location' => $pet->getLocation(),
            'is_adopted' => $pet->isAdopted(),
            'created_at' => $pet->getCreatedAt()->format('Y-m-d H:i:s'),
            'owner_id' => $pet->getOwner()?->getId(),
            'photos' => $photos,
        ];
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

        return $presignedUrl; // ✅ Sin reemplazar
    }

    /**
     * Método alternativo para URLs públicas directas
     * (solo funciona si el bucket tiene política pública)
     */
    private function getPublicUrl(string $key): string
    {
        return "http://localhost:9000/mascotas/{$key}";
    }
}