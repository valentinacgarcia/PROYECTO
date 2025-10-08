<?php

namespace App\Repository;

use App\Entity\PetLike;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PetLikeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PetLike::class);
    }

    /**
     * Busca las solicitudes pendientes para mascotas que tiene un dueño dado.
     *
     * @param User $userId
     * @return PetLike[]
     */
    public function findPendingByOwner(User $userId): array
    {
        return $this->createQueryBuilder('pl')
            ->join('pl.pet', 'p')
            ->andWhere('p.owner = :owner')
            ->andWhere('pl.status = :pending')
            ->setParameter('owner', $userId)
            ->setParameter('pending', 'pending')
            ->getQuery()
            ->getResult();
    }

    /**
     * Busca los matches aceptados para un usuario interesado.
     *
     * @param User $interestedUser
     * @return PetLike[]
     */
    public function findAcceptedByInterestedUser(User $interestedUser): array
    {
        return $this->createQueryBuilder('pl')
            ->andWhere('pl.interestedUser = :user')
            ->andWhere('pl.status = :accepted')
            ->setParameter('user', $interestedUser)
            ->setParameter('accepted', 'APPROVED')
            ->getQuery()
            ->getResult();
    }

    public function findAllByOwner(User $owner): array
    {
        return $this->createQueryBuilder('pl')
            ->join('pl.pet', 'p')
            ->where('p.owner = :owner')
            ->setParameter('owner', $owner)
            ->orderBy('pl.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

}
