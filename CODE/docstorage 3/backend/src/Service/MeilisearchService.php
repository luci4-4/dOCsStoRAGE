<?php

namespace App\Service;

use Meilisearch\Client;

class MeilisearchService
{
    private Client $client;

    public function __construct()
    {
        $this->client = new Client(
            $_ENV['MEILISEARCH_URL'] ?? 'http://meilisearch:7700',
            $_ENV['MEILISEARCH_KEY'] ?? ''
        );
    }

    public function client(): Client
    {
        return $this->client;
    }

    public function docsIndex(): \Meilisearch\Endpoints\Indexes
    {
        return $this->client->index('docs');
    }

    public function ensureUploadFilterable(): void
    {
        try {
            $this->docsIndex()->updateSettings([
                'filterableAttributes' => ['language', 'source', 'docType', 'ownerId', 'tags'],
                'searchableAttributes' => ['title', 'content', 'source', 'language', 'tags'],
            ]);
        } catch (\Throwable) {
        }
    }
}
