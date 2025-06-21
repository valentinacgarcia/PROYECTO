<?php

namespace App\Entity;

use App\Repository\PetRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: PetRepository::class)]
#[ORM\Table(name: 'pets')]
class Pet
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 10)]
    private ?string $type = null; // 'perro' o 'gato'

    #[ORM\Column(length: 100)]
    private ?string $name = null;

    #[ORM\Column(length: 10)]
    private ?string $gender = null; // 'macho', 'hembra', 'no_sabe'

    #[ORM\Column(nullable: true)]
    private ?int $age_years = null;

    #[ORM\Column(nullable: true)]
    private ?int $age_months = null;

    #[ORM\Column(length: 10, nullable: true)]
    private ?string $size = null; // 'pequeño', 'mediano', 'grande' (solo perros)

    #[ORM\Column]
    private bool $is_purebred = false;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $breed = null;

    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $colors = null; // ejemplo: ['blanco', 'negro']

    #[ORM\Column(length: 10, nullable: true)]
    private ?string $fur_length = null; // 'corto', 'medio', 'largo'

    #[ORM\Column(length: 10, nullable: true)]
    private ?string $sterilized = null; // 'si', 'no', 'no_sabe'

    #[ORM\Column(length: 10, nullable: true)]
    private ?string $vaccinated = null; // 'si', 'no', 'no_sabe'

    #[ORM\Column(type: 'json', nullable: true)]
    private ?array $compatibility = null; // ['niños', 'gatos', 'otros_perros']

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $location = null;

    #[ORM\Column]
    private ?bool $is_adopted = false;

    #[ORM\Column]
    private ?\DateTimeImmutable $created_at = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'pets')]
    #[ORM\JoinColumn(name: 'owner_id', referencedColumnName: 'id')]
    private ?User $owner = null;

    #[ORM\OneToMany(targetEntity: Adoption::class, mappedBy: 'pet')]
    private Collection $adoptions;

    #[ORM\OneToMany(mappedBy: 'pet', targetEntity: Photo::class, cascade: ['persist', 'remove'])]
    private Collection $photos;

    public function __construct()
    {
        $this->adoptions = new ArrayCollection();
        $this->photos = new ArrayCollection();
        $this->created_at = new \DateTimeImmutable();
    }

    public function getId(): ?int { return $this->id; }

    public function getType(): ?string { return $this->type; }
    public function setType(?string $type): static { $this->type = $type; return $this; }

    public function getName(): ?string { return $this->name; }
    public function setName(string $name): static { $this->name = $name; return $this; }

    public function getGender(): ?string { return $this->gender; }
    public function setGender(string $gender): static { $this->gender = $gender; return $this; }

    public function getAgeYears(): ?int { return $this->age_years; }
    public function setAgeYears(?int $years): static { $this->age_years = $years; return $this; }

    public function getAgeMonths(): ?int { return $this->age_months; }
    public function setAgeMonths(?int $months): static { $this->age_months = $months; return $this; }

    public function getSize(): ?string { return $this->size; }
    public function setSize(?string $size): static { $this->size = $size; return $this; }

    public function isPurebred(): bool { return $this->is_purebred; }
    public function setIsPurebred(bool $is_purebred): static { $this->is_purebred = $is_purebred; return $this; }

    public function getBreed(): ?string { return $this->breed; }
    public function setBreed(?string $breed): static { $this->breed = $breed; return $this; }

    public function getColors(): ?array { return $this->colors; }
    public function setColors(?array $colors): static { $this->colors = $colors; return $this; }

    public function getFurLength(): ?string { return $this->fur_length; }
    public function setFurLength(?string $fur_length): static { $this->fur_length = $fur_length; return $this; }

    public function getSterilized(): ?string { return $this->sterilized; }
    public function setSterilized(?string $sterilized): static { $this->sterilized = $sterilized; return $this; }

    public function getVaccinated(): ?string { return $this->vaccinated; }
    public function setVaccinated(?string $vaccinated): static { $this->vaccinated = $vaccinated; return $this; }

    public function getCompatibility(): ?array { return $this->compatibility; }
    public function setCompatibility(?array $compatibility): static { $this->compatibility = $compatibility; return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): static { $this->description = $description; return $this; }

    public function getLocation(): ?string { return $this->location; }
    public function setLocation(?string $location): static { $this->location = $location; return $this; }

    public function isAdopted(): ?bool { return $this->is_adopted; }
    public function setIsAdopted(bool $is_adopted): static { $this->is_adopted = $is_adopted; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->created_at; }
    public function setCreatedAt(\DateTimeImmutable $created_at): static { $this->created_at = $created_at; return $this; }

    public function getOwner(): ?User { return $this->owner; }
    public function setOwner(?User $owner): static { $this->owner = $owner; return $this; }

    public function getAdoptions(): Collection { return $this->adoptions; }
    public function addAdoption(Adoption $adoption): static {
        if (!$this->adoptions->contains($adoption)) {
            $this->adoptions->add($adoption);
            $adoption->setPet($this);
        }
        return $this;
    }

    public function removeAdoption(Adoption $adoption): static {
        if ($this->adoptions->removeElement($adoption)) {
            if ($adoption->getPet() === $this) {
                $adoption->setPet(null);
            }
        }
        return $this;
    }

    public function getPhotos(): Collection
    {
        return $this->photos;
    }

    public function addPhoto(Photo $photo): static
    {
        if (!$this->photos->contains($photo)) {
            $this->photos->add($photo);
            $photo->setPet($this);
        }

        return $this;
    }

    public function removePhoto(Photo $photo): static
    {
        if ($this->photos->removeElement($photo)) {
            if ($photo->getPet() === $this) {
                $photo->setPet(null);
            }
        }

        return $this;
    }
}
