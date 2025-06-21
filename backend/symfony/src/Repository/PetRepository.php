<?php

namespace App\Repository;

use App\Entity\Pet;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PetRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Pet::class);
    }

    public function save(Pet $pet): void
    {
        $this->_em->persist($pet);
        $this->_em->flush();
    }

    public function remove(Pet $pet): void
    {
        $this->_em->remove($pet);
        $this->_em->flush();
    }
}
