<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'favorites')]
class Favorite
{
    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $user;

    #[ORM\Column(length: 255)]
    private string $docId;

    #[ORM\Column(length: 500, nullable: true)]
    private ?string $docTitle = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $docSource = null;

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

    public function getDocId(): string
    {
        return $this->docId;
    }

    public function setDocId(string $d): self
    {
        $this->docId = $d;

        return $this;
    }

    public function getDocTitle(): ?string
    {
        return $this->docTitle;
    }

    public function setDocTitle(?string $t): self
    {
        $this->docTitle = $t;

        return $this;
    }

    public function getDocSource(): ?string
    {
        return $this->docSource;
    }

    public function setDocSource(?string $s): self
    {
        $this->docSource = $s;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }
}
