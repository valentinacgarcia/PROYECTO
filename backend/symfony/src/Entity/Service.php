<?php

namespace App\Entity;

use App\Repository\ServiceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ServiceRepository::class)]
#[ORM\Table(name: 'services')]
class Service
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $serviceName = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $description = null;

    #[ORM\Column(length: 100)]
    private ?string $category = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $address = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 8, nullable: true)]
    private ?string $latitude = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 11, scale: 8, nullable: true)]
    private ?string $longitude = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    private ?string $price = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $priceType = null;

    #[ORM\Column(type: Types::JSON)]
    private array $modalities = [];

    #[ORM\Column(type: Types::JSON)]
    private array $availabilityDays = [];

    #[ORM\OneToMany(mappedBy: 'service', targetEntity: Photo::class, cascade: ['persist', 'remove'])]
    private Collection $photos;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\Column]
    private bool $isActive = true;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?User $provider = null;

    #[ORM\OneToOne(targetEntity: Marcador::class, cascade: ['persist', 'remove'])]
    #[ORM\JoinColumn(nullable: true)]
    private ?Marcador $marker = null;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
        $this->modalities = [];
        $this->availabilityDays = [];
        $this->photos = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getServiceName(): ?string
    {
        return $this->serviceName;
    }

    public function setServiceName(string $serviceName): static
    {
        $this->serviceName = $serviceName;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getCategory(): ?string
    {
        return $this->category;
    }

    public function setCategory(string $category): static
    {
        $this->category = $category;
        return $this;
    }

    public function getAddress(): ?string
    {
        return $this->address;
    }

    public function setAddress(?string $address): static
    {
        $this->address = $address;
        return $this;
    }

    public function getLatitude(): ?string
    {
        return $this->latitude;
    }

    public function setLatitude(?string $latitude): static
    {
        $this->latitude = $latitude;
        return $this;
    }

    public function getLongitude(): ?string
    {
        return $this->longitude;
    }

    public function setLongitude(?string $longitude): static
    {
        $this->longitude = $longitude;
        return $this;
    }

    public function getPrice(): ?string
    {
        return $this->price;
    }

    public function setPrice(?string $price): static
    {
        $this->price = $price;
        return $this;
    }

    public function getPriceType(): ?string
    {
        return $this->priceType;
    }

    public function setPriceType(?string $priceType): static
    {
        $this->priceType = $priceType;
        return $this;
    }

    public function getModalities(): array
    {
        return $this->modalities;
    }

    public function setModalities(array $modalities): static
    {
        $this->modalities = $modalities;
        return $this;
    }

    public function getAvailabilityDays(): array
    {
        return $this->availabilityDays;
    }

    public function setAvailabilityDays(array $availabilityDays): static
    {
        $this->availabilityDays = $availabilityDays;
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
            $photo->setService($this);
        }

        return $this;
    }

    public function removePhoto(Photo $photo): static
    {
        if ($this->photos->removeElement($photo)) {
            if ($photo->getService() === $this) {
                $photo->setService(null);
            }
        }

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeInterface $updatedAt): static
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;
        return $this;
    }

    public function getProvider(): ?User
    {
        return $this->provider;
    }

    public function setProvider(?User $provider): static
    {
        $this->provider = $provider;
        return $this;
    }

    public function getMarker(): ?Marcador
    {
        return $this->marker;
    }

    public function setMarker(?Marcador $marker): static
    {
        $this->marker = $marker;
        return $this;
    }
}
