<?php

namespace App\Repository;

use App\Entity\Marcador;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class MarcadorRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Marcador::class);
    }

    /**
     * Buscar marcadores por nombre o descripción
     */
    public function searchByText(string $query, int $limit = 20): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.activo = :activo')
            ->andWhere('(m.name LIKE :query OR m.description LIKE :query OR m.address LIKE :query)')
            ->setParameter('activo', true)
            ->setParameter('query', '%' . $query . '%')
            ->orderBy('m.name', 'ASC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtener marcadores por precisión de geocodificación
     */
    public function findByAccuracy(string $accuracy): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.activo = :activo')
            ->andWhere('m.accuracy = :accuracy')
            ->setParameter('activo', true)
            ->setParameter('accuracy', $accuracy)
            ->orderBy('m.fecha_creacion', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtener marcadores sin geocodificar (solo coordenadas manuales)
     */
    public function findUngeocoded(): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.activo = :activo')
            ->andWhere('m.geocoding_provider IS NULL')
            ->setParameter('activo', true)
            ->orderBy('m.fecha_creacion', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Obtener estadísticas de marcadores
     */
    public function getStats(): array
    {
        $connection = $this->getEntityManager()->getConnection();

        // Conteo total
        $totalQuery = $connection->prepare('SELECT COUNT(*) as total FROM marcadores WHERE activo = 1');
        $total = $totalQuery->executeQuery()->fetchAssociative()['total'];

        // Por proveedor de geocodificación
        $providersQuery = $connection->prepare('
            SELECT geocoding_provider, COUNT(*) as count 
            FROM marcadores 
            WHERE activo = 1 
            GROUP BY geocoding_provider
        ');
        $providers = $providersQuery->executeQuery()->fetchAllAssociative();

        // Por precisión
        $accuracyQuery = $connection->prepare('
            SELECT accuracy, COUNT(*) as count 
            FROM marcadores 
            WHERE activo = 1 AND accuracy IS NOT NULL
            GROUP BY accuracy
        ');
        $accuracy = $accuracyQuery->executeQuery()->fetchAllAssociative();

        return [
            'total_marcadores' => (int) $total,
            'por_proveedor' => $providers,
            'por_precision' => $accuracy,
            'fecha_consulta' => date('Y-m-d H:i:s')
        ];
    }

    /**
     * Encontrar marcadores duplicados (misma ubicación aproximada)
     */
    public function findPossibleDuplicates(float $tolerance = 0.001): array
    {
        $sql = "
            SELECT m1.id as id1, m1.name as name1, m1.lat as lat1, m1.lng as lng1,
                   m2.id as id2, m2.name as name2, m2.lat as lat2, m2.lng as lng2,
                   ABS(m1.lat - m2.lat) + ABS(m1.lng - m2.lng) as distance_approx
            FROM marcadores m1
            JOIN marcadores m2 ON m1.id < m2.id
            WHERE m1.activo = 1 AND m2.activo = 1
            AND ABS(m1.lat - m2.lat) < :tolerance
            AND ABS(m1.lng - m2.lng) < :tolerance
            ORDER BY distance_approx ASC
        ";

        $connection = $this->getEntityManager()->getConnection();
        $stmt = $connection->prepare($sql);
        
        return $stmt->executeQuery(['tolerance' => $tolerance])->fetchAllAssociative();
    }

    /**
     * Buscar marcadores en un área rectangular
     */
    public function findInBounds(float $northLat, float $southLat, float $eastLng, float $westLng): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.activo = :activo')
            ->andWhere('m.lat BETWEEN :southLat AND :northLat')
            ->andWhere('m.lng BETWEEN :westLng AND :eastLng')
            ->setParameter('activo', true)
            ->setParameter('southLat', $southLat)
            ->setParameter('northLat', $northLat)
            ->setParameter('westLng', $westLng)
            ->setParameter('eastLng', $eastLng)
            ->getQuery()
            ->getResult();
    }
}