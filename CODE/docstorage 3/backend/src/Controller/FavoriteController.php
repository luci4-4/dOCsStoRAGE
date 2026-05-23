<?php

namespace App\Controller;

use App\Entity\Favorite;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/favorites')]
class FavoriteController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function list(EntityManagerInterface $em): JsonResponse
    {
        $favs = $em->getRepository(Favorite::class)->findBy(
            ['user' => $this->getUser()],
            ['createdAt' => 'DESC']
        );

        return new JsonResponse(array_map(
            fn ($f) => [
                'id' => $f->getId(),
                'docId' => $f->getDocId(),
                'docTitle' => $f->getDocTitle(),
                'docSource' => $f->getDocSource(),
            ],
            $favs
        ));
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $req, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($req->getContent(), true);
        $fav = new Favorite();
        $fav->setUser($this->getUser())
            ->setDocId((string) $data['docId'])
            ->setDocTitle($data['docTitle'] ?? null)
            ->setDocSource($data['docSource'] ?? null);
        $em->persist($fav);
        $em->flush();

        return new JsonResponse(['id' => $fav->getId()], 201);
    }

    #[Route('/{docId}', methods: ['DELETE'])]
    public function delete(string $docId, EntityManagerInterface $em): JsonResponse
    {
        $fav = $em->getRepository(Favorite::class)->findOneBy([
            'docId' => $docId,
            'user' => $this->getUser(),
        ]);
        if ($fav) {
            $em->remove($fav);
            $em->flush();
        }

        return new JsonResponse(null, 204);
    }
}
