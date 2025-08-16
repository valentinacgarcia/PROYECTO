<?php

namespace App\Controller;

use App\Entity\AdoptionRequest;
use App\Entity\User;
use App\Enum\RequestStatus;
use App\Enum\SleepingLocation;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use App\Repository\AdoptionRequestRepository;
use App\Repository\UserRepository;

#[Route('/adoption', name: 'adoption_')]
class AdoptionRequestController extends AbstractController
{
    #[Route('/submit', name: 'submit', methods: ['POST'])]
    public function submit(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data || !isset($data['usuario']['id'])) {
            return $this->json(['error' => 'Invalid request'], 400);
        }

        $userId = $data['usuario']['id'];
        $user = $em->getRepository(User::class)->find($userId);

        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        // Mapear los datos del formulario a los parámetros del constructor
        $adoptionRequest = new AdoptionRequest(
            $user,
            (bool)($data['situacionHabitacional']['isHouse'] ?? false),
            (bool)($data['situacionHabitacional']['isOwner'] ?? false),
            (bool)($data['situacionHabitacional']['hasYard'] ?? false),
            (bool)($data['situacionHabitacional']['hasSecurity'] ?? false),
            (int)($data['composicionHogar']['householdMembers'] ?? 0),
            (bool)($data['composicionHogar']['hasChildren'] ?? false),
            (bool)($data['composicionHogar']['hasAllergies'] ?? false),
            (bool)($data['composicionHogar']['adoptionAgreement'] ?? false),
            (bool)($data['experienciaAnimales']['hadPetsBefore'] ?? false),
            (bool)($data['experienciaAnimales']['hasCurrentPets'] ?? false),
            (int)($data['cuidadosRutina']['hoursAlonePerDay'] ?? 0),
            SleepingLocation::from($data['cuidadosRutina']['sleepingLocation'] ?? 'INSIDE'),
            (string)($data['cuidadosRutina']['caretaker'] ?? ''),
            (bool)($data['cuidadosRutina']['willNeuterVaccinate'] ?? false),
            $data['experienciaAnimales']['hasCurrentPets'] ? (bool)($data['experienciaAnimales']['petsVaccinated'] ?? false) : null,
            $data['notes'] ?? null
        );

        $em->persist($adoptionRequest);
        $em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Adoption request saved',
            'requestId' => $adoptionRequest->getId()
        ]);
    }

    #[Route('/check-form/{userId}', name: 'check_adoption_form', methods: ['GET'])]
    public function checkAdoptionForm(
        AdoptionRequestRepository $adoptionRequestRepository,
        UserRepository $userRepository,
        int $userId
    ): JsonResponse {
        // Buscar el usuario
        $user = $userRepository->find($userId);
        
        if (!$user) {
            return $this->json(['error' => 'Usuario no encontrado'], 404);
        }

        // Buscar solicitud de adopción para este usuario
        $adoptionRequest = $adoptionRequestRepository->findOneByUser($user);

        return $this->json([
            'has_form' => $adoptionRequest !== null,
            'request_id' => $adoptionRequest ? $adoptionRequest->getId() : null
        ]);
    }

}