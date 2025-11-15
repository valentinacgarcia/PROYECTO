<?php

namespace App\Controller;

use App\Entity\Chat;
use App\Entity\User;
use App\Entity\Message;
use App\Repository\ChatRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Aws\S3\S3Client;


#[Route('/chats')]
class ChatController extends AbstractController
{
    private $em;
    private $chatRepository;

    public function __construct(EntityManagerInterface $em, ChatRepository $chatRepository)
    {
        $this->em = $em;
        $this->chatRepository = $chatRepository;
    }

    /**
     * Crea un chat entre owner e interested si no existe.
     * 
     * Ejemplo: POST /chats/create?ownerId=3&interestedId=7
     */
    #[Route('/create', name:'create_chat', methods:['POST'])]
    public function createChat(int $ownerId, int $interestedId): JsonResponse
    {
        $existing = $this->chatRepository->findChatBetweenUsers($ownerId, $interestedId);

        if ($existing) {
            return $this->json([
                'message' => 'Chat already exists',
                'chatId' => $existing->getId()
            ]);
        }

        $ownerUser = $this->em->getRepository(User::class)->find($ownerId);
        $interestedUser = $this->em->getRepository(User::class)->find($interestedId);

        if (!$ownerUser || !$interestedUser) {
            return $this->json(['error' => 'Invalid users'], 400);
        }

        $chat = new Chat();
        $chat->setOwnerUser($ownerUser);
        $chat->setInterestedUser($interestedUser);

        $this->em->persist($chat);
        $this->em->flush();

        return $this->json([
            'message' => 'Chat created successfully',
            'chatId' => $chat->getId()
        ]);
    }

    #[Route('/user/{userId}', name:'get_user_chats', methods:['GET'])]
    public function getUserChats(int $userId): JsonResponse
    {
        $chats = $this->chatRepository->createQueryBuilder('c')
            ->where('c.ownerUser = :user OR c.interestedUser = :user')
            ->setParameter('user', $userId)
            ->getQuery()
            ->getResult();

        $data = [];
        foreach ($chats as $chat) {
            $lastMessage = $chat->getMessages()->last(); // Asumiendo relación OneToMany ordenada por fecha
            $otherUser = $chat->getOwnerUser()->getId() === $userId ? $chat->getInterestedUser() : $chat->getOwnerUser();

            $data[] = [
                'id' => $chat->getId(),
                'otherUserId' => $otherUser->getId(),
                'otherUserName' => $otherUser->getName(),
                'lastMessage' => $lastMessage ? $lastMessage->getContent() : '',
                'lastMessageAt' => $lastMessage ? $lastMessage->getCreatedAt()->format('Y-m-d H:i:s') : null,
                'petName' => $chat->getPetName(),
                'petId' => $chat->getPetId()
            ];
        }

        return $this->json($data);
    }

    #[Route('/{chatId}/messages', name:'get_chat_messages', methods:['GET'])]
    public function getChatMessages(int $chatId): JsonResponse
    {
        $chat = $this->chatRepository->find($chatId);
        if (!$chat) return $this->json(['error' => 'Chat not found'], 404);

        $messages = $chat->getMessages(); // Asumiendo OneToMany ordenada por fecha
        $data = [];
        foreach ($messages as $msg) {
            $data[] = [
                'messageId' => $msg->getId(),
                'senderId' => $msg->getSender()->getId(),
                'senderName' => $msg->getSender()->getName(),
                'content' => $msg->getContent(),
                'fileUrl' => $msg->getImage() ? $this->getPresignedUrl($msg->getImage()) : null,
                'createdAt' => $msg->getCreatedAt()->format('Y-m-d H:i:s')
            ];
        }

        return $this->json($data);
    }



    #[Route('/{chatId}/message/send', name:'send_chat_message', methods:['POST'])]
    public function sendMessage(int $chatId, Request $request): JsonResponse
    {
        $chat = $this->chatRepository->find($chatId);
        if (!$chat) return $this->json(['error' => 'Chat not found'], 404);

        $userId = $request->request->get('senderId');
        $content = $request->request->get('content', '');
        $sender = $this->em->getRepository(User::class)->find($userId);

        if (!$sender) return $this->json(['error' => 'Invalid sender'], 400);

        $message = new Message();
        $message->setChat($chat);
        $message->setSender($sender);
        $message->setContent($content);
        $message->setCreatedAt(new \DateTime());

        // ✅ Manejo de archivo opcional (imagen adjunta)
        $file = $request->files->get('file'); 
        if ($file) {
            // Subir a MinIO
            $fileKey = $this->uploadToMinio($file, $sender->getId(), $chat->getId());
            $message->setImage($fileKey);
        }

        $this->em->persist($message);
        $this->em->flush();

        // ✅ Si tiene imagen, devolver URL presignada
        $imageUrl = null;
        if ($message->getImage()) {
            $imageUrl = $this->getPresignedUrl($message->getImage());
        }

        return $this->json([
            'messageId' => $message->getId(),
            'senderId' => $sender->getId(),
            'content' => $content,
            'image' => $imageUrl, 
            'createdAt' => $message->getCreatedAt()->format('Y-m-d H:i:s')
        ]);
    }

    private function uploadToMinio(UploadedFile $file, int $userId, int $chatId): string
    {
        $bucket = 'chats';

        $key = "chat_{$chatId}/user_{$userId}/" . uniqid() . '.' . $file->guessExtension();

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

        $s3->putObject([
            'Bucket' => $bucket,
            'Key' => $key,
            'Body' => fopen($file->getPathname(), 'rb'),
            'ContentType' => $file->getMimeType(),
        ]);

        return $key;
    }

    private function getPresignedUrl(string $key): string
    {
        $bucket = 'chats';
        
        // Detectar si el request viene desde Cloudflare Tunnel (celular) o localhost (PC)
        $request = $this->container->get('request_stack')->getCurrentRequest();
        $host = $request ? $request->getHost() : '';
        $forwardedHost = $request ? $request->headers->get('X-Forwarded-Host') : '';
        $originalHost = $request ? $request->headers->get('Host') : '';
        
        // Debug temporal
        error_log("🔍 Chat - Host detectado: " . $host);
        error_log("🔍 Chat - X-Forwarded-Host: " . $forwardedHost);
        error_log("🔍 Chat - Host header: " . $originalHost);
        
        // Si viene desde Cloudflare Tunnel, usar el proxy público
        if (str_contains($host, 'trycloudflare.com') || str_contains($forwardedHost, 'trycloudflare.com') || str_contains($originalHost, 'trycloudflare.com')) {
            $publicEndpoint = $_ENV['MINIO_PUBLIC_ENDPOINT'] ?? null;
            if ($publicEndpoint) {
                // Usar el proxy unificado para imágenes de chat
                return $publicEndpoint . '/proxy-image/chats/' . $key;
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

    /**
     * Subir imagen temporal de chat desde el celular
     */
    #[Route('/upload-temp', name: 'chat_upload_temp', methods: ['POST'])]
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

            $tempDir = '/var/uploads/temp/chats';
            if (!is_dir($tempDir)) {
                mkdir($tempDir, 0777, true);
            }

            // Generar nombre único para el archivo temporal
            $filename = 'temp_chat_' . uniqid() . '_' . time() . '.' . $file->guessExtension();
            $filePath = $tempDir . '/' . $filename;
            
            // Mover archivo a directorio temporal
            $file->move($tempDir, $filename);

            error_log("📱 Imagen temporal de chat guardada desde celular: " . $filename);

            return $this->json([
                'success' => true,
                'temp_filename' => $filename,
                'message' => 'Imagen de chat guardada temporalmente. Se sincronizará con MinIO automáticamente.',
                'sync_status' => 'pending'
            ]);

        } catch (\Exception $e) {
            error_log("❌ Error en upload temporal de chat: " . $e->getMessage());
            return $this->json(['error' => 'Error al subir archivo: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/{chatId}/users', name:'chat_users', methods:['POST'])]
    public function chatUsers(int $chatId): JsonResponse
    {
        $chat = $this->chatRepository->find($chatId);
        if (!$chat) return $this->json(['error' => 'Chat not found'], 404);

        $owner_id= $chat->getOwnerUser()->getId();
        $interested_id = $chat->getInterestedUser()->getId();

        return $this->json([
            'owner_id' => $owner_id,
            'interested_id' => $interested_id
        ]);
    }



}
