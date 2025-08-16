<?php

namespace App\Entity;

use App\Repository\AdoptionRequestRepository;
use Doctrine\ORM\Mapping as ORM;
use App\Enum\RequestStatus;
use App\Enum\SleepingLocation;
use App\Entity\User;

#[ORM\Entity(repositoryClass: AdoptionRequestRepository::class)]
#[ORM\Table(name: 'adoption_requests')]
class AdoptionRequest
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'bigint')]
    private int $id;

    // USER RELATION
    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'adoptionRequests')]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    // HOUSING INFORMATION
    #[ORM\Column(type: 'boolean')]
    private bool $isHouse;

    #[ORM\Column(type: 'boolean')]
    private bool $isOwner;

    #[ORM\Column(type: 'boolean')]
    private bool $hasYard;

    #[ORM\Column(type: 'boolean')]
    private bool $hasSecurity;

    // HOUSEHOLD COMPOSITION
    #[ORM\Column(type: 'integer')]
    private int $householdMembers;

    #[ORM\Column(type: 'boolean')]
    private bool $hasChildren;

    #[ORM\Column(type: 'boolean')]
    private bool $hasAllergies;

    #[ORM\Column(type: 'boolean')]
    private bool $adoptionAgreement;

    // PET EXPERIENCE
    #[ORM\Column(type: 'boolean')]
    private bool $hadPetsBefore;

    #[ORM\Column(type: 'boolean')]
    private bool $hasCurrentPets;

    #[ORM\Column(type: 'boolean', nullable: true)]
    private ?bool $petsVaccinated;

    // CARE AND ROUTINE
    #[ORM\Column(type: 'integer')]
    private int $hoursAlonePerDay;

    #[ORM\Column(type: 'string', enumType: SleepingLocation::class)]
    private SleepingLocation $sleepingLocation;

    #[ORM\Column(type: 'string', length: 255)]
    private string $caretaker;

    #[ORM\Column(type: 'boolean')]
    private bool $willNeuterVaccinate;

    // METADATA
    #[ORM\Column(type: 'datetime_immutable', options: ['default' => 'CURRENT_TIMESTAMP'])]
    private \DateTimeImmutable $submittedAt;

    #[ORM\Column(type: 'string', enumType: RequestStatus::class)]
    private RequestStatus $status;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $notes;

    // CONSTRUCTOR
    public function __construct(
        User $user,
        bool $isHouse,
        bool $isOwner,
        bool $hasYard,
        bool $hasSecurity,
        int $householdMembers,
        bool $hasChildren,
        bool $hasAllergies,
        bool $adoptionAgreement,
        bool $hadPetsBefore,
        bool $hasCurrentPets,
        int $hoursAlonePerDay,
        SleepingLocation $sleepingLocation,
        string $caretaker,
        bool $willNeuterVaccinate,
        ?bool $petsVaccinated = null,
        ?string $notes = null
    ) {
        $this->user = $user;
        $this->isHouse = $isHouse;
        $this->isOwner = $isOwner;
        $this->hasYard = $hasYard;
        $this->hasSecurity = $hasSecurity;
        $this->householdMembers = $householdMembers;
        $this->hasChildren = $hasChildren;
        $this->hasAllergies = $hasAllergies;
        $this->adoptionAgreement = $adoptionAgreement;
        $this->hadPetsBefore = $hadPetsBefore;
        $this->hasCurrentPets = $hasCurrentPets;
        $this->hoursAlonePerDay = $hoursAlonePerDay;
        $this->sleepingLocation = $sleepingLocation;
        $this->caretaker = $caretaker;
        $this->willNeuterVaccinate = $willNeuterVaccinate;
        $this->petsVaccinated = $petsVaccinated;
        $this->notes = $notes;

        $this->submittedAt = new \DateTimeImmutable();
        $this->status = RequestStatus::PENDING;
    }

    public function getId(): int { return $this->id; }
    public function getUser(): User { return $this->user; }
    public function setUser(User $user): self { $this->user = $user; return $this; }
    public function getIsHouse(): bool { return $this->isHouse; }
    public function setIsHouse(bool $isHouse): self { $this->isHouse = $isHouse; return $this; }
    public function getIsOwner(): bool { return $this->isOwner; }
    public function setIsOwner(bool $isOwner): self { $this->isOwner = $isOwner; return $this; }
    public function getHasYard(): bool { return $this->hasYard; }
    public function setHasYard(bool $hasYard): self { $this->hasYard = $hasYard; return $this; }
    public function getHasSecurity(): bool { return $this->hasSecurity; }
    public function setHasSecurity(bool $hasSecurity): self { $this->hasSecurity = $hasSecurity; return $this; }
    public function getHouseholdMembers(): int { return $this->householdMembers; }
    public function setHouseholdMembers(int $householdMembers): self { $this->householdMembers = $householdMembers; return $this; }
    public function getHasChildren(): bool { return $this->hasChildren; }
    public function setHasChildren(bool $hasChildren): self { $this->hasChildren = $hasChildren; return $this; }
    public function getHasAllergies(): bool { return $this->hasAllergies; }
    public function setHasAllergies(bool $hasAllergies): self { $this->hasAllergies = $hasAllergies; return $this; }
    public function getAdoptionAgreement(): bool { return $this->adoptionAgreement; }
    public function setAdoptionAgreement(bool $adoptionAgreement): self { $this->adoptionAgreement = $adoptionAgreement; return $this; }
    public function getHadPetsBefore(): bool { return $this->hadPetsBefore; }
    public function setHadPetsBefore(bool $hadPetsBefore): self { $this->hadPetsBefore = $hadPetsBefore; return $this; }
    public function getHasCurrentPets(): bool { return $this->hasCurrentPets; }
    public function setHasCurrentPets(bool $hasCurrentPets): self { $this->hasCurrentPets = $hasCurrentPets; return $this; }
    public function getPetsVaccinated(): ?bool { return $this->petsVaccinated; }
    public function setPetsVaccinated(?bool $petsVaccinated): self { $this->petsVaccinated = $petsVaccinated; return $this; }
    public function getHoursAlonePerDay(): int { return $this->hoursAlonePerDay; }
    public function setHoursAlonePerDay(int $hoursAlonePerDay): self { $this->hoursAlonePerDay = $hoursAlonePerDay; return $this; }
    public function getSleepingLocation(): SleepingLocation { return $this->sleepingLocation; }
    public function setSleepingLocation(SleepingLocation $sleepingLocation): self { $this->sleepingLocation = $sleepingLocation; return $this; }
    public function getCaretaker(): string { return $this->caretaker; }
    public function setCaretaker(string $caretaker): self { $this->caretaker = $caretaker; return $this; }
    public function getWillNeuterVaccinate(): bool { return $this->willNeuterVaccinate; }
    public function setWillNeuterVaccinate(bool $willNeuterVaccinate): self { $this->willNeuterVaccinate = $willNeuterVaccinate; return $this; }
    public function getSubmittedAt(): \DateTimeImmutable { return $this->submittedAt; }
    public function getStatus(): RequestStatus { return $this->status; }
    public function setStatus(RequestStatus $status): self { $this->status = $status; return $this; }
    public function getNotes(): ?string { return $this->notes; }
    public function setNotes(?string $notes): self { $this->notes = $notes; return $this; }
}
