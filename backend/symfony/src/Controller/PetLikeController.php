<?php

namespace App\Controller;

use App\Entity\PetLike;
use App\Repository\PetLikeRepository;
use App\Repository\PetRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/adoptions')]
class PetLikeController extends AbstractController
{
    private EntityManagerInterface $em;
    private PetLikeRepository $petLikeRepository;
    private PetRepository $petRepository;
    private UserRepository $userRepository;

    public function __construct(EntityManagerInterface $em, PetLikeRepository $petLikeRepository, PetRepository $petRepository, UserRepository $userRepository)
    {
        $this->em = $em;
        $this->petLikeRepository = $petLikeRepository;
        $this->petRepository = $petRepository;
        $this->userRepository = $userRepository;
        
    }

    #[Route('/request', name: 'adoption_request', methods: ['POST'])]
    public function requestAdoption(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // Log de todo el payload
        error_log('📥 Payload recibido: ' . json_encode($data));

        $petId = $data['pet_id'] ?? null;
        $userId = $data['user_id'] ?? null;

        error_log("🐾 Pet ID recibido: " . var_export($petId, true));
        error_log("👤 User ID recibido: " . var_export($userId, true));

        if (!$petId) {
            error_log("❌ Faltó el Pet ID");
            return $this->json(['error' => 'Pet ID is required'], 400);
        }

        if (!$userId) {
            error_log("❌ Faltó el User ID");
            return $this->json(['error' => 'User ID is required'], 400);
        }

        // Buscar usuario por ID
        $user = $this->userRepository->find($userId);
        error_log("🔍 Usuario encontrado: " . ($user ? $user->getId() : 'no encontrado'));
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        // Buscar mascota
        $pet = $this->petRepository->find($petId);
        error_log("🔍 Mascota encontrada: " . ($pet ? $pet->getId() : 'no encontrada'));
        if (!$pet) {
            return $this->json(['error' => 'Pet not found'], 404);
        }

        // Verificar si ya existe solicitud
        $existing = $this->petLikeRepository->findOneBy([
            'pet' => $pet,
            'interestedUser' => $user,
        ]);
        error_log("✅ Solicitud existente: " . ($existing ? 'sí' : 'no'));

        if ($existing) {
            return $this->json(['message' => 'Request already sent'], 409);
        }

        // Crear nueva solicitud
        $petLike = new PetLike();
        $petLike->setPet($pet);
        $petLike->setInterestedUser($user);
        $petLike->setStatus('pending');
        $petLike->setCreatedAt(new \DateTime());

        $this->em->persist($petLike);
        $this->em->flush();

        error_log("🎉 Nueva solicitud creada para Pet ID $petId y User ID $userId");

        return $this->json(['message' => 'Request sent']);
    }


    /**
     * GET /api/adoptions/notifications
     * El dueño ve las solicitudes pendientes para sus mascotas
     */
    #[Route('/notifications', name: 'adoption_notifications', methods: ['GET'])]
    public function getPendingNotifications(): JsonResponse
    {
        $user = $this->getUser();

        $pendingRequests = $this->petLikeRepository->findPendingByOwner($user);

        $data = [];
        foreach ($pendingRequests as $request) {
            $data[] = [
                'like_id' => $request->getId(),
                'pet_id' => $request->getPet()->getId(),
                'pet_name' => $request->getPet()->getName(),
                'interested_user_id' => $request->getInterestedUser()->getId(),
                'interested_user_name' => $request->getInterestedUser()->getName(),
                'created_at' => $request->getCreatedAt()->format('Y-m-d H:i:s'),
            ];
        }

        return $this->json($data);
    }

    /**
     * PATCH /api/adoptions/respond/{id}
     * El dueño acepta o rechaza una solicitud de adopción
     */
    #[Route('/respond/{id}', name: 'adoption_respond', methods: ['PATCH'])]
    public function respondToAdoption(int $id, Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $response = $data['response'] ?? null;

        if (!in_array($response, ['accepted', 'rejected'])) {
            return $this->json(['error' => 'Invalid response value'], 400);
        }

        $petLike = $this->petLikeRepository->find($id);
        if (!$petLike) {
            return $this->json(['error' => 'Request not found'], 404);
        }

        $owner = $petLike->getPet()->getUser();
        if ($this->getUser()->getId() !== $owner->getId()) {
            return $this->json(['error' => 'Forbidden'], 403);
        }

        $petLike->setStatus($response);
        $this->em->flush();

        return $this->json(['message' => 'Response saved']);
    }

    /**
     * GET /api/adoptions/matches
     * Usuario interesado ve sus matches aceptados
     */
    #[Route('/matches', name: 'adoption_matches', methods: ['GET'])]
    public function getMatches(): JsonResponse
    {
        $user = $this->getUser();

        $matches = $this->petLikeRepository->findAcceptedByInterestedUser($user);

        $data = [];
        foreach ($matches as $match) {
            $data[] = [
                'pet_id' => $match->getPet()->getId(),
                'pet_name' => $match->getPet()->getName(),
                'owner_id' => $match->getPet()->getUser()->getId(),
                'owner_name' => $match->getPet()->getUser()->getName(),
                'matched_at' => $match->getCreatedAt()->format('Y-m-d H:i:s'),
            ];
        }

        return $this->json($data);
    }
}
