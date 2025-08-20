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
use App\Enum\RequestStatus;


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
    #[Route('/notifications/{userId}', name: 'adoption_notifications', methods: ['GET'])]
    public function getPendingNotifications(string $userId): JsonResponse
    {
        $user = $this->userRepository->find($userId);

        $pendingRequests = $this->petLikeRepository->findPendingByOwner($user);

        $data = [];
        foreach ($pendingRequests as $request) {
            $data[] = [
                'petition_id' => $request->getId(),
                'pet_name' => $request->getPet()->getName(),
                'interested_user_name' => $request->getInterestedUser()->getName(),
                'interested_user_id' => $request->getInterestedUser()->getId(),
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
                'petition_id' => $match->getId(),
                'pet_id' => $match->getPet()->getId(),
                'pet_name' => $match->getPet()->getName(),
                'owner_id' => $match->getPet()->getUser()->getId(),
                'owner_name' => $match->getPet()->getUser()->getName()
            ];
        }

        return $this->json($data);
    }

    #[Route('/status/{id}', name: 'update_adoption_status', methods: ['PUT'])]
    public function updateStatus(int $id, Request $request, PetLikeRepository $repo, EntityManagerInterface $em)
    {
        $adoption = $repo->find($id);
        if (!$adoption) return $this->json(['error' => 'Postulación no encontrada'], 404);

        $data = json_decode($request->getContent(), true);
        $status = $data['status'] ?? null;
        if (!in_array($status, ['approved', 'rejected'])) return $this->json(['error' => 'Estado inválido'], 400);

        $adoption->setStatus($status === 'approved' ? RequestStatus::APPROVED->value : RequestStatus::REJECTED->value);
        $em->flush();

        return $this->json(['success' => true, 'status' => $adoption->getStatus()]);
    }
}
