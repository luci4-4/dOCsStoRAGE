<?php

namespace App\Controller;

use App\Entity\Note;
use App\Service\MeilisearchService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[Route('/api/export')]
class ExportController extends AbstractController
{
    #[Route('/{id}', methods: ['GET'])]
    public function exportDoc(string $id, MeilisearchService $meili, HttpClientInterface $http): Response
    {
        try {
            $doc = $meili->docsIndex()->getDocument($id);
        } catch (\Throwable) {
            return $this->json(['error' => 'Not found'], 404);
        }

        if (($doc['docType'] ?? '') === 'upload') {
            $owner = $doc['ownerId'] ?? '';
            if (!$this->getUser() || $this->getUser()->getUserIdentifier() !== $owner) {
                return $this->json(['error' => 'Доступ запрещён'], 403);
            }
        }

        $content = $doc['viewContent'] ?? $doc['content'] ?? '';
        $title = $doc['title'] ?? 'Document';

        return $this->pdfFromScraper($http, $title, $content);
    }

    #[Route('/note/{id}', methods: ['GET'])]
    public function exportNote(int $id, EntityManagerInterface $em, HttpClientInterface $http): Response
    {
        $note = $em->getRepository(Note::class)->findOneBy(['id' => $id, 'user' => $this->getUser()]);
        if (!$note) {
            return $this->json(['error' => 'Not found'], 404);
        }

        return $this->pdfFromScraper($http, $note->getTitle() ?: 'Note', $note->getContent() ?? '');
    }

    private function pdfFromScraper(HttpClientInterface $http, string $title, string $content): Response
    {
        try {
            $resp = $http->request('POST', rtrim($_ENV['SCRAPER_URL'] ?? 'http://scraper:8001', '/') . '/export/pdf', [
                'json' => ['title' => $title, 'content' => $content],
            ]);

            $filename = preg_replace('/[^\x20-\x7E]+/', '_', $title) ?: 'document';
            $filename = trim($filename, '._') ?: 'document';
            if (strlen($filename) > 50) {
                $filename = substr($filename, 0, 50);
            }

            return new Response(
                $resp->getContent(),
                200,
                [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => (new ResponseHeaderBag())->makeDisposition(
                        ResponseHeaderBag::DISPOSITION_ATTACHMENT,
                        $filename . '.pdf'
                    ),
                ]
            );
        } catch (\Throwable $e) {
            return $this->json(['error' => 'Экспорт недоступен: ' . $e->getMessage()], 503);
        }
    }
}
