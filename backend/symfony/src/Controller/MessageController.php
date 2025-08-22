<?php

namespace App\Controller;

use App\Entity\Message;
use App\Entity\Chat;
use App\Repository\MessageRepository;
use App\Repository\ChatRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\HttpFoundation\File\Exception\FileException;

#[Route('/messages')]
class MessageController extends AbstractController
{
    private EntityManagerInterface $em;
    private MessageRepository $messageRepository;
    private ChatRepository $chatRepository;

    public function __construct(EntityManagerInterface $em, MessageRepository $messageRepository, ChatRepository $chatRepository)
    {
        $this->em = $em;
        $this->messageRepository = $messageRepository;
        $this->chatRepository = $chatRepository;
    }

    // Listar mensajes de un chat
    #[Route('/chat/{chatId}', name: 'messages_by_chat', methods: ['GET'])]
    public function getMessagesByChat(int $chatId): JsonResponse
    {
        $messages = $this->messageRepository->findByChatId($chatId);

        $data = array_map(fn($m) => [
            'id' => $m->getId(),
            'chatId' => $m->getChat()->getId(),
            'senderId' => $m->getSender()->getId(),
            'content' => $m->getContent(),
            'image' => $m->getImage(),
            'createdAt' => $m->getCreatedAt()->format('Y-m-d H:i:s')
        ], $messages);

        return $this->json($data);
    }

    // Crear mensaje (texto o foto)
    #[Route('/create', name: 'message_create', methods: ['POST'])]
    public function createMessage(Request $request): JsonResponse
    {
        $chatId = $request->request->get('chatId');
        $content = $request->request->get('content');
        $senderId = $request->request->get('senderId');
        $imageFile = $request->files->get('image');

        $chat = $this->chatRepository->find($chatId);
        $sender = $this->getDoctrine()->getRepository('App:User')->find($senderId);

        if (!$chat || !$sender) {
            return $this->json(['error' => 'Chat o usuario no encontrado'], 404);
        }

        $message = new Message();
        $message->setChat($chat);
        $message->setSender($sender);
        $message->setContent($content ?? null);

        if ($imageFile) {
            $uploadsDir = $this->getParameter('uploads_directory');
            $filename = uniqid() . '.' . $imageFile->guessExtension();
            try {
                $imageFile->move($uploadsDir, $filename);
                $message->setImage('/uploads/' . $filename);
            } catch (FileException $e) {
                return $this->json(['error' => 'Error subiendo la imagen'], 500);
            }
        }

        $this->em->persist($message);
        $this->em->flush();

        return $this->json(['success' => true, 'messageId' => $message->getId()]);
    }
}
