<?php

namespace App\Controller;

use App\Entity\User;
use App\Entity\ViewHistory;
use App\Entity\Note;
use Doctrine\ORM\EntityManagerInterface;
use Meilisearch\Client;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Contracts\HttpClient\HttpClientInterface;

#[Route('/api/admin')]
class AdminController extends AbstractController
{
    #[Route('/users', methods: ['GET'])]
    public function users(EntityManagerInterface $em): JsonResponse
    {
        $users = $em->getRepository(User::class)->findAll();

        return new JsonResponse(array_map(
            fn ($u) => [
                'id' => $u->getId(),
                'username' => $u->getUsername(),
                'email' => $u->getEmail(),
                'roles' => $u->getRoles(),
                'active' => $u->isActive(),
            ],
            $users
        ));
    }

    #[Route('/users/{id}/role', methods: ['PATCH'])]
    public function changeRole(int $id, Request $req, EntityManagerInterface $em): JsonResponse
    {
        $u = $em->getRepository(User::class)->find($id);
        if (!$u) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }
        $data = json_decode($req->getContent(), true);
        $u->setRoles([$data['role'] ?? 'ROLE_USER']);
        $em->flush();

        return new JsonResponse(['message' => 'OK']);
    }

    #[Route('/users/{id}/toggle', methods: ['PATCH'])]
    public function toggleUser(int $id, EntityManagerInterface $em): JsonResponse
    {
        $u = $em->getRepository(User::class)->find($id);
        if (!$u) {
            return new JsonResponse(['error' => 'Not found'], 404);
        }
        $u->setActive(!$u->isActive());
        $em->flush();

        return new JsonResponse(['active' => $u->isActive()]);
    }

    #[Route('/health', methods: ['GET'])]
    public function health(EntityManagerInterface $em, HttpClientInterface $http): JsonResponse
    {
        $services = [
            $this->checkMeilisearch(),
            $this->checkScraper($http),
            $this->checkPostgres($em),
            $this->checkSymfony(),
        ];

        return new JsonResponse([
            'services' => $services,
            'checkedAt' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
        ]);
    }

    private function checkMeilisearch(): array
    {
        $url = $_ENV['MEILISEARCH_URL'] ?? 'http://meilisearch:7700';
        $started = microtime(true);

        try {
            $client = new Client($url, $_ENV['MEILISEARCH_KEY'] ?? '');
            $health = $client->health();
            $ok = ($health['status'] ?? '') === 'available';
            $message = $ok
                ? 'Доступен'
                : ($health['status'] ?? 'Недоступен');

            return [
                'id' => 'meilisearch',
                'name' => 'MeiliSearch',
                'address' => $this->publicAddress($url, '7700'),
                'ok' => $ok,
                'message' => $message,
                'latencyMs' => (int) round((microtime(true) - $started) * 1000),
            ];
        } catch (\Throwable $e) {
            return [
                'id' => 'meilisearch',
                'name' => 'MeiliSearch',
                'address' => $this->publicAddress($url, '7700'),
                'ok' => false,
                'message' => $e->getMessage(),
                'latencyMs' => (int) round((microtime(true) - $started) * 1000),
            ];
        }
    }

    private function checkScraper(HttpClientInterface $http): array
    {
        $base = rtrim($_ENV['SCRAPER_URL'] ?? 'http://scraper:8001', '/');
        $started = microtime(true);

        try {
            $resp = $http->request('GET', $base . '/health', ['timeout' => 5]);
            $data = $resp->toArray();
            $ok = ($data['status'] ?? '') === 'ok';
            $message = $ok ? 'Доступен' : 'Неверный ответ';

            return [
                'id' => 'scraper',
                'name' => 'FastAPI',
                'address' => $this->publicAddress($base, '8001'),
                'ok' => $ok,
                'message' => $message,
                'latencyMs' => (int) round((microtime(true) - $started) * 1000),
            ];
        } catch (\Throwable $e) {
            return [
                'id' => 'scraper',
                'name' => 'FastAPI',
                'address' => $this->publicAddress($base, '8001'),
                'ok' => false,
                'message' => $e->getMessage(),
                'latencyMs' => (int) round((microtime(true) - $started) * 1000),
            ];
        }
    }

    private function checkPostgres(EntityManagerInterface $em): array
    {
        $dsn = $_ENV['DATABASE_URL'] ?? 'postgresql://docstorage@postgres:5432/docstorage';
        $started = microtime(true);

        try {
            $em->getConnection()->executeQuery('SELECT 1');
            $ok = true;
            $message = 'Доступен';
        } catch (\Throwable $e) {
            $ok = false;
            $message = $e->getMessage();
        }

        return [
            'id' => 'postgres',
            'name' => 'PostgreSQL',
            'address' => $this->publicAddress($dsn, '5432'),
            'ok' => $ok,
            'message' => $message,
            'latencyMs' => (int) round((microtime(true) - $started) * 1000),
        ];
    }

    private function checkSymfony(): array
    {
        return [
            'id' => 'symfony',
            'name' => 'Symfony',
            'address' => 'localhost:8000',
            'ok' => true,
            'message' => 'Доступен',
            'latencyMs' => 0,
        ];
    }

    private function publicAddress(string $url, string $defaultPort): string
    {
        $host = parse_url($url, PHP_URL_HOST);
        $port = parse_url($url, PHP_URL_PORT);

        if (!$host) {
            if (preg_match('#@([^/:]+)#', $url, $m)) {
                $host = $m[1];
            } else {
                $host = 'localhost';
            }
        }

        $port ??= $defaultPort;

        $localHosts = [
            'meilisearch' => 'localhost',
            'postgres' => 'localhost',
            'scraper' => 'localhost',
            'backend' => 'localhost',
        ];
        if (isset($localHosts[$host])) {
            $host = $localHosts[$host];
        }

        return $host . ':' . $port;
    }

    #[Route('/stats', methods: ['GET'])]
    public function stats(EntityManagerInterface $em): JsonResponse
    {
        try {
            $client = new Client(
                $_ENV['MEILISEARCH_URL'] ?? 'http://meilisearch:7700',
                $_ENV['MEILISEARCH_KEY'] ?? ''
            );
            $totalDocs = $client->index('docs')->stats()['numberOfDocuments'];
        } catch (\Throwable) {
            $totalDocs = 0;
        }

        return new JsonResponse([
            'totalUsers' => $em->getRepository(User::class)->count([]),
            'totalViews' => $em->getRepository(ViewHistory::class)->count([]),
            'totalNotes' => $em->getRepository(Note::class)->count([]),
            'totalDocs' => $totalDocs,
            'totalSearches' => 0,
        ]);
    }

    #[Route('/logs', methods: ['GET'])]
    public function logs(HttpClientInterface $http): JsonResponse
    {
        try {
            $resp = $http->request('GET', ($_ENV['SCRAPER_URL'] ?? 'http://scraper:8001') . '/logs');

            return new JsonResponse($resp->toArray());
        } catch (\Throwable) {
            return new JsonResponse([]);
        }
    }

    #[Route('/search-settings', methods: ['GET'])]
    public function getSettings(): JsonResponse
    {
        try {
            $client = new Client(
                $_ENV['MEILISEARCH_URL'] ?? 'http://meilisearch:7700',
                $_ENV['MEILISEARCH_KEY'] ?? ''
            );
            $idx = $client->index('docs');

            return new JsonResponse([
                'searchableAttributes' => $idx->getSearchableAttributes(),
                'filterableAttributes' => $idx->getFilterableAttributes(),
                'typoTolerance' => $idx->getTypoTolerance(),
            ]);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('/search-settings', methods: ['POST'])]
    public function updateSettings(Request $req): JsonResponse
    {
        $data = json_decode($req->getContent(), true);
        try {
            $client = new Client(
                $_ENV['MEILISEARCH_URL'] ?? 'http://meilisearch:7700',
                $_ENV['MEILISEARCH_KEY'] ?? ''
            );
            $idx = $client->index('docs');
            if (!empty($data['searchableAttributes'])) {
                $idx->updateSearchableAttributes($data['searchableAttributes']);
            }
            if (!empty($data['filterableAttributes'])) {
                $idx->updateFilterableAttributes($data['filterableAttributes']);
            }
            if (isset($data['typoTolerance'])) {
                $idx->updateTypoTolerance($data['typoTolerance']);
            }

            return new JsonResponse(['message' => 'OK']);
        } catch (\Throwable $e) {
            return new JsonResponse(['error' => $e->getMessage()], 500);
        }
    }
}
