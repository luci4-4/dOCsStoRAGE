<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'user_documents')]
class UserDocument
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(length: 500)]
    private string $title;

    #[ORM\Column(length: 255)]
    private string $originalFilename;

    #[ORM\Column(length: 500)]
    private string $storedPath;

    #[ORM\Column(length: 128)]
    private string $mimeType;

    #[ORM\Column]
    private int $size = 0;

    #[ORM\Column(length: 64, unique: true)]
    private string $meiliDocId;

    #[ORM\Column(length: 32)]
    private string $contentFormat = 'text';

    #[ORM\Column(length: 32)]
    private string $status = 'indexed';

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function setUser(User $u): self
    {
        $this->user = $u;

        return $this;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $t): self
    {
        $this->title = $t;

        return $this;
    }

    public function getOriginalFilename(): string
    {
        return $this->originalFilename;
    }

    public function setOriginalFilename(string $f): self
    {
        $this->originalFilename = $f;

        return $this;
    }

    public function getStoredPath(): string
    {
        return $this->storedPath;
    }

    public function setStoredPath(string $p): self
    {
        $this->storedPath = $p;

        return $this;
    }

    public function getMimeType(): string
    {
        return $this->mimeType;
    }

    public function setMimeType(string $m): self
    {
        $this->mimeType = $m;

        return $this;
    }

    public function getSize(): int
    {
        return $this->size;
    }

    public function setSize(int $s): self
    {
        $this->size = $s;

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

    public function getContentFormat(): string
    {
        return $this->contentFormat;
    }

    public function setContentFormat(string $f): self
    {
        $this->contentFormat = $f;

        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $s): self
    {
        $this->status = $s;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
