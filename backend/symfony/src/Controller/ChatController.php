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
                'imageUrl' => $msg->getImageUrl(), // Si tiene imagen
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

        $this->em->persist($message);
        $this->em->flush();

        return $this->json([
            'messageId' => $message->getId(),
            'senderId' => $sender->getId(),
            'content' => $content,
            'createdAt' => $message->getCreatedAt()->format('Y-m-d H:i:s')
        ]);
    }


}
