<?php

namespace App\Service;

use App\Entity\DocumentTag;
use App\Entity\Tag;
use Doctrine\ORM\EntityManagerInterface;

class TagService
{
    public function __construct(
        private EntityManagerInterface $em,
        private MeilisearchService $meili,
    ) {
    }

    private function linksAvailable(): bool
    {
        try {
            $this->em->getConnection()->executeQuery('SELECT 1 FROM document_tags LIMIT 1');

            return true;
        } catch (\Throwable) {
            return false;
        }
    }

    public function listWithCounts(): array
    {
        if (!$this->linksAvailable()) {
            $tags = $this->em->getRepository(Tag::class)->findBy([], ['name' => 'ASC']);

            return array_map(static fn (Tag $t) => [
                'id' => $t->getId(),
                'name' => $t->getName(),
                'docCount' => 0,
            ], $tags);
        }

        $rows = $this->em->createQueryBuilder()
            ->select('t.id', 't.name', 'COUNT(dt.id) AS docCount')
            ->from(Tag::class, 't')
            ->leftJoin(DocumentTag::class, 'dt', 'WITH', 'dt.tag = t')
            ->groupBy('t.id', 't.name')
            ->orderBy('t.name', 'ASC')
            ->getQuery()
            ->getArrayResult();

        return array_map(static fn (array $row) => [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'docCount' => (int) $row['docCount'],
        ], $rows);
    }

    public function getTagNamesForDoc(string $meiliDocId): array
    {
        if (!$this->linksAvailable()) {
            return [];
        }

        $rows = $this->em->createQueryBuilder()
            ->select('t.name')
            ->from(DocumentTag::class, 'dt')
            ->join('dt.tag', 't')
            ->where('dt.meiliDocId = :id')
            ->setParameter('id', $meiliDocId)
            ->orderBy('t.name', 'ASC')
            ->getQuery()
            ->getSingleColumnResult();

        return $rows;
    }

    public function setDocTags(string $meiliDocId, array $tagIds): array
    {
        if (!$this->linksAvailable()) {
            throw new \RuntimeException(
                'Таблица document_tags не создана. Выполните: docker exec docstorage_backend php bin/console doctrine:schema:update --force'
            );
        }

        $tagIds = array_values(array_unique(array_map('intval', $tagIds)));
        $tags = $tagIds
            ? $this->em->getRepository(Tag::class)->findBy(['id' => $tagIds])
            : [];

        if (count($tags) !== count($tagIds)) {
            throw new \InvalidArgumentException('Один или несколько тегов не найдены');
        }

        $existing = $this->em->getRepository(DocumentTag::class)->findBy(['meiliDocId' => $meiliDocId]);
        foreach ($existing as $link) {
            $this->em->remove($link);
        }
        $this->em->flush();

        foreach ($tags as $tag) {
            $link = new DocumentTag();
            $link->setTag($tag)->setMeiliDocId($meiliDocId);
            $this->em->persist($link);
        }
        $this->em->flush();

        $names = array_map(static fn (Tag $t) => $t->getName(), $tags);
        $this->syncDocTagsInMeili($meiliDocId, $names);

        return $names;
    }

    public function attachTagsByNames(string $meiliDocId, array $names): array
    {
        $resolvedIds = [];
        foreach ($names as $raw) {
            $name = trim((string) $raw);
            if ($name === '') {
                continue;
            }
            $tag = $this->em->getRepository(Tag::class)->findOneBy(['name' => $name]);
            if ($tag) {
                $resolvedIds[] = $tag->getId();
            }
        }

        if ($resolvedIds === []) {
            return $this->getTagNamesForDoc($meiliDocId);
        }

        $current = $this->em->getRepository(DocumentTag::class)->findBy(['meiliDocId' => $meiliDocId]);
        $existingIds = array_map(static fn (DocumentTag $dt) => $dt->getTag()->getId(), $current);

        return $this->setDocTags($meiliDocId, array_values(array_unique([...$existingIds, ...$resolvedIds])));
    }

    public function removeTagFromAllDocs(Tag $tag): void
    {
        $links = $this->em->getRepository(DocumentTag::class)->findBy(['tag' => $tag]);
        $docIds = array_unique(array_map(static fn (DocumentTag $dt) => $dt->getMeiliDocId(), $links));

        foreach ($links as $link) {
            $this->em->remove($link);
        }
        $this->em->flush();

        foreach ($docIds as $meiliDocId) {
            $this->syncDocTagsInMeili($meiliDocId, $this->getTagNamesForDoc($meiliDocId));
        }
    }

    private function syncDocTagsInMeili(string $meiliDocId, array $tagNames): void
    {
        try {
            $this->meili->ensureUploadFilterable();
            $this->meili->docsIndex()->updateDocuments([[
                'id' => $meiliDocId,
                'tags' => array_values($tagNames),
            ]]);
        } catch (\Throwable) {
        }
    }
}
