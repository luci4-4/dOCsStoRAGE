<?php

namespace App\Controller;

use App\Entity\DocSource;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[Route('/api/sources')]
class SourceController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function list(EntityManagerInterface $em): JsonResponse
    {
        $sources = $em->getRepository(DocSource::class)->findAll();

        return new JsonResponse(array_map(
            fn ($s) => [
                'id' => $s->getId(),
                'name' => $s->getName(),
                'url' => $s->getUrl(),
                'type' => $s->getType(),
                'status' => $s->getStatus(),
            ],
            $sources
        ));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $req, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($req->getContent(), true);
        $s = new DocSource();
        $s->setName($data['name'])
            ->setUrl($data['url'])
            ->setType($data['type'] ?? 'docs');
        $em->persist($s);
        $em->flush();

        return new JsonResponse(['id' => $s->getId()], 201);
    }

    #[Route('/{id}/reindex', methods: ['POST'])]
    public function reindex(int $id, EntityManagerInterface $em, HttpClientInterface $http): JsonResponse
    {
        $src = $em->getRepository(DocSource::class)->find($id);
        if (!$src) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }
        try {
            $http->request('POST', ($_ENV['SCRAPER_URL'] ?? 'http://scraper:8001') . '/scrape', [
                'json' => ['url' => $src->getUrl(), 'source' => $src->getName()],
            ]);
        } catch (\Throwable) {
        }

        return new JsonResponse(['message' => 'Reindex started']);
    }
}
