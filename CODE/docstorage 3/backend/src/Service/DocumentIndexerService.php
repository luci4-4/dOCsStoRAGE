<?php

namespace App\Service;

use App\Entity\User;
use App\Entity\UserDocument;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class DocumentIndexerService
{
    private const MAX_INDEX_CHARS = 10000;
    private const MAX_VIEW_CHARS = 100000;
    private const LOCAL_TEXT = ['txt', 'md', 'markdown', 'json', 'csv', 'log', 'xml', 'yml', 'yaml'];
    private const LOCAL_HTML = ['html', 'htm'];

    public function __construct(
        private DocumentStorageService $storage,
        private MeilisearchService $meili,
    ) {
    }

    public function extractText(string $storedPath, string $mimeType, string $filename): array
    {
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $bytes = $this->storage->read($storedPath);

        if (in_array($ext, self::LOCAL_HTML, true) || str_contains($mimeType, 'html')) {
            $html = $bytes;
            $plain = html_entity_decode(strip_tags($bytes), ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $plain = preg_replace('/\s{3,}/', "\n\n", $plain ?? '');

            return ['text' => trim($plain), 'format' => 'html', 'rawContent' => $html];
        }

        if ($ext === 'csv' || str_contains($mimeType, 'csv')) {
            $text = $this->decodeText($bytes);

            return ['text' => $text, 'format' => 'csv', 'rawContent' => $text];
        }

        if (in_array($ext, self::LOCAL_TEXT, true) || str_starts_with($mimeType, 'text/')) {
            $format = in_array($ext, ['md', 'markdown'], true) ? 'markdown' : 'text';
            $text = $this->decodeText($bytes);

            return ['text' => $text, 'format' => $format];
        }

        return $this->extractViaScraper($bytes, $filename, $mimeType);
    }

    private function decodeText(string $bytes): string
    {
        foreach (['UTF-8', 'CP1251', 'Latin-1'] as $enc) {
            $result = @mb_convert_encoding($bytes, 'UTF-8', $enc);
            if ($result !== false) {
                return $result;
            }
        }

        return mb_convert_encoding($bytes, 'UTF-8', 'UTF-8');
    }

    private function extractViaScraper(string $bytes, string $filename, string $mimeType): array
    {
        $scraperUrl = rtrim($_ENV['SCRAPER_URL'] ?? 'http://scraper:8001', '/');
        $boundary = bin2hex(random_bytes(12));
        $body = "--{$boundary}\r\n"
            . "Content-Disposition: form-data; name=\"file\"; filename=\"{$filename}\"\r\n"
            . "Content-Type: {$mimeType}\r\n\r\n"
            . $bytes . "\r\n"
            . "--{$boundary}--";

        $ctx = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: multipart/form-data; boundary={$boundary}",
                'content' => $body,
                'timeout' => 60,
                'ignore_errors' => true,
            ],
        ]);

        $response = file_get_contents("{$scraperUrl}/ingest/extract", false, $ctx);
        if ($response === false) {
            throw new \RuntimeException('Scraper недоступен. Поддерживаются: txt, md, html, pdf, docx.');
        }

        $data = json_decode($response, true);
        if (!is_array($data) || empty($data['text'])) {
            $detail = $data['detail'] ?? null;
            throw new \RuntimeException(is_string($detail) ? $detail : 'Scraper не смог извлечь текст.');
        }

        return ['text' => $data['text'], 'format' => $data['format'] ?? 'text'];
    }

    public function index(
        UserDocument $doc,
        User $user,
        string $text,
        string $format,
        string $rawContent = '',
        array $tagNames = [],
    ): void {
        $this->meili->ensureUploadFilterable();

        $viewContent = mb_substr($rawContent ?: $text, 0, self::MAX_VIEW_CHARS);
        $searchContent = mb_substr($text, 0, self::MAX_INDEX_CHARS);
        $tagNames = array_values(array_filter(array_map('trim', $tagNames)));

        $task = $this->meili->docsIndex()->addDocuments([[
            'id' => $doc->getMeiliDocId(),
            'title' => $doc->getTitle(),
            'content' => $searchContent,
            'viewContent' => $viewContent,
            'source' => '',
            'language' => 'Other',
            'docType' => 'upload',
            'ownerId' => $user->getUserIdentifier(),
            'filename' => $doc->getOriginalFilename(),
            'mimeType' => $doc->getMimeType(),
            'contentFormat' => $format,
            'documentId' => $doc->getId(),
            'tags' => $tagNames,
            'indexedAt' => time(),
        ]]);

        $taskUid = $task['taskUid'] ?? $task['uid'] ?? null;
        if ($taskUid !== null) {
            $this->meili->client()->waitForTask($taskUid, 10000);
        }
    }

    public function removeFromIndex(string $meiliDocId): void
    {
        try {
            $this->meili->docsIndex()->deleteDocument($meiliDocId);
        } catch (\Throwable) {
        }
    }

    public static function guessTitle(UploadedFile $file, ?string $customTitle): string
    {
        if ($customTitle && trim($customTitle) !== '') {
            return trim($customTitle);
        }
        $name = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

        return $name !== '' ? $name : $file->getClientOriginalName();
    }

    public static function isAllowed(UploadedFile $file): bool
    {
        $ext = strtolower($file->getClientOriginalExtension());
        $allowed = ['txt', 'md', 'markdown', 'html', 'htm', 'json', 'csv', 'pdf', 'docx', 'doc', 'rst'];

        return in_array($ext, $allowed, true);
    }
}
