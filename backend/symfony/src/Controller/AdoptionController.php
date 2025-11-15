<?php

namespace App\Controller;

use App\Entity\Adoption;
use App\Entity\Pet;
use App\Repository\AdoptionRepository;
use App\Repository\ChatRepository;
use App\Repository\UserRepository;
use App\Repository\PetRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use App\Service\EmailService;

#[Route('/adoption')]
class AdoptionController extends AbstractController
{
    private EntityManagerInterface $em;
    private AdoptionRepository $adoptionRepository;
    private ChatRepository $chatRepository;
    private UserRepository $userRepository;
    private PetRepository $petRepository;

    public function __construct(
        EntityManagerInterface $em,
        AdoptionRepository $adoptionRepository,
        ChatRepository $chatRepository,
        UserRepository $userRepository,
        PetRepository $petRepository
    ) {
        $this->em = $em;
        $this->adoptionRepository = $adoptionRepository;
        $this->chatRepository = $chatRepository;
        $this->userRepository = $userRepository;
        $this->petRepository = $petRepository;
    }

    /**
     * GET /adoption/status/{chatId}
     * Obtiene el estado de la adopción para un chat específico
     */
    #[Route('/status/{chatId}', name: 'adoption_status', methods: ['GET'])]
    public function getAdoptionStatus(int $chatId): JsonResponse
    {
        $chat = $this->chatRepository->find($chatId);
        if (!$chat) {
            return $this->json(['error' => 'Chat not found'], 404);
        }

        // Buscar si ya existe una adopción para este chat
        $adoption = $this->adoptionRepository->findOneBy([
            'user' => $chat->getInterestedUser(),
            'pet' => $this->petRepository->findOneBy(['name' => $chat->getPetName(), 'owner' => $chat->getOwnerUser()])
        ]);

        if (!$adoption) {
            return $this->json([
                'exists' => false,
                'state' => null,
                'canOwnerInitiate' => true,
                'canUserConfirm' => false
            ]);
        }

        return $this->json([
            'exists' => true,
            'state' => $adoption->getState(),
            'canOwnerInitiate' => false,
            'canUserConfirm' => $adoption->isPending(),
            'adoption_id' => $adoption->getId(),
            'created_at' => $adoption->getCreatedAt()?->format('Y-m-d H:i:s'),
            'adoption_date' => $adoption->getAdoptionDate()?->format('Y-m-d H:i:s')
        ]);
    }

    /**
     * POST /adoption/initiate
     * El owner inicia el proceso de adopción
     */
    #[Route('/initiate', name: 'adoption_initiate', methods: ['POST'])]
    public function initiateAdoption(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $chatId = $data['chat_id'] ?? null;

        if (!$chatId) {
            return $this->json(['error' => 'Chat ID is required'], 400);
        }

        $chat = $this->chatRepository->find($chatId);
        if (!$chat) {
            return $this->json(['error' => 'Chat not found'], 404);
        }

        // Verificar que el usuario actual sea el owner
        $currentUser = $data['owner_id'] ?? null;
        if (!$currentUser || $currentUser !== $chat->getOwnerUser()->getId()) {
            return $this->json(['error' => 'Only the pet owner can initiate adoption'], 403);
        }

        // Buscar la mascota por nombre y owner
        $pet = $this->petRepository->findOneBy([
            'name' => $chat->getPetName(),
            'owner' => $chat->getOwnerUser()
        ]);

        if (!$pet) {
            return $this->json(['error' => 'Pet not found'], 404);
        }

        // Verificar si ya existe una adopción
        $existingAdoption = $this->adoptionRepository->findOneBy([
            'user' => $chat->getInterestedUser(),
            'pet' => $pet
        ]);

        if ($existingAdoption) {
            return $this->json(['error' => 'Adoption already exists'], 409);
        }

        // Crear nueva adopción
        $adoption = new Adoption();
        $adoption->setUser($chat->getInterestedUser());
        $adoption->setPet($pet);
        $adoption->setState('pending');

        $this->em->persist($adoption);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'adoption_id' => $adoption->getId(),
            'message' => 'Adoption process initiated. Waiting for user confirmation.'
        ]);
    }

    /**
     * POST /adoption/confirm/{adoptionId}
     * El usuario interesado confirma la adopción
     */
    #[Route('/confirm/{adoptionId}', name: 'adoption_confirm', methods: ['POST'])]
public function confirmAdoption(
    int $adoptionId,
    Request $request,
    EmailService $emailService
): JsonResponse {
    $adoption = $this->adoptionRepository->find($adoptionId);
    if (!$adoption) {
        return $this->json(['error' => 'Adoption not found'], 404);
    }

    $data = json_decode($request->getContent(), true);

    // Verificar que el usuario actual sea el interesado
    $currentUser = $data['interested_id'] ?? null;
    if (!$currentUser || $currentUser !== $adoption->getUser()->getId()) {
        return $this->json(['error' => 'Only the interested user can confirm adoption'], 403);
    }

    // Verificar que esté en estado pending
    if (!$adoption->isPending()) {
        return $this->json(['error' => 'Adoption is not in pending state'], 400);
    }

    // pasar a waiting 
    $adoption->markAsWaiting();
    $this->em->flush();

    // MANDA MAILS
    $interested = $adoption->getUser();            // el que quiere adoptar
    $owner = $adoption->getPet()->getOwner();      // el dueño de la mascota
    $petName = $adoption->getPet()->getName();

    // Mail al interesado
    $emailService->sendAdoptionConfirmationToInterested(
        $interested->getEmail(),
        $interested->getName(),
        $petName
    );

    // Mail al dueño
    $emailService->sendAdoptionConfirmationToOwner(
        $owner->getEmail(),
        $owner->getName(),
        $petName,
        $interested->getName()
    );

    return $this->json([
        'success' => true,
        'message' => 'Adoption confirmed successfully!',
    ]);
}


    /**
     * POST /adoption/confirm/reception/{adoptionId}
     * El usuario interesado confirma la recepcion
     */
    #[Route('/confirm/reception/{adoptionId}', name: 'adoption_confirm_reception', methods: ['POST'])]
    public function confirmReception(
        int $adoptionId,
        Request $request,
        EmailService $emailService
    ): JsonResponse {
        $adoption = $this->adoptionRepository->find($adoptionId);
        if (!$adoption) {
            return $this->json(['error' => 'Adoption not found'], 404);
        }

        $data = json_decode($request->getContent(), true);

        // Verificar que el usuario actual sea el interesado
        $currentUser = $data['interested_id'] ?? null;
        if (!$currentUser || $currentUser !== $adoption->getUser()->getId()) {
            return $this->json(['error' => 'Only the interested user can confirm reception'], 403);
        }

        // Verificar que esté en estado waiting
        if (!$adoption->isWaiting()) {
            return $this->json(['error' => 'Adoption is not in waiting state'], 400);
        }

        // Guardar dueño original ANTES del cambio y asi poder mandar el mail
        $originalOwner = $adoption->getPet()->getOwner();

        // pasar a completed 
        $adoption->markAsCompleted();
        $adoption->getPet()->setOwner($adoption->getUser());
        $adoption->getPet()->setIsAdopted(false);
        $this->em->flush();

        //MAIL DE CONFIRMACION

        $interested = $adoption->getUser();           // adoptante
        $petName = $adoption->getPet()->getName();

        $emailService->sendConfirmationArrival(
            $originalOwner->getEmail(),
            $originalOwner->getName(),
            $petName,
            $interested->getName()
        );

        return $this->json([
            'success' => true,
            'message' => 'Reception confirmed successfully!',
            'adoption_date' => $adoption->getAdoptionDate()?->format('Y-m-d H:i:s')
        ]);
    }
}