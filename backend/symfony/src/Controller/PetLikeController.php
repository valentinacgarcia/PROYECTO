<?php

namespace App\Controller;

use App\Entity\PetLike;
use App\Entity\Chat;
use App\Repository\PetLikeRepository;
use App\Repository\PetRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use App\Enum\RequestStatus;
use App\Repository\ChatRepository;


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
     * El dueño ve TODAS las solicitudes para sus mascotas (pendientes, aprobadas)
     */
    #[Route('/notifications/{userId}', name: 'adoption_notifications', methods: ['GET'])]
    public function getPendingNotifications(string $userId): JsonResponse
    {
        $user = $this->userRepository->find($userId);

        $pendingRequests = $this->petLikeRepository->findAllByOwner($user);

        $data = [];
        foreach ($pendingRequests as $request) {
            $data[] = [
                'petition_id' => $request->getId(),
                'pet_name' => $request->getPet()->getName(),
                'pet_type' => $request->getPet()->getType(),
                'interested_user_name' => $request->getInterestedUser()->getName(),
                'interested_user_email' => $request->getInterestedUser()->getEmail(),
                'interested_user_id' => $request->getInterestedUser()->getId(),
                'status' => $request->getStatus()
            ];
        }

        return $this->json($data);
    }

    /**
     * El interesado ve su notificacion de match
     */
    #[Route('/notifications/match/{userId}', name: 'adoption_notifications_match', methods: ['GET'])]
    public function getApprovedNotifications(string $userId): JsonResponse
    {
        $user = $this->userRepository->find($userId);

        $approvedRequests = $this->petLikeRepository->findAcceptedByInterestedUser($user);

        $data = [];
        foreach ($approvedRequests as $request) {
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
    public function updateStatus(
        int $id, 
        Request $request, 
        PetLikeRepository $repo, 
        EntityManagerInterface $em,
        ChatRepository $chatRepo
    )
    {
        $adoption = $repo->find($id);
        if (!$adoption) return $this->json(['error' => 'Postulación no encontrada'], 404);

        $data = json_decode($request->getContent(), true);
        $status = $data['status'] ?? null;
        if (!in_array($status, ['approved', 'rejected'])) return $this->json(['error' => 'Estado inválido'], 400);

        $adoption->setStatus($status === 'approved' ? RequestStatus::APPROVED->value : RequestStatus::REJECTED->value);
        $em->flush();

        // ✅ Si se aprueba, crear chat automáticamente
        if ($status === 'approved') {
            $ownerUser = $adoption->getPet()->getOwner();
            $interestedUser = $adoption->getInterestedUser();

            // Evitar duplicados: verificar si ya existe chat entre estos dos usuarios
            $existingChat = $chatRepo->findOneBy([
                'ownerUser' => $ownerUser,
                'interestedUser' => $interestedUser,
                'petName' => $adoption->getPet()->getName()
            ]);

            if (!$existingChat) {
                $chat = new Chat();
                $chat->setOwnerUser($ownerUser);
                $chat->setInterestedUser($interestedUser);
                $chat->setPetName($adoption->getPet()->getName());
                $chat->setCreatedAt(new \DateTime());

                $em->persist($chat);
                $em->flush();
            }
        }

        return $this->json(['success' => true, 'status' => $adoption->getStatus()]);
    }

    #[Route('/chat/find', name: 'find_chat', methods: ['GET'])]
    public function findChat(Request $request, ChatRepository $chatRepo): JsonResponse
    {
        $interestedUserId = $request->query->get('interested_user_id');
        $petName = $request->query->get('pet_name');
        
        if (!$interestedUserId || !$petName) {
            return $this->json(['error' => 'Missing parameters'], 400);
        }
        
        $interestedUser = $this->userRepository->find($interestedUserId);
        if (!$interestedUser) {
            return $this->json(['error' => 'User not found'], 404);
        }
        
        $chat = $chatRepo->findOneBy([
            'interestedUser' => $interestedUser,
            'petName' => $petName
        ]);
        
        if (!$chat) {
            return $this->json(['error' => 'Chat not found'], 404);
        }
        
        return $this->json([
            'chat_id' => $chat->getId(),
            'pet_name' => $chat->getPetName(),
            'owner_name' => $chat->getOwnerUser()->getName(),
            'interested_name' => $chat->getInterestedUser()->getName()
        ]);
    }
}
