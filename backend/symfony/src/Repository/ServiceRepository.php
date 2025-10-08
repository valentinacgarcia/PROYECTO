<?php

namespace App\Repository;

use App\Entity\Service;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Service>
 */
class ServiceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Service::class);
    }

    public function save(Service $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Service $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Buscar servicios con filtros
     */
    public function findWithFilters(array $filters = []): array
    {
        $qb = $this->createQueryBuilder('s')
            ->where('s.isActive = :active')
            ->setParameter('active', true)
            ->orderBy('s.createdAt', 'DESC');

        // Filtro por categoría
        if (!empty($filters['category'])) {
            $qb->andWhere('s.category = :category')
               ->setParameter('category', $filters['category']);
        }

        // Filtro por modalidad
        if (!empty($filters['modality'])) {
            $qb->andWhere('s.modalities LIKE :modality')
               ->setParameter('modality', '%"' . $filters['modality'] . '"%');
        }

        // Filtro por tipo de precio
        if (!empty($filters['priceType'])) {
            $qb->andWhere('s.priceType IN (:priceTypes)')
               ->setParameter('priceTypes', $filters['priceType']);
        }

        // Filtro por días de disponibilidad
        if (!empty($filters['availabilityDays']) && is_array($filters['availabilityDays'])) {
            $dayConditions = [];
            foreach ($filters['availabilityDays'] as $index => $day) {
                $dayConditions[] = 's.availabilityDays LIKE :day' . $index;
                $qb->setParameter('day' . $index, '%"' . $day . '"%');
            }
            if (!empty($dayConditions)) {
                $qb->andWhere('(' . implode(' OR ', $dayConditions) . ')');
            }
        } elseif (!empty($filters['availabilityDays']) && is_string($filters['availabilityDays'])) {
            // Si viene como string individual
            $qb->andWhere('s.availabilityDays LIKE :day')
               ->setParameter('day', '%"' . $filters['availabilityDays'] . '"%');
        }

        // Filtro por rango de precio
        if (!empty($filters['minPrice'])) {
            $qb->andWhere('s.price >= :minPrice')
               ->setParameter('minPrice', $filters['minPrice']);
        }

        if (!empty($filters['maxPrice'])) {
            $qb->andWhere('s.price <= :maxPrice')
               ->setParameter('maxPrice', $filters['maxPrice']);
        }

        // Búsqueda por texto
        if (!empty($filters['search'])) {
            $qb->andWhere('(s.serviceName LIKE :search OR s.description LIKE :search OR s.address LIKE :search)')
               ->setParameter('search', '%' . $filters['search'] . '%');
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Buscar servicios con paginación
     */
    public function findWithPagination(array $filters = [], int $page = 1, int $limit = 12): array
    {
        $offset = ($page - 1) * $limit;
        
        $qb = $this->createQueryBuilder('s')
            ->where('s.isActive = :active')
            ->setParameter('active', true)
            ->orderBy('s.createdAt', 'DESC')
            ->setFirstResult($offset)
            ->setMaxResults($limit);

        // Aplicar filtros (misma lógica que findWithFilters)
        if (!empty($filters['category'])) {
            $qb->andWhere('s.category = :category')
               ->setParameter('category', $filters['category']);
        }

        if (!empty($filters['modality'])) {
            $qb->andWhere('s.modalities LIKE :modality')
               ->setParameter('modality', '%"' . $filters['modality'] . '"%');
        }

        if (!empty($filters['priceType'])) {
            $qb->andWhere('s.priceType IN (:priceTypes)')
               ->setParameter('priceTypes', $filters['priceType']);
        }

        if (!empty($filters['availabilityDays']) && is_array($filters['availabilityDays'])) {
            $dayConditions = [];
            foreach ($filters['availabilityDays'] as $index => $day) {
                $dayConditions[] = 's.availabilityDays LIKE :day' . $index;
                $qb->setParameter('day' . $index, '%"' . $day . '"%');
            }
            if (!empty($dayConditions)) {
                $qb->andWhere('(' . implode(' OR ', $dayConditions) . ')');
            }
        } elseif (!empty($filters['availabilityDays']) && is_string($filters['availabilityDays'])) {
            $qb->andWhere('s.availabilityDays LIKE :day')
               ->setParameter('day', '%"' . $filters['availabilityDays'] . '"%');
        }

        if (!empty($filters['minPrice'])) {
            $qb->andWhere('s.price >= :minPrice')
               ->setParameter('minPrice', $filters['minPrice']);
        }

        if (!empty($filters['maxPrice'])) {
            $qb->andWhere('s.price <= :maxPrice')
               ->setParameter('maxPrice', $filters['maxPrice']);
        }

        if (!empty($filters['search'])) {
            $qb->andWhere('(s.serviceName LIKE :search OR s.description LIKE :search OR s.address LIKE :search)')
               ->setParameter('search', '%' . $filters['search'] . '%');
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Contar total de servicios con filtros
     */
    public function countWithFilters(array $filters = []): int
    {
        $qb = $this->createQueryBuilder('s')
            ->select('COUNT(s.id)')
            ->where('s.isActive = :active')
            ->setParameter('active', true);

        // Aplicar los mismos filtros
        if (!empty($filters['category'])) {
            $qb->andWhere('s.category = :category')
               ->setParameter('category', $filters['category']);
        }

        if (!empty($filters['modality'])) {
            $qb->andWhere('s.modalities LIKE :modality')
               ->setParameter('modality', '%"' . $filters['modality'] . '"%');
        }

        if (!empty($filters['priceType'])) {
            $qb->andWhere('s.priceType IN (:priceTypes)')
               ->setParameter('priceTypes', $filters['priceType']);
        }

        if (!empty($filters['availabilityDays']) && is_array($filters['availabilityDays'])) {
            $dayConditions = [];
            foreach ($filters['availabilityDays'] as $index => $day) {
                $dayConditions[] = 's.availabilityDays LIKE :day' . $index;
                $qb->setParameter('day' . $index, '%"' . $day . '"%');
            }
            if (!empty($dayConditions)) {
                $qb->andWhere('(' . implode(' OR ', $dayConditions) . ')');
            }
        } elseif (!empty($filters['availabilityDays']) && is_string($filters['availabilityDays'])) {
            $qb->andWhere('s.availabilityDays LIKE :day')
               ->setParameter('day', '%"' . $filters['availabilityDays'] . '"%');
        }

        if (!empty($filters['minPrice'])) {
            $qb->andWhere('s.price >= :minPrice')
               ->setParameter('minPrice', $filters['minPrice']);
        }

        if (!empty($filters['maxPrice'])) {
            $qb->andWhere('s.price <= :maxPrice')
               ->setParameter('maxPrice', $filters['maxPrice']);
        }

        if (!empty($filters['search'])) {
            $qb->andWhere('(s.serviceName LIKE :search OR s.description LIKE :search OR s.address LIKE :search)')
               ->setParameter('search', '%' . $filters['search'] . '%');
        }

        return $qb->getQuery()->getSingleScalarResult();
    }
}
