<?php

namespace App\Entity;

use App\Repository\ChatRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

#[ORM\Entity(repositoryClass: ChatRepository::class)]
class Chat
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type:"integer")]
    private $id;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private $ownerUser; // dueño de la mascota

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private $interestedUser; // interesado en la mascota

    #[ORM\OneToMany(mappedBy:"chat", targetEntity: Message::class, cascade:["persist", "remove"])]
    private $messages;

    #[ORM\Column(type: "string", length: 255, nullable: true)]
    private ?string $petName = null;

    #[ORM\Column(type: "datetime")]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(type: "datetime")]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct() {
        $this->messages = new ArrayCollection();
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    public function getId(): ?int { 
        return $this->id; 
    }

    public function getOwnerUser(): ?User { 
        return $this->ownerUser; 
    }

    public function setOwnerUser(User $ownerUser): self { 
        $this->ownerUser = $ownerUser; 
        return $this; 
    }

    public function getInterestedUser(): ?User { 
        return $this->interestedUser; 
    }

    public function setInterestedUser(User $interestedUser): self { 
        $this->interestedUser = $interestedUser; 
        return $this; 
    }

    /**
     * @return Collection|Message[]
     */
    public function getMessages(): Collection {
        return $this->messages;
    }

    public function addMessage(Message $message): self {
        if (!$this->messages->contains($message)) {
            $this->messages[] = $message;
            $message->setChat($this);
        }
        return $this;
    }

    public function removeMessage(Message $message): self {
        if ($this->messages->removeElement($message)) {
            if ($message->getChat() === $this) {
                $message->setChat(null);
            }
        }
        return $this;
    }

    public function getPetName(): ?string
    {
        return $this->petName;
    }

    public function setPetName(?string $petName): self
    {
        $this->petName = $petName;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeInterface $createdAt): self
    {
        $this->createdAt = $createdAt;
        return $this;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeInterface $updatedAt): self
    {
        $this->updatedAt = $updatedAt;
        return $this;
    }

    /**
     * Método que se ejecuta antes de actualizar para cambiar updatedAt automáticamente
     */
    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTime();
    }
}