<?php

namespace App\Controller;

use App\Entity\Pet;
use App\Entity\Adoption;
use App\Entity\PetLike;
use App\Repository\PetRepository;
use App\Repository\AdoptionRepository;
use App\Repository\UserRepository;
use App\Repository\PetLikeRepository;
use App\Service\GeocodingService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/dashboard')]
class DashboardController extends AbstractController
{
    private EntityManagerInterface $em;
    private PetRepository $petRepository;
    private AdoptionRepository $adoptionRepository;
    private UserRepository $userRepository;
    private PetLikeRepository $petLikeRepository;
    private GeocodingService $geocodingService;

    public function __construct(
        EntityManagerInterface $em,
        PetRepository $petRepository,
        AdoptionRepository $adoptionRepository,
        UserRepository $userRepository,
        PetLikeRepository $petLikeRepository,
        GeocodingService $geocodingService
    ) {
        $this->em = $em;
        $this->petRepository = $petRepository;
        $this->adoptionRepository = $adoptionRepository;
        $this->userRepository = $userRepository;
        $this->petLikeRepository = $petLikeRepository;
        $this->geocodingService = $geocodingService;
    }

    #[Route('/personal/{userId}', name: 'dashboard_personal', methods: ['GET'])]
    public function getPersonalDashboard(int $userId): JsonResponse
    {
        $user = $this->userRepository->find($userId);
        if (!$user) {
            return $this->json(['error' => 'Usuario no encontrado'], 404);
        }

        // Obtener todas las mascotas actuales del usuario con eager loading
        $petsActuales = $this->petRepository->createQueryBuilder('p')
            ->where('p.owner = :owner')
            ->setParameter('owner', $user)
            ->getQuery()
            ->getResult();
        
        // Obtener mascotas que el usuario DIO en adopción usando PetLike con eager loading
        // PetLike.ownerUser = usuario indica que el usuario era el dueño original
        $petLikes = $this->petLikeRepository->createQueryBuilder('pl')
            ->select('pl', 'pet')
            ->join('pl.pet', 'pet')
            ->where('pl.ownerUser = :owner')
            ->setParameter('owner', $user)
            ->getQuery()
            ->getResult();
        
        $petIdsDadasEnAdopcion = [];
        foreach ($petLikes as $petLike) {
            $petId = $petLike->getPet()->getId();
            if (!in_array($petId, $petIdsDadasEnAdopcion)) {
                $petIdsDadasEnAdopcion[] = $petId;
            }
        }
        
        // Verificar si el usuario tiene mascotas dadas en adopción
        $hasPetsInAdoption = !empty($petIdsDadasEnAdopcion);
        
        // Obtener todas las mascotas (actuales + las que dio en adopción)
        $todasLasMascotas = $petsActuales;
        if (!empty($petIdsDadasEnAdopcion)) {
            $petsDadasEnAdopcion = $this->petRepository->createQueryBuilder('p')
                ->where('p.id IN (:ids)')
                ->setParameter('ids', $petIdsDadasEnAdopcion)
                ->getQuery()
                ->getResult();
            // Combinar, evitando duplicados
            $petIdsActuales = array_map(fn($p) => $p->getId(), $petsActuales);
            foreach ($petsDadasEnAdopcion as $pet) {
                if (!in_array($pet->getId(), $petIdsActuales)) {
                    $todasLasMascotas[] = $pet;
                }
            }
        }
        
        $pets = $todasLasMascotas;
        
        // Obtener adopciones completadas usando la query SQL exacta que funciona
        // Esta query encuentra las mascotas que el usuario DIO en adopción y fueron adoptadas
        $adopcionesCompletadas = [];
        
        $sql = "
            SELECT a.id AS adoption_id
            FROM adoptions a
            JOIN pet_like pl
                ON pl.pet_id = a.pet_id
                AND pl.interested_user_id = a.user_id
                AND pl.status = 'APPROVED'
            JOIN pets p
                ON p.id = a.pet_id
            WHERE pl.owner_user_id = ?
              AND a.adoption_date IS NOT NULL
        ";
        
        $connection = $this->em->getConnection();
        $adoptionIds = $connection->fetchAllAssociative($sql, [$user->getId()]);
        
        // Obtener las entidades Adoption usando los IDs encontrados con eager loading
        if (!empty($adoptionIds)) {
            $ids = array_column($adoptionIds, 'adoption_id');
            if (!empty($ids)) {
                $adopcionesCompletadas = $this->adoptionRepository->createQueryBuilder('a')
                    ->select('a', 'pet', 'user')
                    ->join('a.pet', 'pet')
                    ->join('a.user', 'user')
                    ->where('a.id IN (:ids)')
                    ->setParameter('ids', $ids)
                    ->getQuery()
                    ->getResult();
            }
        }
        
        
        // Estadísticas básicas
        // Total: mascotas actuales + mascotas que dio en adopción (aunque ya no sean suyas)
        $total = count($pets);
        
        // En Adopción: solo mascotas actuales que están disponibles para adopción
        $enAdopcion = count(array_filter($petsActuales, fn($pet) => $pet->isAdopted() === true));
        
        // Adoptadas: mascotas que el usuario dio en adopción y fueron adoptadas exitosamente
        $adoptadas = $this->getAdoptedPetsCount($user, $pets, $adopcionesCompletadas);

        // Adopciones mensuales
        $adopcionesMensuales = $this->getMonthlyAdoptions($pets, $adopcionesCompletadas);

        // Distribución por tamaño (solo mascotas que fueron adoptadas exitosamente)
        $porTamanio = $this->getSizeDistribution($pets, $adopcionesCompletadas);

        // Distribución por género (solo mascotas que fueron adoptadas exitosamente)
        $porGenero = $this->getGenderDistribution($pets, $adopcionesCompletadas);

        // Última mascota (la última que fue adoptada exitosamente)
        $ultimaMascota = $this->getLastAdoptedPet($pets, $adopcionesCompletadas);

        // Tasas de éxito
        $tasaExitoGlobal = $this->getGlobalSuccessRate();
        $tasaExitoPropia = $this->getUserSuccessRate($user, $pets, $adopcionesCompletadas, $petLikes);

        // Engagement rate
        $engagementRate = $this->getEngagementRate($pets, $adopcionesCompletadas, $petLikes);

        // Duración promedio
        $duracionPromedio = $this->getAverageDuration($pets, $adopcionesCompletadas);

        // Zonas de adopción (solo calcular si se solicita explícitamente para mejorar rendimiento)
        // La geocodificación puede ser muy lenta, así que se hace opcional
        $includeZones = isset($_GET['include_zones']) && $_GET['include_zones'] === 'true';
        $zonasAdopcion = ($hasPetsInAdoption && $includeZones)
            ? $this->getAdoptionZones($pets, $adopcionesCompletadas, $petsActuales)
            : [];

        $data = [
            'total' => $total,
            'enAdopcion' => $enAdopcion,
            'adoptadas' => $adoptadas,
            'adopcionesMensuales' => $adopcionesMensuales,
            'porTamanio' => $porTamanio,
            'porGenero' => $porGenero,
            'ultimaMascota' => $ultimaMascota,
            'tasaExitoGlobal' => $tasaExitoGlobal,
            'tasaExitoPropia' => $tasaExitoPropia,
            'engagementRate' => $engagementRate,
            'duracionPromedio' => $duracionPromedio,
            'zonasAdopcion' => $zonasAdopcion,
            'hasPetsInAdoption' => $hasPetsInAdoption,
        ];

        // Agregar información de depuración si se solicita
        $debug = $_GET['debug'] ?? false;
        if ($debug) {
            $petLikesDebug = $this->petLikeRepository->findBy(['ownerUser' => $user]);
            $data['_debug'] = [
                'user_id' => $userId,
                'user_name' => $user->getName(),
                'user_email' => $user->getEmail(),
                'pets_actuales_count' => count($petsActuales),
                'pet_likes_count' => count($petLikesDebug),
                'pet_ids_dadas_en_adopcion' => $petIdsDadasEnAdopcion,
                'pets_count' => count($pets),
                'pets_details' => array_map(fn($pet) => [
                    'id' => $pet->getId(),
                    'name' => $pet->getName(),
                    'current_owner_id' => $pet->getOwner() ? $pet->getOwner()->getId() : null,
                    'current_owner_name' => $pet->getOwner() ? $pet->getOwner()->getName() : null,
                    'is_adopted' => $pet->isAdopted(),
                    'has_completed_adoption' => array_reduce($pet->getAdoptions()->toArray(), fn($carry, $a) => $carry || $a->isCompleted(), false),
                    'location' => $pet->getLocation(),
                ], $pets),
                'adopciones_completadas_count' => count($adopcionesCompletadas),
                'adopciones_completadas_details' => array_map(fn($adoption) => [
                    'adoption_id' => $adoption->getId(),
                    'pet_id' => $adoption->getPet()->getId(),
                    'pet_name' => $adoption->getPet()->getName(),
                    'current_owner_id' => $adoption->getPet()->getOwner()->getId(),
                    'current_owner_name' => $adoption->getPet()->getOwner()->getName(),
                    'adopter_id' => $adoption->getUser()->getId(),
                    'adopter_name' => $adoption->getUser()->getName(),
                    'adoption_date' => $adoption->getAdoptionDate() ? $adoption->getAdoptionDate()->format('Y-m-d') : null,
                    'pet_size' => $adoption->getPet()->getSize(),
                    'pet_gender' => $adoption->getPet()->getGender(),
                    'pet_location' => $adoption->getPet()->getLocation(),
                ], $adopcionesCompletadas),
                'stats' => [
                    'total' => $total,
                    'enAdopcion' => $enAdopcion,
                    'adoptadas' => $adoptadas,
                ],
            ];
        }
        
        return $this->json($data);
    }

    /**
     * Cuenta las mascotas que fueron adoptadas (tienen adopción completada)
     * Incluye mascotas actuales y mascotas que el usuario dio en adopción
     */
    private function getAdoptedPetsCount($user, array $pets, array $adopcionesCompletadas): int
    {
        $petIdsAdoptadas = [];
        
        // Contar mascotas con adopciones completadas
        foreach ($adopcionesCompletadas as $adoption) {
            $pet = $adoption->getPet();
            $petId = $pet->getId();
            
            // Solo contar una vez por mascota
            if (!in_array($petId, $petIdsAdoptadas)) {
                $petIdsAdoptadas[] = $petId;
            }
        }
        
        return count($petIdsAdoptadas);
    }

    /**
     * Obtiene las adopciones agrupadas por mes
     * Incluye adopciones de mascotas actuales y mascotas que el usuario dio en adopción
     */
    private function getMonthlyAdoptions(array $pets, array $adopcionesCompletadas): array
    {
        $meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        $adopcionesPorMes = array_fill_keys($meses, 0);

        // Contar adopciones completadas de las mascotas del usuario
        foreach ($adopcionesCompletadas as $adoption) {
            if ($adoption->getAdoptionDate()) {
                $mes = (int)$adoption->getAdoptionDate()->format('n') - 1; // 0-11
                if (isset($meses[$mes])) {
                    $adopcionesPorMes[$meses[$mes]]++;
                }
            }
        }

        return array_map(fn($mes, $cantidad) => ['mes' => $mes, 'cantidad' => $cantidad], 
                        array_keys($adopcionesPorMes), 
                        array_values($adopcionesPorMes));
    }

    /**
     * Distribución por tamaño (solo mascotas que fueron adoptadas exitosamente)
     * Incluye mascotas actuales y mascotas que el usuario dio en adopción
     */
    private function getSizeDistribution(array $pets, array $adopcionesCompletadas): array
    {
        $distribucion = [
            'Pequeño' => 0,
            'Mediano' => 0,
            'Grande' => 0,
        ];

        $petIdsProcesados = [];

        // Contar mascotas con adopciones completadas
        foreach ($adopcionesCompletadas as $adoption) {
            $pet = $adoption->getPet();
            $petId = $pet->getId();
            
            // Solo contar una vez por mascota
            if (!in_array($petId, $petIdsProcesados)) {
                $petIdsProcesados[] = $petId;
                $size = $pet->getSize();
                if ($size) {
                    // Normalizar el tamaño
                    $sizeNormalizado = ucfirst(strtolower($size));
                    if (isset($distribucion[$sizeNormalizado])) {
                        $distribucion[$sizeNormalizado]++;
                    } elseif (stripos($size, 'peque') !== false) {
                        $distribucion['Pequeño']++;
                    } elseif (stripos($size, 'median') !== false) {
                        $distribucion['Mediano']++;
                    } elseif (stripos($size, 'grande') !== false) {
                        $distribucion['Grande']++;
                    }
                }
            }
        }

        return array_map(fn($tamanio, $valor) => ['tamanio' => $tamanio, 'valor' => $valor],
                        array_keys($distribucion),
                        array_values($distribucion));
    }

    /**
     * Distribución por género (solo mascotas que fueron adoptadas exitosamente)
     * Incluye mascotas actuales y mascotas que el usuario dio en adopción
     */
    private function getGenderDistribution(array $pets, array $adopcionesCompletadas): array
    {
        $distribucion = [
            'Macho' => 0,
            'Hembra' => 0,
        ];

        $petIdsProcesados = [];

        // Contar mascotas con adopciones completadas
        foreach ($adopcionesCompletadas as $adoption) {
            $pet = $adoption->getPet();
            $petId = $pet->getId();
            
            // Solo contar una vez por mascota
            if (!in_array($petId, $petIdsProcesados)) {
                $petIdsProcesados[] = $petId;
                $gender = $pet->getGender();
                if ($gender) {
                    $genderNormalizado = ucfirst(strtolower($gender));
                    if (isset($distribucion[$genderNormalizado])) {
                        $distribucion[$genderNormalizado]++;
                    } elseif (stripos($gender, 'macho') !== false || stripos($gender, 'm') !== false) {
                        $distribucion['Macho']++;
                    } elseif (stripos($gender, 'hembra') !== false || stripos($gender, 'h') !== false || stripos($gender, 'f') !== false) {
                        $distribucion['Hembra']++;
                    }
                }
            }
        }

        return array_map(fn($genero, $valor) => ['genero' => $genero, 'valor' => $valor],
                        array_keys($distribucion),
                        array_values($distribucion));
    }

    /**
     * Obtiene la última mascota que fue adoptada exitosamente
     * Incluye mascotas actuales y mascotas que el usuario dio en adopción
     */
    private function getLastAdoptedPet(array $pets, array $adopcionesCompletadas): array
    {
        $mascotasAdoptadas = [];

        // Procesar adopciones completadas
        foreach ($adopcionesCompletadas as $adoption) {
            if ($adoption->getAdoptionDate()) {
                $mascotasAdoptadas[] = [
                    'pet' => $adoption->getPet(),
                    'adoption_date' => $adoption->getAdoptionDate(),
                ];
            }
        }

        if (empty($mascotasAdoptadas)) {
            return ['name' => 'N/A', 'fecha' => 'N/A'];
        }

        // Ordenar por fecha de adopción (más reciente primero)
        usort($mascotasAdoptadas, fn($a, $b) => $b['adoption_date'] <=> $a['adoption_date']);
        $ultima = $mascotasAdoptadas[0];

        return [
            'name' => $ultima['pet']->getName() ?? 'Sin nombre',
            'fecha' => $ultima['adoption_date']->format('Y-m-d'),
        ];
    }

    /**
     * Tasa de éxito global (todas las adopciones completadas / todas las mascotas en adopción)
     * Nota: is_adopted = 1 significa "disponible para adopción"
     */
    private function getGlobalSuccessRate(): float
    {
        $qb = $this->petRepository->createQueryBuilder('p');
        // is_adopted = 1 significa "disponible para adopción"
        $totalEnAdopcion = $qb->select('COUNT(p.id)')
            ->where('p.is_adopted = 1')
            ->getQuery()
            ->getSingleScalarResult();

        if ($totalEnAdopcion == 0) {
            return 0;
        }

        $qb2 = $this->adoptionRepository->createQueryBuilder('a');
        $adopcionesCompletadas = $qb2->select('COUNT(DISTINCT a.pet)')
            ->where("a.state = 'completed'")
            ->getQuery()
            ->getSingleScalarResult();

        return round(($adopcionesCompletadas / $totalEnAdopcion) * 100, 0);
    }

    /**
     * Tasa de éxito propia del usuario
     * Nota: is_adopted = true significa "disponible para adopción"
     * 
     * Calcula: (mascotas adoptadas / total de mascotas que estuvieron en adopción) * 100
     * Incluye mascotas actuales y mascotas que el usuario dio en adopción
     */
    private function getUserSuccessRate($user, array $pets, array $adopcionesCompletadas, array $petLikes): float
    {
        // Usar los PetLikes ya obtenidos (evitar consulta duplicada)
        $petIdsEnAdopcion = [];
        foreach ($petLikes as $petLike) {
            $petId = $petLike->getPet()->getId();
            if (!in_array($petId, $petIdsEnAdopcion)) {
                $petIdsEnAdopcion[] = $petId;
            }
        }
        
        // También incluir mascotas actuales que están en adopción
        foreach ($pets as $pet) {
            if ($pet->isAdopted() === true) {
                $petId = $pet->getId();
                if (!in_array($petId, $petIdsEnAdopcion)) {
                    $petIdsEnAdopcion[] = $petId;
                }
            }
        }
        
        $totalEnAdopcion = count($petIdsEnAdopcion);
        
        // Contar mascotas con adopciones completadas
        $petIdsAdoptadas = [];
        foreach ($adopcionesCompletadas as $adoption) {
            $petId = $adoption->getPet()->getId();
            if (!in_array($petId, $petIdsAdoptadas)) {
                $petIdsAdoptadas[] = $petId;
            }
        }
        $totalAdoptadas = count($petIdsAdoptadas);
        
        if ($totalEnAdopcion == 0) {
            return 0;
        }

        return round(($totalAdoptadas / $totalEnAdopcion) * 100, 0);
    }

    /**
     * Engagement rate: (adopciones completadas / total de likes recibidos) * 100
     * Incluye mascotas actuales y mascotas que el usuario dio en adopción
     */
    private function getEngagementRate(array $pets, array $adopcionesCompletadas, array $petLikes): float
    {
        $petIdsConAdopcion = [];

        // Obtener IDs de mascotas con adopciones completadas
        foreach ($adopcionesCompletadas as $adoption) {
            $petId = $adoption->getPet()->getId();
            if (!in_array($petId, $petIdsConAdopcion)) {
                $petIdsConAdopcion[] = $petId;
            }
        }

        if (empty($petIdsConAdopcion)) {
            return 0;
        }

        // Contar likes recibidos solo para mascotas con adopciones completadas
        // Usar una sola consulta en lugar de múltiples findBy dentro del loop
        $totalLikes = $this->petLikeRepository->createQueryBuilder('pl')
            ->select('COUNT(pl.id)')
            ->where('pl.pet IN (:petIds)')
            ->setParameter('petIds', $petIdsConAdopcion)
            ->getQuery()
            ->getSingleScalarResult();

        $adopcionesCompletadasCount = count($petIdsConAdopcion);

        if ($totalLikes == 0) {
            return 0;
        }

        return round(($adopcionesCompletadasCount / $totalLikes) * 100, 0);
    }

    /**
     * Duración promedio en días entre creación de mascota y adopción completada
     * Incluye mascotas actuales y mascotas que el usuario dio en adopción
     */
    private function getAverageDuration(array $pets, array $adopcionesCompletadas): float
    {
        $duraciones = [];
        $petIdsProcesados = [];

        // Procesar adopciones completadas
        foreach ($adopcionesCompletadas as $adoption) {
            $pet = $adoption->getPet();
            $petId = $pet->getId();
            
            // Solo contar una vez por mascota
            if (!in_array($petId, $petIdsProcesados)) {
                $petIdsProcesados[] = $petId;
                
                if ($adoption->getAdoptionDate()) {
                    $fechaCreacion = $pet->getCreatedAt();
                    $fechaAdopcion = $adoption->getAdoptionDate();
                    
                    if ($fechaCreacion && $fechaAdopcion) {
                        $diferencia = $fechaCreacion->diff($fechaAdopcion);
                        $duraciones[] = $diferencia->days;
                    }
                }
            }
        }

        if (empty($duraciones)) {
            return 0;
        }

        return round(array_sum($duraciones) / count($duraciones), 1);
    }

    /**
     * Zonas de adopción basadas en direcciones de las mascotas
     * Usa las direcciones de las mascotas y las geocodifica para obtener coordenadas
     * Incluye:
     * - Mascotas que fueron adoptadas (dadas en adopción por el usuario)
     * - Mascotas propias actuales del usuario (tanto en adopción como no)
     */
    private function getAdoptionZones(array $pets, array $adopcionesCompletadas, array $petsActuales): array
    {
        $zonas = [];
        $petIdsProcesados = [];

        // Procesar mascotas con adopciones completadas (las que dio en adopción)
        foreach ($adopcionesCompletadas as $adoption) {
            $pet = $adoption->getPet();
            $petId = $pet->getId();
            
            // Solo procesar una vez por mascota
            if (!in_array($petId, $petIdsProcesados)) {
                $petIdsProcesados[] = $petId;
                $this->addPetLocationToZones($pet, $zonas);
            }
        }

        // Procesar mascotas propias actuales del usuario (tanto en adopción como no)
        foreach ($petsActuales as $pet) {
            $petId = $pet->getId();
            
            // Solo procesar si no se procesó ya (evitar duplicados)
            if (!in_array($petId, $petIdsProcesados)) {
                $petIdsProcesados[] = $petId;
                $this->addPetLocationToZones($pet, $zonas);
            }
        }

        // Convertir a array y ordenar por intensidad (sin límite para ver todas las zonas)
        $zonasArray = array_values($zonas);
        usort($zonasArray, fn($a, $b) => $b['intensidad'] <=> $a['intensidad']);
        
        // Retornar todas las zonas (sin límite) para que se muestren todas las ubicaciones
        return $zonasArray;
    }

    /**
     * Agrega la ubicación de una mascota a las zonas de adopción
     * Geocodifica la dirección si es necesario
     * Usa found_location (lugar donde se encontró la mascota) para el mapa de calor
     * 
     * NOTA: La geocodificación puede ser lenta. Para mejor rendimiento, considerar:
     * - Cachear resultados de geocodificación
     * - Hacer la geocodificación de forma asíncrona
     * - O hacer las zonas de adopción opcionales/retardadas
     */
    private function addPetLocationToZones(Pet $pet, array &$zonas): void
    {
        // Usar found_location (lugar donde se encontró la mascota) para el mapa de calor
        $location = $pet->getFoundLocation();
        
        // Si no hay found_location, no agregar al mapa
        if (empty($location)) {
            return;
        }

        // Intentar geocodificar la dirección (puede ser lento si hay muchas mascotas)
        try {
            $geocodeResult = $this->geocodingService->geocode($location);
            
            if ($geocodeResult && isset($geocodeResult['lat']) && isset($geocodeResult['lng'])) {
                $lat = $geocodeResult['lat'];
                $lon = $geocodeResult['lng'];
                
                // Agrupar zonas cercanas (redondear a 3 decimales para mayor precisión)
                // Esto permite distinguir mejor entre calles diferentes
                $latRedondeada = round($lat, 3);
                $lonRedondeada = round($lon, 3);
                
                $key = $latRedondeada . ',' . $lonRedondeada;
                
                if (!isset($zonas[$key])) {
                    $zonas[$key] = [
                        'lat' => $latRedondeada,
                        'lon' => $lonRedondeada,
                        'intensidad' => 0,
                    ];
                }
                $zonas[$key]['intensidad']++;
            }
        } catch (\Exception $e) {
            // Log del error para debugging (solo en desarrollo)
            if (isset($_ENV['APP_ENV']) && $_ENV['APP_ENV'] === 'dev') {
                error_log("Error geocodificando: {$location} - " . $e->getMessage());
            }
            // Si falla la geocodificación, simplemente no agregar al mapa (no bloquear el dashboard)
        }
    }
}

