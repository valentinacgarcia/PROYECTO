<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/user')]
class UserController extends AbstractController
{
    #[Route('/list', name: 'user_list', methods: ['GET'])]
    public function list(UserRepository $userRepository): JsonResponse
    {
        $users = $userRepository->findAll();

        $data = array_map(fn(User $user) => [
            'id' => $user->getId(),
            'name' => $user->getName(),
            'last_name'=> $user->getLastName(),
            'email' => $user->getEmail(),
            'phone' => $user->getPhone(),
            'created_at' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
            'address' => $user->getAddress(),
        ], $users);

        return $this->json($data);
    }

    #[Route('/detail/{id}', name: 'user_detail', methods: ['GET'])]
    public function detail(UserRepository $userRepository, int $id): JsonResponse
    {
        $user = $userRepository->find($id);

        if (!$user) {
            return $this->json(['error' => 'Usuario Inexistente'], 404);
        }

        $data = [
            'id' => $user->getId(),
            'name' => $user->getName(),
            'last_name'=> $user->getLastName(),
            'email' => $user->getEmail(),
            'phone' => $user->getPhone(),
            'created_at' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
            'address' => $user->getAddress(),
        ];

        return $this->json($data);
    }
    
    #[Route('/sesion', name: 'user_login', methods: ['POST'])]
    public function login(UserRepository $userRepository, Request $request): JsonResponse
    {
        $dataSesion = json_decode($request->getContent(), true);

        $email = $dataSesion['email'] ?? null;
        $password = $dataSesion['password'] ?? null;

        if (!$email || !$password) {
            return $this->json(['error' => 'Faltan credenciales'], 400);
        }

        // Buscar usuario por email
        $user = $userRepository->findOneBy(['email' => $email]);

        if (!$user) {
            return $this->json(['error' => 'Usuario Inexistente'], 404);
        }

        // Aquí deberías comparar la contraseña con el hash guardado en la base
        // Pero asumiendo contraseña en texto plano (no recomendado)
        if ($user->getPassword() !== $password) {
            return $this->json(['error' => 'Credenciales no válidas'], 401);
        }

        $data = [
            'id' => $user->getId(),
            'name' => $user->getName(),
            'last_name'=> $user->getLastName(),
            'email' => $user->getEmail(),
            'phone' => $user->getPhone(),
            'created_at' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
            'address' => $user->getAddress(),
        ];

        return $this->json($data, 200);
    }

    #[Route('/create', name: 'user_create', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['name'], $data['email'], $data['password'])) {
            return $this->json(['error' => 'El campo name, email y password son obligatorios'], 400);
        }

        $user = new User();
        $user->setName($data['name']);
        $user->setLastName($data['last_name']);
        $user->setEmail($data['email']);
        $user->setPhone($data['phone'] ?? null);
        $user->setPassword($data['password']); 
        $user->setAddress($data['address']); 
        

        $em->persist($user);
        $em->flush();

        return $this->json(['message' => 'Usuario Creado', 'id' => $user->getId()], 201);
    }

    #[Route('/edit/{id}', name: 'user_edit', methods: ['PUT'])]
    public function edit(Request $request, UserRepository $userRepository, EntityManagerInterface $em, int $id): JsonResponse
    {
        $user = $userRepository->find($id);

        if (!$user) {
            return $this->json(['error' => 'Usuario Inexistente'], 404);
        }

        $data = json_decode($request->getContent(), true);

        $user->setName($data['name'] ?? $user->getName());
        $user->setLastName($data['last_name'] ?? $user->getLastName());
        $user->setEmail($data['email'] ?? $user->getEmail());
        $user->setPhone($data['phone'] ?? $user->getPhone());
        $user->setAddress($data['address'] ?? $user->getAddress());

        $em->flush();

        $dataResponse = [
            'id' => $user->getId(),
            'name' => $user->getName(),
            'last_name' => $user->getLastName(),
            'email' => $user->getEmail(),
            'phone' => $user->getPhone(),
            'address' => $user->getAddress(),
            'created_at' => $user->getCreatedAt()->format('Y-m-d H:i:s'),
        ];

        return $this->json($dataResponse, 200);
    }

    #[Route('/delete/{id}', name: 'user_delete', methods: ['DELETE'])]
    public function delete(UserRepository $userRepository, EntityManagerInterface $em, int $id): JsonResponse
    {
        $user = $userRepository->find($id);

        if (!$user) {
            return $this->json(['error' => 'Usuario Inexistente'], 404);
        }

        $em->remove($user);
        $em->flush();

        return $this->json(['message' => 'User eliminado con exito']);
    }
}
