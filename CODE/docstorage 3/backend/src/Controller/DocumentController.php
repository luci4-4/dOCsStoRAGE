<?php

namespace App\Controller;

use App\Entity\UserDocument;
use App\Service\DocumentIndexerService;
use App\Service\DocumentStorageService;
use App\Entity\Tag;
use App\Service\TagService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Uid\Uuid;

#[Route('/api/documents')]
class DocumentController extends AbstractController
{
    private const MAX_BYTES = 5 * 1024 * 1024;

    #[Route('', methods: ['GET'])]
    public function list(EntityManagerInterface $em): JsonResponse
    {
        $docs = $em->getRepository(UserDocument::class)->findBy(
            ['user' => $this->getUser()],
            ['createdAt' => 'DESC']
        );

        return new JsonResponse(array_map(
            fn (UserDocument $d) => $this->serialize($d),
            $docs
        ));
    }

    #[Route('', methods: ['POST'])]
    public function upload(
        Request $req,
        EntityManagerInterface $em,
        DocumentStorageService $storage,
        DocumentIndexerService $indexer,
        TagService $tagService,
    ): JsonResponse {
        $file = $req->files->get('file');
        if (!$file) {
            return new JsonResponse(['error' => 'Файл не передан'], 400);
        }

        if ($file->getSize() > self::MAX_BYTES) {
            return new JsonResponse(['error' => 'Максимальный размер файла — 5 МБ'], 400);
        }

        if (!DocumentIndexerService::isAllowed($file)) {
            return new JsonResponse(
                ['error' => 'Формат не поддерживается. Допустимо: txt, md, html, json, csv, pdf, docx'],
                400
            );
        }

        $user = $this->getUser();
        $doc = new UserDocument();
        $doc->setUser($user)
            ->setTitle(DocumentIndexerService::guessTitle($file, $req->request->get('title')))
            ->setOriginalFilename($file->getClientOriginalName())
            ->setMimeType($file->getClientMimeType() ?: 'application/octet-stream')
            ->setSize((int) $file->getSize())
            ->setMeiliDocId('upload_' . str_replace('-', '', Uuid::v4()->toRfc4122()));

        $storedPath = null;
        try {
            $storedPath = $storage->store($file, $user->getId());
            $doc->setStoredPath($storedPath);
            $em->persist($doc);
            $em->flush();

            $extracted = $indexer->extractText($storedPath, $doc->getMimeType(), $doc->getOriginalFilename());
            $doc->setContentFormat($extracted['format']);
            $tagIds = $this->parseTagIds($req->request->get('tagIds'));
            $tagNames = [];
            if ($tagIds !== []) {
                $tagEntities = $em->getRepository(Tag::class)->findBy(['id' => $tagIds]);
                $tagNames = array_map(static fn (Tag $t) => $t->getName(), $tagEntities);
            }
            $indexer->index(
                $doc,
                $user,
                $extracted['text'],
                $extracted['format'],
                $extracted['rawContent'] ?? '',
                $tagNames,
            );
            if ($tagIds !== []) {
                $tagService->setDocTags($doc->getMeiliDocId(), $tagIds);
            }
            $em->flush();

            return new JsonResponse($this->serialize($doc), 201);
        } catch (\Throwable $e) {
            if ($storedPath) {
                $storage->delete($storedPath);
            }
            if ($doc->getId()) {
                $em->remove($doc);
                $em->flush();
            }

            return new JsonResponse(['error' => $e->getMessage()], 422);
        }
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(int $id, EntityManagerInterface $em): JsonResponse
    {
        $doc = $this->findOwned($id, $em);
        if (!$doc) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }

        return new JsonResponse($this->serialize($doc));
    }

    #[Route('/{id}/file', methods: ['GET'])]
    public function download(int $id, EntityManagerInterface $em, DocumentStorageService $storage): Response
    {
        $doc = $this->findOwned($id, $em);
        if (!$doc) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }

        $path = $storage->absolutePath($doc->getStoredPath());
        $response = new BinaryFileResponse($path);
        $response->setContentDisposition(
            ResponseHeaderBag::DISPOSITION_ATTACHMENT,
            $doc->getOriginalFilename()
        );

        return $response;
    }

    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(
        int $id,
        EntityManagerInterface $em,
        DocumentStorageService $storage,
        DocumentIndexerService $indexer,
    ): JsonResponse {
        $doc = $this->findOwned($id, $em);
        if (!$doc) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }

        $indexer->removeFromIndex($doc->getMeiliDocId());
        $storage->delete($doc->getStoredPath());
        $em->remove($doc);
        $em->flush();

        return new JsonResponse(null, 204);
    }

    private function findOwned(int $id, EntityManagerInterface $em): ?UserDocument
    {
        return $em->getRepository(UserDocument::class)->findOneBy([
            'id' => $id,
            'user' => $this->getUser(),
        ]);
    }

    private function serialize(UserDocument $d): array
    {
        return [
            'id' => $d->getId(),
            'title' => $d->getTitle(),
            'originalFilename' => $d->getOriginalFilename(),
            'mimeType' => $d->getMimeType(),
            'size' => $d->getSize(),
            'meiliDocId' => $d->getMeiliDocId(),
            'contentFormat' => $d->getContentFormat(),
            'status' => $d->getStatus(),
            'createdAt' => $d->getCreatedAt()->format('c'),
        ];
    }

    private function parseTagIds(mixed $raw): array
    {
        if (is_array($raw)) {
            return array_values(array_unique(array_map('intval', $raw)));
        }
        if (!is_string($raw) || trim($raw) === '') {
            return [];
        }
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return [];
        }

        return array_values(array_unique(array_map('intval', $decoded)));
    }
}
