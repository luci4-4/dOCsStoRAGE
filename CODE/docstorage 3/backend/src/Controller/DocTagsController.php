<?php

namespace App\Controller;

use App\Service\MeilisearchService;
use App\Service\TagService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/docs')]
class DocTagsController extends AbstractController
{
    public function __construct(
        private TagService $tags,
        private MeilisearchService $meili,
    ) {
    }

    #[Route('/{id}/tags', methods: ['GET'])]
    public function getTags(string $id): JsonResponse
    {
        if (!$this->docExists($id)) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }

        return new JsonResponse([
            'tags' => $this->tags->getTagNamesForDoc($id),
        ]);
    }

    #[Route('/{id}/tags', methods: ['PUT'])]
    #[IsGranted('ROLE_CONTENT_MANAGER')]
    public function setTags(string $id, Request $request): JsonResponse
    {
        if (!$this->docExists($id)) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }

        $data = json_decode($request->getContent(), true) ?: [];
        $tagIds = $data['tagIds'] ?? [];

        if (!is_array($tagIds)) {
            return new JsonResponse(['error' => 'tagIds must be an array'], 400);
        }

        try {
            $names = $this->tags->setDocTags($id, $tagIds);
        } catch (\InvalidArgumentException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 400);
        } catch (\RuntimeException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 503);
        }

        return new JsonResponse(['tags' => $names]);
    }

    private function docExists(string $id): bool
    {
        try {
            $this->meili->docsIndex()->getDocument($id);

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
