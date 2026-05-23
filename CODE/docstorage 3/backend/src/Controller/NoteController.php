<?php

namespace App\Controller;

use App\Entity\Note;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/notes')]
class NoteController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function list(EntityManagerInterface $em): JsonResponse
    {
        $notes = $em->getRepository(Note::class)->findBy(
            ['user' => $this->getUser()],
            ['updatedAt' => 'DESC']
        );

        return new JsonResponse(array_map(
            fn ($n) => [
                'id' => $n->getId(),
                'title' => $n->getTitle(),
                'content' => $n->getContent(),
                'createdAt' => $n->getCreatedAt()->format('c'),
                'updatedAt' => $n->getUpdatedAt()->format('c'),
            ],
            $notes
        ));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $req, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($req->getContent(), true);
        $note = new Note();
        $note->setUser($this->getUser())
            ->setTitle($data['title'] ?? '')
            ->setContent($data['content'] ?? null);
        $em->persist($note);
        $em->flush();

        return new JsonResponse(['id' => $note->getId()], 201);
    }

    #[Route('/{id}', methods: ['PUT'])]
    public function update(int $id, Request $req, EntityManagerInterface $em): JsonResponse
    {
        $note = $em->getRepository(Note::class)->findOneBy(['id' => $id, 'user' => $this->getUser()]);
        if (!$note) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }
        $data = json_decode($req->getContent(), true);
        $note->setTitle($data['title'] ?? $note->getTitle())
            ->setContent($data['content'] ?? $note->getContent())
            ->setUpdatedAt(new \DateTimeImmutable());
        $em->flush();

        return new JsonResponse(['id' => $note->getId()]);
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(int $id, EntityManagerInterface $em): JsonResponse
    {
        $note = $em->getRepository(Note::class)->findOneBy(['id' => $id, 'user' => $this->getUser()]);
        if (!$note) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }
        $em->remove($note);
        $em->flush();

        return new JsonResponse(null, 204);
    }
}
