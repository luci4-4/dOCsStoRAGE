<?php

namespace App\Controller;

use App\Entity\Tag;
use App\Service\TagService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/tags')]
class TagController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function list(TagService $tags): JsonResponse
    {
        return new JsonResponse($tags->listWithCounts());
    }

    #[Route('', methods: ['POST'])]
    #[IsGranted('ROLE_CONTENT_MANAGER')]
    public function create(Request $req, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($req->getContent(), true) ?: [];
        $name = trim((string) ($data['name'] ?? ''));
        if ($name === '') {
            return new JsonResponse(['error' => 'Название обязательно'], 400);
        }

        if ($em->getRepository(Tag::class)->findOneBy(['name' => $name])) {
            return new JsonResponse(['error' => 'Тег уже существует'], 409);
        }

        $tag = new Tag();
        $tag->setName($name);
        $em->persist($tag);
        $em->flush();

        return new JsonResponse(['id' => $tag->getId(), 'name' => $tag->getName(), 'docCount' => 0], 201);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    #[IsGranted('ROLE_CONTENT_MANAGER')]
    public function delete(int $id, EntityManagerInterface $em, TagService $tags): JsonResponse
    {
        $tag = $em->getRepository(Tag::class)->find($id);
        if (!$tag) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }

        $tags->removeTagFromAllDocs($tag);
        $em->remove($tag);
        $em->flush();

        return new JsonResponse(null, 204);
    }
}
