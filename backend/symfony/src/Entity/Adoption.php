<?php

namespace App\Entity;

use App\Repository\AdoptionRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AdoptionRepository::class)]
#[ORM\Table(name: 'adoptions')]
class Adoption
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'adoptions')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id')]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Pet::class, inversedBy: 'adoptions')]
    #[ORM\JoinColumn(name: 'pet_id', referencedColumnName: 'id')]
    private ?Pet $pet = null;

    #[ORM\Column(name: 'adoption_date', nullable: true)]
    private ?\DateTimeImmutable $adoptionDate = null;

    #[ORM\Column(name: 'state', length: 20, options: ['default' => 'pending'])]
    private string $state = 'pending';

    #[ORM\Column(name: 'created_at')]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->state = 'pending';
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getPet(): ?Pet
    {
        return $this->pet;
    }

    public function setPet(?Pet $pet): static
    {
        $this->pet = $pet;

        return $this;
    }

    public function getAdoptionDate(): ?\DateTimeImmutable
    {
        return $this->adoptionDate;
    }

    public function setAdoptionDate(?\DateTimeImmutable $adoptionDate): static
    {
        $this->adoptionDate = $adoptionDate;

        return $this;
    }

    public function getState(): string
    {
        return $this->state;
    }

    public function setState(string $state): static
    {
        $this->state = $state;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    // Métodos de conveniencia para los estados
    public function isPending(): bool
    {
        return $this->state === 'pending';
    }

    public function isCompleted(): bool
    {
        return $this->state === 'completed';
    }

    public function isCanceled(): bool
    {
        return $this->state === 'canceled';
    }

    public function markAsCompleted(): static
    {
        $this->state = 'completed';
        $this->adoptionDate = new \DateTimeImmutable();
        
        return $this;
    }

    public function markAsCanceled(): static
    {
        $this->state = 'canceled';
        $this->adoptionDate = new \DateTimeImmutable();
        
        return $this;
    }
}