<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

class SecurityController extends AbstractController
{
    #[Route('api/login_check', name: 'login_check', methods: ['POST'])]
    public function loginCheck(): JsonResponse
    {
        return new JsonResponse(['error' => 'Use POST with JSON credentials'], 400);
    }
}
