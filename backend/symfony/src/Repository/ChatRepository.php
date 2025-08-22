<?php

namespace App\Repository;

use App\Entity\Chat;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class ChatRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Chat::class);
    }

    /**
     * Busca un chat existente entre un owner y un interested.
     */
    public function findChatBetweenUsers(int $ownerId, int $interestedId): ?Chat
    {
        return $this->createQueryBuilder('c')
            ->where('c.ownerUser = :owner')
            ->andWhere('c.interestedUser = :interested')
            ->setParameter('owner', $ownerId)
            ->setParameter('interested', $interestedId)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
