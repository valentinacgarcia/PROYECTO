<?php

namespace App\Repository;

use App\Entity\Pet;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\QueryBuilder;

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

    /**
     * Encuentra mascotas disponibles para adopción con filtros
     */
    public function findAvailableForAdoption(array $filters = []): array
    {
        $qb = $this->createQueryBuilder('p')
            ->andWhere('p.is_adopted = :adopted')
            ->setParameter('adopted', true)
            ->orderBy('p.created_at', 'DESC');

        $this->applyFilters($qb, $filters);

        return $qb->getQuery()->getResult();
    }

    /**
     * Encuentra mascotas disponibles con paginación
     */
    public function findAvailableForAdoptionPaginated(
        array $filters = [],
        int $page = 1,
        int $limit = 12
    ): array {
        $qb = $this->createQueryBuilder('p')
            ->andWhere('p.is_adopted = :adopted')
            ->setParameter('adopted', true)
            ->orderBy('p.created_at', 'DESC');

        $this->applyFilters($qb, $filters);

        // Calcular offset
        $offset = ($page - 1) * $limit;

        // Obtener total de registros sin límite
        $totalQb = clone $qb;
        $totalQb->select('COUNT(p.id)');
        $total = $totalQb->getQuery()->getSingleScalarResult();

        // Aplicar paginación
        $qb->setFirstResult($offset)->setMaxResults($limit);
        $pets = $qb->getQuery()->getResult();

        return [
            'pets' => $pets,
            'total' => (int)$total,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => (int)ceil($total / $limit),
            'hasNext' => $page < ceil($total / $limit),
            'hasPrev' => $page > 1
        ];
    }

    /**
     * Aplicar filtros al QueryBuilder
     */
    private function applyFilters(QueryBuilder $qb, array $filters): void
    {
        // Filtro por región/ubicación
        if (!empty($filters['region']) && is_array($filters['region'])) {
            $qb->andWhere('p.location IN (:regions)')
                ->setParameter('regions', $filters['region']);
        }

        // Filtro por raza
        if (!empty($filters['raza']) && is_array($filters['raza'])) {
            $qb->andWhere('p.breed IN (:breeds)')
                ->setParameter('breeds', $filters['raza']);
        }

        // Filtro por género
        if (!empty($filters['genero']) && is_array($filters['genero'])) {
            $normalizedGenders = array_map([$this, 'normalizeGenderForQuery'], $filters['genero']);
            $qb->andWhere('LOWER(p.gender) IN (:genders)')
                ->setParameter('genders', $normalizedGenders);
        }

        // Filtro por edad (categorías)
        if (!empty($filters['edad']) && is_array($filters['edad'])) {
            $this->applyAgeFilter($qb, $filters['edad']);
        }

        // Filtro por tamaño
        if (!empty($filters['tamaño']) && is_array($filters['tamaño'])) {
            $normalizedSizes = array_map([$this, 'normalizeSizeForQuery'], $filters['tamaño']);
            $qb->andWhere('LOWER(p.size) IN (:sizes)')
                ->setParameter('sizes', $normalizedSizes);
        }

        // Filtro por colores
        if (!empty($filters['colors']) && is_array($filters['colors'])) {
            $colorConditions = [];
            foreach ($filters['colors'] as $index => $color) {
                $colorConditions[] = "p.colors LIKE :color{$index}";
                $qb->setParameter("color{$index}", '%"' . strtolower($color) . '"%');
            }
            if (!empty($colorConditions)) {
                $qb->andWhere('(' . implode(' OR ', $colorConditions) . ')');
            }
        }

        // Filtro por largo de pelaje
        if (!empty($filters['largoPelaje']) && is_array($filters['largoPelaje'])) {
            $normalizedFurLengths = array_map([$this, 'normalizeFurLengthForQuery'], $filters['largoPelaje']);
            $qb->andWhere('LOWER(p.fur_length) IN (:furLengths)')
                ->setParameter('furLengths', $normalizedFurLengths);
        }

        // Filtro por castrado
        if (!empty($filters['castrado']) && is_array($filters['castrado'])) {
            $qb->andWhere('p.sterilized IN (:sterilized)')
                ->setParameter('sterilized', $filters['castrado']); // ✅ Usar ["Sí"] directamente
        }

        if (!empty($filters['compatibilidad']) && is_array($filters['compatibilidad'])) {
        $compatibilityConditions = [];
        foreach ($filters['compatibilidad'] as $index => $compa) {
            $compatibilityConditions[] = "p.compatibility LIKE :compatibilidad{$index}";
            $qb->setParameter("compatibilidad{$index}", '%"' . $compa . '"%');
        }
        if (!empty($compatibilityConditions)) {
            $qb->andWhere('(' . implode(' OR ', $compatibilityConditions) . ')');
        }
    }
        // Filtro por tipo de mascota
        if (!empty($filters['tipo']) && is_array($filters['tipo'])) {
            $normalizedTypes = array_map([$this, 'normalizeTypeForQuery'], $filters['tipo']);
            $qb->andWhere('LOWER(p.type) IN (:types)')
                ->setParameter('types', $normalizedTypes);
        }

        // Filtro por vacunación
        if (!empty($filters['vacunado'])) {
            $qb->andWhere('p.vaccinated = :vaccinated')
                ->setParameter('vaccinated', $filters['vacunado'] === 'Sí');
        }

        // Filtro por user_id
        if (!empty($filters['exclude_user_id']) && is_numeric($filters['exclude_user_id'])) {
            $qb->leftJoin('p.owner', 'owner')
            ->andWhere('owner.id != :excludeUserId OR owner.id IS NULL')
            ->setParameter('excludeUserId', (int) $filters['exclude_user_id']);
        }
    }

    private function applyAgeFilter(QueryBuilder $qb, array $ageCategories): void
    {
        $ageConditions = [];
        foreach ($ageCategories as $category) {
            switch ($category) {
                case 'Cachorro':
                    $ageConditions[] = '(p.age_years * 12 + p.age_months) <= 12'; 
                    break;
                case 'Joven':
                    $ageConditions[] = '(p.age_years * 12 + p.age_months) > 12 AND (p.age_years * 12 + p.age_months) <= 36';
                    break;
                case 'Adulto':
                    $ageConditions[] = '(p.age_years * 12 + p.age_months) > 36 AND (p.age_years * 12 + p.age_months) <= 96';
                    break;
                case 'Senior':
                    $ageConditions[] = '(p.age_years * 12 + p.age_months) > 96';
                    break;
            }
        }

        if (!empty($ageConditions)) {
            $qb->andWhere('(' . implode(' OR ', $ageConditions) . ')');
        }
    }

    /**
     * Obtener todas las opciones disponibles para filtros
     */
    public function getFilterOptions(): array
    {
        // Obtener regiones/ubicaciones únicas
        $regions = $this->createQueryBuilder('p')
            ->select('DISTINCT p.location')
            ->where('p.location IS NOT NULL')
            ->andWhere('p.location != :empty')
            ->andWhere('p.isAdopted = :adopted')
            ->setParameter('empty', '')
            ->setParameter('adopted', true)
            ->orderBy('p.location', 'ASC')
            ->getQuery()
            ->getScalarResult();

        // Obtener razas únicas
        $breeds = $this->createQueryBuilder('p')
            ->select('DISTINCT p.breed')
            ->where('p.breed IS NOT NULL')
            ->andWhere('p.breed != :empty')
            ->andWhere('p.isAdopted = :adopted')
            ->setParameter('empty', '')
            ->setParameter('adopted', true)
            ->orderBy('p.breed', 'ASC')
            ->getQuery()
            ->getScalarResult();

        // Obtener tipos únicos
        $types = $this->createQueryBuilder('p')
            ->select('DISTINCT p.type')
            ->where('p.type IS NOT NULL')
            ->andWhere('p.type != :empty')
            ->andWhere('p.isAdopted = :adopted')
            ->setParameter('empty', '')
            ->setParameter('adopted', true)
            ->orderBy('p.type', 'ASC')
            ->getQuery()
            ->getScalarResult();

        // Extraer valores únicos de arrays
        $regions = array_column($regions, 'location');
        $breeds = array_column($breeds, 'breed');
        $types = array_column($types, 'type');

        return [
            'regiones' => array_values(array_filter($regions)),
            'razas' => array_values(array_filter($breeds)),
            'tipos' => array_values(array_filter($types)),
            'generos' => ['Macho', 'Hembra'],
            'edades' => ['Cachorro', 'Joven', 'Adulto', 'Senior'],
            'tamaños' => ['Pequeño', 'Mediano', 'Grande'],
            'colores' => ['Blanco', 'Negro', 'Marrón', 'Otro'],
            'largoPelaje' => ['Corto', 'Medio', 'Largo'],
            'castrado' => ['Sí', 'No'],
            'compatibilidad' => ['Niños', 'Perros', 'Gatos']
        ];
    }

    /**
     * Buscar mascotas por texto libre
     */
    public function searchByText(string $searchTerm): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.isAdopted = :adopted')
            ->andWhere('
                LOWER(p.name) LIKE LOWER(:search) OR 
                LOWER(p.breed) LIKE LOWER(:search) OR 
                LOWER(p.description) LIKE LOWER(:search) OR 
                LOWER(p.location) LIKE LOWER(:search)
            ')
            ->setParameter('adopted', true)
            ->setParameter('search', '%' . $searchTerm . '%')
            ->orderBy('p.created_at', 'DESC')
            ->getQuery()
            ->getResult();
    }

    // Métodos de normalización para queries
    private function normalizeGenderForQuery(string $gender): string
    {
        return match (strtolower($gender)) {
            'macho' => 'macho',
            'hembra' => 'hembra',
            default => strtolower($gender)
        };
    }

    private function normalizeSizeForQuery(string $size): string
    {
        return match (strtolower($size)) {
            'pequeño' => 'pequeño',
            'mediano' => 'mediano',
            'grande' => 'grande',
            default => strtolower($size)
        };
    }

    private function normalizeColorForQuery(string $color): string
    {
        return match (strtolower($color)) {
            'blanco' => 'blanco',
            'negro' => 'negro',
            'marrón' => 'marrón',
            'otro' => 'otro',
            default => strtolower($color)
        };
    }

    private function normalizeFurLengthForQuery(string $furLength): string
    {
        return match (strtolower($furLength)) {
            'corto' => 'corto',
            'medio' => 'medio',
            'largo' => 'largo',
            default => strtolower($furLength)
        };
    }

    // NUEVO MÉTODO para normalizar tipos
    private function normalizeTypeForQuery(string $type): string
    {
        return match (strtolower($type)) {
            'perro' => 'perro',
            'gato' => 'gato',
            default => strtolower($type)
        };
    }
}