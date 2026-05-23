<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'document_tags')]
#[ORM\UniqueConstraint(name: 'uniq_doc_tag', columns: ['tag_id', 'meili_doc_id'])]
class DocumentTag
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Tag::class, inversedBy: 'documentTags')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Tag $tag;

    #[ORM\Column(length: 64)]
    private string $meiliDocId;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getTag(): Tag
    {
        return $this->tag;
    }

    public function setTag(Tag $tag): self
    {
        $this->tag = $tag;

        return $this;
    }

    public function getMeiliDocId(): string
    {
        return $this->meiliDocId;
    }

    public function setMeiliDocId(string $id): self
    {
        $this->meiliDocId = $id;

        return $this;
    }
}
