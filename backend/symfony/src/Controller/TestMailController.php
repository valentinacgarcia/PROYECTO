<?php

namespace App\Controller;

use App\Service\EmailService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class TestMailController extends AbstractController
{
    #[Route('/test-mail', name: 'test_mail')]
    public function testMail(EmailService $emailService): Response
    {
        // 🔹 Cambiá este correo por uno tuyo real para probar
        $emailService->sendMatchNotification('gaspariglesias93@gmail.com', 'Gaspar', 'Luna');
        
        return new Response('✅ Correo enviado correctamente');
    }
}
