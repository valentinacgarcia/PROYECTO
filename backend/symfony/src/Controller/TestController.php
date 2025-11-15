<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class TestController extends AbstractController
{
    #[Route('/api/test', name: 'test_api', methods: ['GET'])]
    public function test(): Response
    {
        return new Response('Test endpoint funcionando!', 200);
    }
}

