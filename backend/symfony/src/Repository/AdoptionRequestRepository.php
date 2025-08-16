<?php

namespace App\Repository;

use App\Entity\AdoptionRequest;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class AdoptionRequestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AdoptionRequest::class);
    }

    /**
     * Verifica si un usuario ya completó un formulario de adopción.
     *
     * @param User $user
     * @return AdoptionRequest|null
     */
    public function findOneByUser(User $user): ?AdoptionRequest
    {
        return $this->createQueryBuilder('ar')
            ->andWhere('ar.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
