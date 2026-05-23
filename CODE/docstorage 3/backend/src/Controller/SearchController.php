<?php

namespace App\Controller;

use App\Entity\UserDocument;
use App\Service\MeilisearchService;
use App\Service\TagService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\User\UserInterface;

#[Route('/api')]
class SearchController extends AbstractController
{
    public function __construct(private MeilisearchService $meili)
    {
    }

    #[Route('/search', methods: ['GET'])]
    public function search(Request $req): JsonResponse
    {
        $q = $req->query->get('q', '');
        $lang = $req->query->get('lang');
        $tag = trim((string) $req->query->get('tag', ''));
        $mine = $req->query->getBoolean('mine');

        try {
            $this->meili->ensureUploadFilterable();
            $opts = [
                'limit' => 20,
                'attributesToHighlight' => ['title', 'content'],
                'highlightPreTag' => '<mark>',
                'highlightPostTag' => '</mark>',
            ];

            $filters = [];
            if ($lang) {
                $filters[] = 'language = "' . addslashes($lang) . '"';
            }
            if ($tag !== '') {
                $filters[] = 'tags = "' . addslashes($tag) . '"';
            }

            $user = $this->getUser();
            if ($mine && $user instanceof UserInterface) {
                $filters[] = 'docType = "upload" AND ownerId = "' . addslashes($user->getUserIdentifier()) . '"';
            } elseif ($user instanceof UserInterface) {
                $filters[] = '(docType != "upload" OR ownerId = "' . addslashes($user->getUserIdentifier()) . '")';
            } else {
                $filters[] = 'docType != "upload"';
            }

            if ($filters) {
                $opts['filter'] = implode(' AND ', $filters);
            }

            $result = $this->meili->docsIndex()->search($q, $opts);

            return new JsonResponse([
                'hits' => $result->getHits(),
                'total' => $result->getEstimatedTotalHits(),
            ]);
        } catch (\Throwable $e) {
            return new JsonResponse(['hits' => [], 'error' => $e->getMessage()]);
        }
    }

    #[Route('/docs/{id}', methods: ['GET'])]
    public function doc(string $id, EntityManagerInterface $em, TagService $tags): JsonResponse
    {
        try {
            $doc = $this->meili->docsIndex()->getDocument($id);
        } catch (\Throwable) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }

        try {
            $doc['tags'] = $tags->getTagNamesForDoc($id);
        } catch (\Throwable) {
            $doc['tags'] = [];
        }

        if (($doc['docType'] ?? '') === 'upload') {
            $ownerId = $doc['ownerId'] ?? '';
            $user = $this->getUser();
            if (!$user || $user->getUserIdentifier() !== $ownerId) {
                return new JsonResponse(['error' => 'Доступ запрещён'], 403);
            }

            $entity = $em->getRepository(UserDocument::class)->findOneBy(['meiliDocId' => $id]);
            if ($entity) {
                $doc['documentId'] = $entity->getId();
                $doc['hasDownload'] = true;
            }
            if (!empty($doc['viewContent'])) {
                $doc['content'] = $doc['viewContent'];
            }
        }

        return new JsonResponse($doc);
    }
}
