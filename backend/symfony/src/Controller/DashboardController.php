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

        // Obtener todas las mascotas actuales del usuario
        $pets = $this->petRepository->findBy(['owner' => $user]);
        
        // Buscar mascotas que fueron adoptadas (ya no pertenecen al usuario)
        // Estrategia: Buscar adopciones completadas donde el pet tiene un PetLike
        // con el usuario como ownerUser, lo que indica que el usuario era el dueño original
        $adopcionesCompletadas = $this->adoptionRepository->createQueryBuilder('a')
            ->join('a.pet', 'p')
            ->leftJoin('App\Entity\PetLike', 'pl', 'WITH', 'pl.pet = p AND pl.ownerUser = :user')
            ->where("a.state = 'completed'")
            ->andWhere('p.owner != :user')
            ->andWhere('pl.ownerUser IS NOT NULL')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();
        
        // Si no encontramos nada con PetLike, usar la aproximación anterior
        // (todas las adopciones completadas donde el pet no pertenece al usuario)
        if (empty($adopcionesCompletadas)) {
            $adopcionesCompletadas = $this->adoptionRepository->createQueryBuilder('a')
                ->join('a.pet', 'p')
                ->where("a.state = 'completed'")
                ->andWhere('p.owner != :user')
                ->setParameter('user', $user)
                ->getQuery()
                ->getResult();
        }
        
        
        // Estadísticas básicas
        $total = count($pets);
        // Nota: is_adopted = true significa "disponible para adopción" (no "ya adoptada")
        $enAdopcion = count(array_filter($pets, fn($pet) => $pet->isAdopted() === true));
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
        $tasaExitoPropia = $this->getUserSuccessRate($user, $pets, $adopcionesCompletadas);

        // Engagement rate
        $engagementRate = $this->getEngagementRate($pets, $adopcionesCompletadas);

        // Duración promedio
        $duracionPromedio = $this->getAverageDuration($pets, $adopcionesCompletadas);

        // Zonas de adopción
        $zonasAdopcion = $this->getAdoptionZones($pets, $adopcionesCompletadas);

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
        ];

        // Agregar información de depuración si se solicita
        $debug = $_GET['debug'] ?? false;
        if ($debug) {
            $data['_debug'] = [
                'user_id' => $userId,
                'user_name' => $user->getName(),
                'pets_count' => count($pets),
                'pets_details' => array_map(fn($pet) => [
                    'id' => $pet->getId(),
                    'name' => $pet->getName(),
                    'is_adopted' => $pet->isAdopted(),
                    'has_completed_adoption' => array_reduce($pet->getAdoptions()->toArray(), fn($carry, $a) => $carry || $a->isCompleted(), false),
                    'location' => $pet->getLocation(),
                ], $pets),
                'adopciones_completadas_count' => count($adopcionesCompletadas),
                'adopciones_completadas_details' => array_map(fn($adoption) => [
                    'pet_id' => $adoption->getPet()->getId(),
                    'pet_name' => $adoption->getPet()->getName(),
                    'current_owner_id' => $adoption->getPet()->getOwner()->getId(),
                    'current_owner_name' => $adoption->getPet()->getOwner()->getName(),
                    'adoption_date' => $adoption->getAdoptionDate() ? $adoption->getAdoptionDate()->format('Y-m-d') : null,
                    'pet_size' => $adoption->getPet()->getSize(),
                    'pet_gender' => $adoption->getPet()->getGender(),
                    'pet_location' => $adoption->getPet()->getLocation(),
                ], $adopcionesCompletadas),
            ];
        }
        
        return $this->json($data);
    }

    /**
     * Cuenta las mascotas que fueron adoptadas (tienen adopción completada)
     * Nota: Las mascotas adoptadas ya no tienen al usuario como owner,
     * así que necesitamos buscar en las adopciones completadas
     */
    private function getAdoptedPetsCount($user, array $pets, array $adopcionesCompletadas): int
    {
        $count = 0;
        
        // Contar mascotas actuales del usuario que tienen adopciones completadas
        foreach ($pets as $pet) {
            $adoptions = $pet->getAdoptions();
            foreach ($adoptions as $adoption) {
                if ($adoption->isCompleted()) {
                    $count++;
                    break; // Solo contar una vez por mascota
                }
            }
        }
        
        // Contar mascotas que fueron adoptadas y ya no pertenecen al usuario
        // Esto es una aproximación: si hay una adopción completada y el pet no pertenece al usuario,
        // asumimos que el usuario era el owner original
        // Nota: Esta lógica no es perfecta pero funciona para la mayoría de casos
        $petIdsAdoptadas = [];
        foreach ($adopcionesCompletadas as $adoption) {
            $pet = $adoption->getPet();
            $petId = $pet->getId();
            
            // Verificar si esta mascota no está en la lista de mascotas actuales del usuario
            $esMascotaDelUsuario = false;
            foreach ($pets as $p) {
                if ($p->getId() === $petId) {
                    $esMascotaDelUsuario = true;
                    break;
                }
            }
            
            // Si no es mascota actual del usuario, probablemente fue adoptada
            // (aunque esto no es 100% preciso, es una buena aproximación)
            if (!$esMascotaDelUsuario && !in_array($petId, $petIdsAdoptadas)) {
                $petIdsAdoptadas[] = $petId;
                $count++;
            }
        }
        
        return $count;
    }

    /**
     * Obtiene las adopciones agrupadas por mes
     * Incluye adopciones de mascotas actuales y mascotas que fueron adoptadas
     */
    private function getMonthlyAdoptions(array $pets, array $adopcionesCompletadas): array
    {
        $meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        $adopcionesPorMes = array_fill_keys($meses, 0);

        // Contar adopciones de mascotas actuales
        foreach ($pets as $pet) {
            $adoptions = $pet->getAdoptions();
            foreach ($adoptions as $adoption) {
                if ($adoption->isCompleted() && $adoption->getAdoptionDate()) {
                    $mes = (int)$adoption->getAdoptionDate()->format('n') - 1; // 0-11
                    if (isset($meses[$mes])) {
                        $adopcionesPorMes[$meses[$mes]]++;
                    }
                }
            }
        }

        // Contar adopciones de mascotas que fueron adoptadas (ya no pertenecen al usuario)
        // Obtener IDs de mascotas actuales para evitar duplicados
        $petIdsActuales = array_map(fn($pet) => $pet->getId(), $pets);
        
        foreach ($adopcionesCompletadas as $adoption) {
            $pet = $adoption->getPet();
            $petId = $pet->getId();
            
            // Solo contar si la mascota no está en la lista actual (fue adoptada)
            if (!in_array($petId, $petIdsActuales) && $adoption->getAdoptionDate()) {
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
     * Incluye mascotas actuales con adopciones completadas y mascotas que ya no pertenecen al usuario
     */
    private function getSizeDistribution(array $pets, array $adopcionesCompletadas): array
    {
        $distribucion = [
            'Pequeño' => 0,
            'Mediano' => 0,
            'Grande' => 0,
        ];

        $petIdsProcesados = [];

        // Contar mascotas actuales con adopciones completadas
        foreach ($pets as $pet) {
            $adoptions = $pet->getAdoptions();
            foreach ($adoptions as $adoption) {
                if ($adoption->isCompleted()) {
                    $petId = $pet->getId();
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
                    break;
                }
            }
        }

        // Contar mascotas que fueron adoptadas (ya no pertenecen al usuario)
        $petIdsActuales = array_map(fn($pet) => $pet->getId(), $pets);
        foreach ($adopcionesCompletadas as $adoption) {
            $pet = $adoption->getPet();
            $petId = $pet->getId();
            
            // Solo contar si la mascota no está en la lista actual (fue adoptada)
            if (!in_array($petId, $petIdsActuales) && !in_array($petId, $petIdsProcesados)) {
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
     * Incluye mascotas actuales con adopciones completadas y mascotas que ya no pertenecen al usuario
     */
    private function getGenderDistribution(array $pets, array $adopcionesCompletadas): array
    {
        $distribucion = [
            'Macho' => 0,
            'Hembra' => 0,
        ];

        $petIdsProcesados = [];

        // Contar mascotas actuales con adopciones completadas
        foreach ($pets as $pet) {
            $adoptions = $pet->getAdoptions();
            foreach ($adoptions as $adoption) {
                if ($adoption->isCompleted()) {
                    $petId = $pet->getId();
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
                    break;
                }
            }
        }

        // Contar mascotas que fueron adoptadas (ya no pertenecen al usuario)
        $petIdsActuales = array_map(fn($pet) => $pet->getId(), $pets);
        foreach ($adopcionesCompletadas as $adoption) {
            $pet = $adoption->getPet();
            $petId = $pet->getId();
            
            // Solo contar si la mascota no está en la lista actual (fue adoptada)
            if (!in_array($petId, $petIdsActuales) && !in_array($petId, $petIdsProcesados)) {
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
     * Incluye mascotas actuales con adopciones completadas y mascotas que fueron adoptadas
     */
    private function getLastAdoptedPet(array $pets, array $adopcionesCompletadas): array
    {
        $mascotasAdoptadas = [];
        $petIdsProcesados = [];

        // Procesar mascotas actuales con adopciones completadas
        foreach ($pets as $pet) {
            $adoptions = $pet->getAdoptions();
            foreach ($adoptions as $adoption) {
                if ($adoption->isCompleted() && $adoption->getAdoptionDate()) {
                    $petId = $pet->getId();
                    if (!in_array($petId, $petIdsProcesados)) {
                        $petIdsProcesados[] = $petId;
                        $mascotasAdoptadas[] = [
                            'pet' => $pet,
                            'adoption_date' => $adoption->getAdoptionDate(),
                        ];
                    }
                    break;
                }
            }
        }

        // Procesar mascotas que fueron adoptadas (ya no pertenecen al usuario)
        $petIdsActuales = array_map(fn($pet) => $pet->getId(), $pets);
        foreach ($adopcionesCompletadas as $adoption) {
            $pet = $adoption->getPet();
            $petId = $pet->getId();
            
            // Solo procesar si la mascota no está en la lista actual (fue adoptada)
            if (!in_array($petId, $petIdsActuales) && !in_array($petId, $petIdsProcesados)) {
                $petIdsProcesados[] = $petId;
                if ($adoption->getAdoptionDate()) {
                    $mascotasAdoptadas[] = [
                        'pet' => $pet,
                        'adoption_date' => $adoption->getAdoptionDate(),
                    ];
                }
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
     * 
     * Incluye:
     * - Mascotas actuales con adopciones completadas
     * - Mascotas que fueron adoptadas (ya no pertenecen al usuario)
     */
    private function getUserSuccessRate($user, array $pets, array $adopcionesCompletadas): float
    {
        // Contar mascotas actuales disponibles para adopción
        $enAdopcionActuales = array_filter($pets, fn($pet) => $pet->isAdopted() === true);
        $totalEnAdopcionActuales = count($enAdopcionActuales);
        
        // Contar mascotas actuales con adopciones completadas
        $adoptadasActuales = 0;
        foreach ($pets as $pet) {
            $adoptions = $pet->getAdoptions();
            foreach ($adoptions as $adoption) {
                if ($adoption->isCompleted()) {
                    $adoptadasActuales++;
                    break;
                }
            }
        }
        
        // Contar mascotas que fueron adoptadas (ya no pertenecen al usuario)
        // Estas son adopciones completadas donde el pet actualmente no pertenece al usuario
        $petIdsAdoptadas = [];
        foreach ($adopcionesCompletadas as $adoption) {
            $pet = $adoption->getPet();
            $petId = $pet->getId();
            
            // Verificar si esta mascota no está en la lista de mascotas actuales del usuario
            $esMascotaActual = false;
            foreach ($pets as $p) {
                if ($p->getId() === $petId) {
                    $esMascotaActual = true;
                    break;
                }
            }
            
            // Si no es mascota actual, probablemente fue adoptada del usuario
            // (aunque esto no es 100% preciso, es una buena aproximación)
            if (!$esMascotaActual && !in_array($petId, $petIdsAdoptadas)) {
                $petIdsAdoptadas[] = $petId;
            }
        }
        
        // Total de mascotas que estuvieron en adopción = actuales en adopción + adoptadas
        $totalEnAdopcion = $totalEnAdopcionActuales + count($petIdsAdoptadas);
        $totalAdoptadas = $adoptadasActuales + count($petIdsAdoptadas);
        
        if ($totalEnAdopcion == 0) {
            return 0;
        }

        return round(($totalAdoptadas / $totalEnAdopcion) * 100, 0);
    }

    /**
     * Engagement rate: (adopciones completadas / total de likes recibidos) * 100
     * Incluye mascotas actuales y mascotas que fueron adoptadas
     */
    private function getEngagementRate(array $pets, array $adopcionesCompletadas): float
    {
        $totalLikes = 0;
        $adopcionesCompletadasCount = 0;
        $petIdsProcesados = [];

        // Procesar mascotas actuales
        foreach ($pets as $pet) {
            $petId = $pet->getId();
            $petIdsProcesados[] = $petId;
            
            // Contar likes recibidos para esta mascota
            $likes = $this->petLikeRepository->findBy(['pet' => $pet]);
            $totalLikes += count($likes);

            // Verificar si tiene adopción completada
            $adoptions = $pet->getAdoptions();
            foreach ($adoptions as $adoption) {
                if ($adoption->isCompleted()) {
                    $adopcionesCompletadasCount++;
                    break;
                }
            }
        }

        // Procesar mascotas que fueron adoptadas (ya no pertenecen al usuario)
        $petIdsActuales = array_map(fn($pet) => $pet->getId(), $pets);
        foreach ($adopcionesCompletadas as $adoption) {
            $pet = $adoption->getPet();
            $petId = $pet->getId();
            
            // Solo procesar si la mascota no está en la lista actual (fue adoptada)
            if (!in_array($petId, $petIdsActuales) && !in_array($petId, $petIdsProcesados)) {
                $petIdsProcesados[] = $petId;
                
                // Contar likes recibidos para esta mascota
                $likes = $this->petLikeRepository->findBy(['pet' => $pet]);
                $totalLikes += count($likes);
                
                // Esta adopción ya está completada
                $adopcionesCompletadasCount++;
            }
        }

        if ($totalLikes == 0) {
            return 0;
        }

        return round(($adopcionesCompletadasCount / $totalLikes) * 100, 0);
    }

    /**
     * Duración promedio en días entre creación de mascota y adopción completada
     * Incluye mascotas actuales y mascotas que fueron adoptadas
     */
    private function getAverageDuration(array $pets, array $adopcionesCompletadas): float
    {
        $duraciones = [];
        $petIdsProcesados = [];

        // Procesar mascotas actuales
        foreach ($pets as $pet) {
            $petId = $pet->getId();
            $petIdsProcesados[] = $petId;
            
            $adoptions = $pet->getAdoptions();
            foreach ($adoptions as $adoption) {
                if ($adoption->isCompleted() && $adoption->getAdoptionDate()) {
                    $fechaCreacion = $pet->getCreatedAt();
                    $fechaAdopcion = $adoption->getAdoptionDate();
                    if ($fechaCreacion && $fechaAdopcion) {
                        $diferencia = $fechaCreacion->diff($fechaAdopcion);
                        $duraciones[] = $diferencia->days;
                    }
                    break; // Solo contar una vez por mascota
                }
            }
        }

        // Procesar mascotas que fueron adoptadas (ya no pertenecen al usuario)
        $petIdsActuales = array_map(fn($pet) => $pet->getId(), $pets);
        foreach ($adopcionesCompletadas as $adoption) {
            $pet = $adoption->getPet();
            $petId = $pet->getId();
            
            // Solo procesar si la mascota no está en la lista actual (fue adoptada)
            if (!in_array($petId, $petIdsActuales) && !in_array($petId, $petIdsProcesados)) {
                $petIdsProcesados[] = $petId;
                
                if ($adoption->getAdoptionDate()) {
                    $fechaCreacion = $pet->getCreatedAt();
                    $fechaAdopcion = $adoption->getAdoptionDate();
                    
                    if ($fechaCreacion && $fechaAdopcion) {
                        $diferencia = $fechaCreacion->diff($fechaAdopcion);
                        $dias = $diferencia->days;
                        $duraciones[] = $dias;
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
     * Zonas de adopción basadas en direcciones de las mascotas que fueron adoptadas
     * Usa las direcciones de las mascotas y las geocodifica para obtener coordenadas
     * Incluye adopciones de mascotas actuales y mascotas que fueron adoptadas
     */
    private function getAdoptionZones(array $pets, array $adopcionesCompletadas): array
    {
        $zonas = [];
        $petIdsActuales = array_map(fn($pet) => $pet->getId(), $pets);
        $petIdsProcesados = [];

        // Procesar mascotas actuales con adopciones completadas
        foreach ($pets as $pet) {
            $adoptions = $pet->getAdoptions();
            foreach ($adoptions as $adoption) {
                if ($adoption->isCompleted()) {
                    $petId = $pet->getId();
                    if (!in_array($petId, $petIdsProcesados)) {
                        $petIdsProcesados[] = $petId;
                        $this->addPetLocationToZones($pet, $zonas);
                    }
                    break;
                }
            }
        }

        // Procesar mascotas que fueron adoptadas (ya no pertenecen al usuario)
        foreach ($adopcionesCompletadas as $adoption) {
            $pet = $adoption->getPet();
            $petId = $pet->getId();
            
            // Solo procesar si la mascota no está en la lista actual (fue adoptada)
            if (!in_array($petId, $petIdsActuales) && !in_array($petId, $petIdsProcesados)) {
                $petIdsProcesados[] = $petId;
                $this->addPetLocationToZones($pet, $zonas);
            }
        }

        // Convertir a array y limitar a máximo 10 zonas
        $zonasArray = array_values($zonas);
        usort($zonasArray, fn($a, $b) => $b['intensidad'] <=> $a['intensidad']);
        
        return array_slice($zonasArray, 0, 10);
    }

    /**
     * Agrega la ubicación de una mascota a las zonas de adopción
     * Geocodifica la dirección si es necesario
     */
    private function addPetLocationToZones(Pet $pet, array &$zonas): void
    {
        $location = $pet->getLocation();
        
        // Si no hay dirección, no podemos geocodificar
        if (empty($location)) {
            return;
        }

        // Intentar geocodificar la dirección
        try {
            $geocodeResult = $this->geocodingService->geocode($location);
            
            if ($geocodeResult && isset($geocodeResult['lat']) && isset($geocodeResult['lng'])) {
                $lat = $geocodeResult['lat'];
                $lon = $geocodeResult['lng'];
                
                // Agrupar zonas cercanas (redondear a 2 decimales)
                $latRedondeada = round($lat, 2);
                $lonRedondeada = round($lon, 2);
                
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
            // Silenciar errores de geocodificación
        }
    }
}

