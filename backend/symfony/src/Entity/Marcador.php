<?php

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: 'App\Repository\MarcadorRepository')]
#[ORM\Table(name: 'marcadores')]
#[ORM\Index(name: 'idx_coordinates', columns: ['lat', 'lng'])]
#[ORM\Index(name: 'idx_activo', columns: ['activo'])]
class Marcador
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;

    #[ORM\Column(type: 'string', length: 255)]
    #[Assert\NotBlank(message: 'El nombre es obligatorio')]
    #[Assert\Length(min: 2, max: 255)]
    private string $name;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Assert\Length(max: 500)]
    private ?string $description = null;

    #[ORM\Column(type: 'string', length: 400, nullable: true)]
    private ?string $address = null;

    #[ORM\Column(type: 'decimal', precision: 10, scale: 8)]
    #[Assert\Type(type: 'numeric')]
    #[Assert\Range(min: -90, max: 90)]
    private float $lat;

    #[ORM\Column(type: 'decimal', precision: 11, scale: 8)]
    #[Assert\Type(type: 'numeric')]
    #[Assert\Range(min: -180, max: 180)]
    private float $lng;

    #[ORM\Column(type: 'string', length: 500, nullable: true)]
    private ?string $formatted_address = null;

    #[ORM\Column(type: 'string', length: 20, nullable: true)]
    private ?string $accuracy = null;

    #[ORM\Column(type: 'string', length: 50, nullable: true)]
    private ?string $geocoding_provider = null;

    #[ORM\Column(type: 'datetime')]
    private ?\DateTimeInterface $fecha_creacion = null;

    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $fecha_modificacion = null;

    #[ORM\Column(type: 'boolean')]
    private bool $activo = true;

    // Constructor
    public function __construct()
    {
        $this->fecha_creacion = new \DateTime();
    }

    // Getters y Setters
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;
        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;
        return $this;
    }

    public function getAddress(): ?string
    {
        return $this->address;
    }

    public function setAddress(?string $address): self
    {
        $this->address = $address;
        return $this;
    }

    public function getLat(): float
    {
        return $this->lat;
    }

    public function setLat(float $lat): self
    {
        $this->lat = $lat;
        return $this;
    }

    public function getLng(): float
    {
        return $this->lng;
    }

    public function setLng(float $lng): self
    {
        $this->lng = $lng;
        return $this;
    }

    public function getFormattedAddress(): ?string
    {
        return $this->formatted_address;
    }

    public function setFormattedAddress(?string $formatted_address): self
    {
        $this->formatted_address = $formatted_address;
        return $this;
    }

    public function getAccuracy(): ?string
    {
        return $this->accuracy;
    }

    public function setAccuracy(?string $accuracy): self
    {
        $this->accuracy = $accuracy;
        return $this;
    }

    public function getGeocodingProvider(): ?string
    {
        return $this->geocoding_provider;
    }

    public function setGeocodingProvider(?string $geocoding_provider): self
    {
        $this->geocoding_provider = $geocoding_provider;
        return $this;
    }

    public function getFechaCreacion(): ?\DateTimeInterface
    {
        return $this->fecha_creacion;
    }

    public function setFechaCreacion(\DateTimeInterface $fecha_creacion): self
    {
        $this->fecha_creacion = $fecha_creacion;
        return $this;
    }

    public function getFechaModificacion(): ?\DateTimeInterface
    {
        return $this->fecha_modificacion;
    }

    public function setFechaModificacion(?\DateTimeInterface $fecha_modificacion): self
    {
        $this->fecha_modificacion = $fecha_modificacion;
        return $this;
    }

    public function isActivo(): bool
    {
        return $this->activo;
    }

    public function setActivo(bool $activo): self
    {
        $this->activo = $activo;
        return $this;
    }

    /**
     * Serializar para JSON responses
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'address' => $this->address,
            'lat' => $this->lat,
            'lng' => $this->lng,
            'formatted_address' => $this->formatted_address,
            'accuracy' => $this->accuracy,
            'geocoding_provider' => $this->geocoding_provider,
            'fecha_creacion' => $this->fecha_creacion?->format('Y-m-d H:i:s'),
            'fecha_modificacion' => $this->fecha_modificacion?->format('Y-m-d H:i:s'),
            'activo' => $this->activo
        ];
    }

    /**
     * Calcular distancia a otro punto en kilómetros
     */
    public function distanceTo(float $lat, float $lng): float
    {
        $earthRadius = 6371; // Radio de la Tierra en km

        $latFrom = deg2rad($this->lat);
        $lonFrom = deg2rad($this->lng);
        $latTo = deg2rad($lat);
        $lonTo = deg2rad($lng);

        $deltaLat = $latTo - $latFrom;
        $deltaLon = $lonTo - $lonFrom;

        $a = sin($deltaLat / 2) * sin($deltaLat / 2) +
             cos($latFrom) * cos($latTo) *
             sin($deltaLon / 2) * sin($deltaLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c, 2);
    }
}