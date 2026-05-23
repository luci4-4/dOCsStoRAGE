<?php

namespace App\Controller;

use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/profile')]
class ProfileController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function get(): JsonResponse
    {
        $u = $this->getUser();

        return new JsonResponse([
            'username' => $u->getUserIdentifier(),
            'displayName' => $u->getDisplayName(),
            'email' => $u->getEmail(),
            'roles' => $u->getRoles(),
            'preferredTechnologies' => $u->getPreferredTechnologies(),
        ]);
    }

    #[Route('', methods: ['PATCH'])]
    public function update(Request $req, EntityManagerInterface $em, UserPasswordHasherInterface $hasher): JsonResponse
    {
        $data = json_decode($req->getContent(), true);
        $u = $this->getUser();
        if (!empty($data['email'])) {
            $u->setEmail($data['email']);
        }
        if (array_key_exists('displayName', $data)) {
            $u->setDisplayName($data['displayName'] ?: null);
        }
        if (isset($data['preferredTechnologies']) && is_array($data['preferredTechnologies'])) {
            $u->setPreferredTechnologies(array_values($data['preferredTechnologies']));
        }
        if (!empty($data['newPassword']) && !empty($data['currentPassword'])) {
            if (!$hasher->isPasswordValid($u, $data['currentPassword'])) {
                return new JsonResponse(['message' => 'Неверный текущий пароль'], 400);
            }
            $u->setPassword($hasher->hashPassword($u, $data['newPassword']));
        }
        $em->flush();

        return new JsonResponse(['message' => 'OK']);
    }
}
