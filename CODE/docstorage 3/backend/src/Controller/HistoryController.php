<?php

namespace App\Controller;

use App\Entity\ViewHistory;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/history')]
class HistoryController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function list(EntityManagerInterface $em): JsonResponse
    {
        $items = $em->getRepository(ViewHistory::class)->findBy(
            ['user' => $this->getUser()],
            ['viewedAt' => 'DESC'],
            50
        );

        return new JsonResponse(array_map(
            fn ($h) => [
                'docId' => $h->getDocId(),
                'docTitle' => $h->getDocTitle(),
                'docSource' => $h->getDocSource(),
                'viewedAt' => $h->getViewedAt()->format('c'),
            ],
            $items
        ));
    }

    #[Route('', methods: ['POST'])]
    public function add(Request $req, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($req->getContent(), true);
        $h = new ViewHistory();
        $h->setUser($this->getUser())
            ->setDocId((string) $data['docId'])
            ->setDocTitle($data['docTitle'] ?? null)
            ->setDocSource($data['docSource'] ?? null);
        $em->persist($h);
        $em->flush();

        return new JsonResponse(null, 201);
    }

    #[Route('', methods: ['DELETE'])]
    public function clear(EntityManagerInterface $em): JsonResponse
    {
        $items = $em->getRepository(ViewHistory::class)->findBy(['user' => $this->getUser()]);
        foreach ($items as $item) {
            $em->remove($item);
        }
        $em->flush();

        return new JsonResponse(null, 204);
    }
}
