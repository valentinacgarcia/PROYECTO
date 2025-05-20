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

    #[ORM\Column(name: 'adoption_date')]
    private ?\DateTimeImmutable $adoptionDate = null;

    public function __construct()
    {
        $this->adoptionDate = new \DateTimeImmutable();
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

    public function setAdoptionDate(\DateTimeImmutable $adoptionDate): static
    {
        $this->adoptionDate = $adoptionDate;

        return $this;
    }
}