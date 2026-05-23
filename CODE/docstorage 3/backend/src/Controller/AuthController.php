<?php

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api')]
class AuthController extends AbstractController
{
    #[Route('/register', methods: ['POST'])]
    public function register(Request $req, EntityManagerInterface $em, UserPasswordHasherInterface $hasher): JsonResponse
    {
        $data = json_decode($req->getContent(), true);
        if (empty($data['username']) || empty($data['password']) || empty($data['email'])) {
            return new JsonResponse(['message' => 'Заполните все поля'], 400);
        }
        if ($em->getRepository(User::class)->findOneBy(['username' => $data['username']])) {
            return new JsonResponse(['message' => 'Логин уже занят'], 409);
        }
        $user = new User();
        $user->setUsername($data['username'])
            ->setEmail($data['email'])
            ->setPassword($hasher->hashPassword($user, $data['password']));
        $em->persist($user);
        $em->flush();

        return new JsonResponse(['message' => 'OK'], 201);
    }
}
