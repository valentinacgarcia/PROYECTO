<?php

namespace App\Controller;

use App\Entity\AdoptionRequest;
use App\Entity\Pet;
use App\Entity\PetLike;
use App\Repository\PetRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;
use Psr\Log\LoggerInterface;
use Aws\S3\S3Client;

#[Route('/recommendations')]
class PetRecommendationController extends AbstractController
{
    private LoggerInterface $logger;

    public function __construct(
        LoggerInterface $logger
    ) {
        $this->logger = $logger;
    }

    #[Route('/list-preferences/{userId}', methods: ['GET'])]
    public function findRecommendedForUser(
        int $userId,
        UserRepository $userRepository,
        EntityManagerInterface $em,
        PetRepository $petRepository,
        Request $request
    ): JsonResponse {
        try {
            $user = $userRepository->find($userId);
            if (!$user) {
                return $this->json(['error' => 'Usuario no encontrado'], 404);
            }

            $limit = max(1, min(50, (int) $request->query->get('limit', 10))); // Límite máximo de 50

            // 1. Obtener datos del usuario
            $adoptionRequest = $em->getRepository(AdoptionRequest::class)
                                ->findOneBy(['user' => $user]);

            // Obtener todos los likes del usuario para entender sus preferencias
            $likes = $em->getRepository(PetLike::class)
                        ->createQueryBuilder('pl')
                        ->where('pl.interestedUser = :user')
                        ->setParameter('user', $user)
                        ->getQuery()
                        ->getResult();

            // 2. Obtener mascotas disponibles excluyendo las que ya tiene like
            $likedPetIds = array_map(fn($like) => $like->getPet()->getId(), $likes);
            
            $qb = $petRepository->createQueryBuilder('p')
                ->andWhere('p.is_adopted = true') // Mascotas disponibles para adopción
                ->andWhere('p.owner != :user')
                ->setParameter('user', $user);
            
            // Excluir mascotas que ya tienen like del usuario
            if (!empty($likedPetIds)) {
                $qb->andWhere('p.id NOT IN (:likedPets)')
                   ->setParameter('likedPets', $likedPetIds);
            }

            $pets = $qb->getQuery()->getResult();

            if (empty($pets)) {
                return $this->json([
                    'success' => true, 
                    'data' => [],
                    'message' => 'No hay mascotas disponibles para recomendar'
                ]);
            }

            // 3. Calcular puntuaciones
            $scored = [];
            foreach ($pets as $pet) {
                $score = $this->calculatePetScore($pet, $adoptionRequest, $likes);
                
                if ($score > 0) {
                    $scored[] = [
                        'pet' => $pet, 
                        'score' => $score,
                        'reasons' => $this->getRecommendationReasons($pet, $adoptionRequest, $likes)
                    ];
                }
            }

            if (empty($scored)) {
                return $this->json([
                    'success' => true, 
                    'data' => [],
                    'message' => 'No se encontraron mascotas compatibles'
                ]);
            }

            // 4. Ordenar y aplicar diversidad
            usort($scored, fn($a, $b) => $b['score'] <=> $a['score']);
            $scored = $this->addDiversity($scored, $limit);
            $scored = array_slice($scored, 0, $limit);

            // 5. Serializar
            $data = array_map(function($row) {
                $petData = $this->serializePetNormalized($row['pet']);
                $petData['recommendation_score'] = round($row['score'], 1);
                $petData['reasons'] = $row['reasons'];
                return $petData;
            }, $scored);

            $this->logger->info('Pet recommendations generated', [
                'user_id' => $userId,
                'pets_found' => count($data),
                'has_adoption_request' => $adoptionRequest !== null,
                'user_likes_count' => count($likes)
            ]);

            return $this->json(['success' => true, 'data' => $data]);

        } catch (\Exception $e) {
            $this->logger->error('Error generating pet recommendations', [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);

            return $this->json(['error' => 'Error interno del servidor'], 500);
        }
    }

    private function calculatePetScore(Pet $pet, ?AdoptionRequest $adoptionRequest, array $likes): float
    {
        $score = 0;

        // PARTE 1: Compatibilidad con AdoptionRequest (peso 60%)
        if ($adoptionRequest) {
            $compatibilityScore = 50; // Base

            // Normalizar compatibilidad a minúsculas para comparación
            $petCompatibility = array_map('strtolower', $pet->getCompatibility() ?? []);

            // CRÍTICO: Niños - factor de descalificación
            if ($adoptionRequest->getHasChildren()) {
                if (in_array('niños', $petCompatibility)) {
                    $compatibilityScore += 30;
                } else {
                    return 0; // Descalificado completamente
                }
            }

            // Tamaño vs espacio disponible - FILTRO DURO
            if ($pet->getType() === 'perro' && $pet->getSize()) {
                $size = strtolower($pet->getSize());
                $isHouse = $adoptionRequest->getIsHouse();
                $hasYard = $adoptionRequest->getHasYard();
                
                // DESCALIFICACIÓN TOTAL para perros grandes sin espacio adecuado
                if ($size === 'grande') {
                    if (!$isHouse || !$hasYard) {
                        return 0; // 💀 DESCALIFICADO: perro grande necesita casa CON patio
                    }
                    $compatibilityScore += 25; // Ideal: casa con patio
                }
                
                // Perros medianos y pequeños
                if ($size === 'mediano') {
                    if ($isHouse) {
                        $compatibilityScore += $hasYard ? 20 : 15;
                    } else {
                        $compatibilityScore += $hasYard ? 10 : 5; // Depto: aceptable
                    }
                }
                
                if ($size === 'pequeño') {
                    $compatibilityScore += 15; // Siempre bueno
                    if (!$isHouse) {
                        $compatibilityScore += 5; // Bonus extra para departamentos
                    }
                }
            }

            // Experiencia previa con mascotas
            if ($adoptionRequest->getHadPetsBefore()) {
                $compatibilityScore += 15;
            } else {
                // Penalizar razas difíciles para principiantes
                $difficultBreeds = ['husky', 'pastor alemán', 'rottweiler', 'doberman', 'pit bull', 'dogo'];
                $petBreed = strtolower($pet->getBreed() ?? '');
                if (in_array($petBreed, $difficultBreeds)) {
                    $compatibilityScore -= 20;
                }
            }

            // Tiempo disponible
            $hoursAlone = $adoptionRequest->getHoursAlonePerDay();
            if ($hoursAlone <= 4) {
                $compatibilityScore += 10;
            } elseif ($hoursAlone > 8) {
                $compatibilityScore -= 15;
                if ($pet->getType() === 'perro') {
                    $compatibilityScore -= 10;
                    // Penalizar cachorros
                    if ($this->calculatePetAgeCategory($pet) === 'cachorro') {
                        $compatibilityScore -= 20;
                    }
                }
                // Penalizar cachorros gatos también
                if ($pet->getType() === 'gato' && $this->calculatePetAgeCategory($pet) === 'cachorro') {
                    $compatibilityScore -= 10;
                }
            }

            // Compatibilidad con mascotas actuales
            if ($adoptionRequest->getHasCurrentPets()) {
                if (in_array('perros', $petCompatibility) || in_array('gatos', $petCompatibility)) {
                    $compatibilityScore += 15;
                } else {
                    $compatibilityScore -= 25;
                }
            }

            // Compatibilidad con alergias
            if ($adoptionRequest->getHasAllergies()) {
                // Preferir mascotas hipoalergénicas o con pelo corto
                $hypoallergenicBreeds = ['poodle', 'caniche', 'bichon frise', 'schnauzer'];
                $petBreed = strtolower($pet->getBreed() ?? '');
                if (in_array($petBreed, $hypoallergenicBreeds)) {
                    $compatibilityScore += 15;
                } elseif ($pet->getType() === 'gato') {
                    // Los gatos de pelo corto son generalmente mejores para alérgicos
                    $compatibilityScore += 5;
                } else {
                    $compatibilityScore -= 10;
                }
            }

            // Factor de seguridad para mascotas grandes
            if ($pet->getType() === 'perro' && 
                strtolower($pet->getSize() ?? '') === 'grande' && 
                !$adoptionRequest->getHasSecurity()) {
                $compatibilityScore -= 10; // Penalizar perros grandes sin seguridad
            }

            // Penalizar falta de seguridad para gatos
            if ($pet->getType() === 'gato' && !$adoptionRequest->getHasSecurity()) {
                $compatibilityScore -= 10; // Penalizar gatos sin seguridad
            }

            // Considerar el lugar donde dormirá la mascota
            $sleepingLocation = $adoptionRequest->getSleepingLocation();
            if ($sleepingLocation && $sleepingLocation->value === 'inside' && 
                strtolower($pet->getSize() ?? '') === 'grande') {
                $compatibilityScore -= 5;
            }

            // Bonus para mascotas esterilizadas/vacunadas si el usuario es responsable
            if ($adoptionRequest->getWillNeuterVaccinate()) {
                if ($pet->getSterilized() === 'Sí') {
                    $compatibilityScore += 5;
                }
                if ($pet->getVaccinated() === 'Sí') {
                    $compatibilityScore += 5;
                }
            }

            // Penalizar mascotas no vacunadas si hay niños
            if ($adoptionRequest->getHasChildren() && $pet->getVaccinated() !== 'Sí') {
                $compatibilityScore -= 15;
            }

            $score += max(0, $compatibilityScore) * 0.6;
        } else {
            $score += 50 * 0.6; // Sin datos = puntuación neutral
        }

        // PARTE 2: Preferencias basadas en likes (peso 40%)
        if (!empty($likes)) {
            $preferenceScore = $this->calculatePreferenceScore($pet, $likes);
            $score += min(100, $preferenceScore) * 0.4;
        }

        return $score;
    }

    private function calculatePreferenceScore(Pet $pet, array $likes): float
    {
        $preferenceScore = 0;
        $preferences = $this->extractUserPreferences($likes);

        // Match por tipo de mascota
        if (isset($preferences['types'][$pet->getType()])) {
            $preferenceScore += $preferences['types'][$pet->getType()] * 30;
        }

        // Match por tamaño
        $petSize = strtolower($pet->getSize() ?? '');
        if (isset($preferences['sizes'][$petSize])) {
            $preferenceScore += $preferences['sizes'][$petSize] * 20;
        }

        // Match por raza
        $petBreed = strtolower($pet->getBreed() ?? '');
        if (isset($preferences['breeds'][$petBreed])) {
            $preferenceScore += $preferences['breeds'][$petBreed] * 25;
        }

        // Análisis de palabras clave en descripción con contexto
        $description = strtolower($pet->getDescription() ?? '');
        foreach ($preferences['keywords'] as $keyword => $frequency) {
            if (str_contains($description, $keyword)) {
                // Verificar contexto negativo
                $negativeContext = $this->hasNegativeContext($description, $keyword);
                if ($negativeContext) {
                    $preferenceScore -= $frequency * 3; // Penalizar más fuerte
                } else {
                    $preferenceScore += $frequency * 2; // Bonus normal
                }
            }
        }

        // Bonus por edad preferida (inferida de los likes)
        if (isset($preferences['age_preference'])) {
            $petAge = $this->calculatePetAgeCategory($pet);
            if ($petAge === $preferences['age_preference']) {
                $preferenceScore += 10;
            }
        }

        return $preferenceScore;
    }

    private function calculatePetAgeCategory(Pet $pet): string
    {
        // Usar age_years si existe, sino calcular basándose en otros campos
        if (method_exists($pet, 'getAgeYears') && $pet->getAgeYears() !== null) {
            $age = $pet->getAgeYears();
            if ($age < 1) return 'cachorro';
            if ($age < 3) return 'joven';
            if ($age < 7) return 'adulto';
            return 'senior';
        }
        
        return 'adulto'; // default
    }

    private function extractUserPreferences(array $likes): array
    {
        $preferences = [
            'types' => [],
            'sizes' => [],
            'breeds' => [],
            'keywords' => [],
            'age_categories' => []
        ];

        foreach ($likes as $like) {
            $pet = $like->getPet();
            
            // Contar tipos
            $type = $pet->getType();
            $preferences['types'][$type] = ($preferences['types'][$type] ?? 0) + 1;

            // Contar tamaños (normalizar a minúsculas)
            if ($pet->getSize()) {
                $size = strtolower($pet->getSize());
                $preferences['sizes'][$size] = ($preferences['sizes'][$size] ?? 0) + 1;
            }

            // Contar razas (normalizar a minúsculas)
            if ($pet->getBreed()) {
                $breed = strtolower($pet->getBreed());
                $preferences['breeds'][$breed] = ($preferences['breeds'][$breed] ?? 0) + 1;
            }

            // Categorías de edad
            $ageCategory = $this->calculatePetAgeCategory($pet);
            $preferences['age_categories'][$ageCategory] = ($preferences['age_categories'][$ageCategory] ?? 0) + 1;

            // Palabras clave de descripciones (mejorado con filtros de contexto)
            $description = strtolower($pet->getDescription() ?? '');
            $words = preg_split('/\W+/', $description);
            
            // Filtrar palabras relevantes y verificar contexto
            $relevantWords = [];
            foreach ($words as $index => $word) {
                if (strlen($word) > 3 && 
                    !in_array($word, ['muy', 'para', 'tiene', 'está', 'casa', 'familia', 'desde', 'años', 'meses'])) {
                    
                    // Verificar si la palabra está en contexto negativo
                    if (!$this->isWordInNegativeContext($words, $index)) {
                        $relevantWords[] = $word;
                    }
                }
            }
            
            foreach ($relevantWords as $word) {
                $preferences['keywords'][$word] = ($preferences['keywords'][$word] ?? 0) + 1;
            }
        }

        // Normalizar a porcentajes
        $total = count($likes);
        if ($total > 0) {
            foreach (['types', 'sizes', 'breeds', 'age_categories'] as $category) {
                foreach ($preferences[$category] as $key => $count) {
                    $preferences[$category][$key] = $count / $total;
                }
            }
        }

        // Determinar preferencia de edad más común
        if (!empty($preferences['age_categories'])) {
            $preferences['age_preference'] = array_search(
                max($preferences['age_categories']), 
                $preferences['age_categories']
            );
        }

        return $preferences;
    }

    /**
     * Verifica si una palabra está en contexto negativo durante la extracción
     */
    private function isWordInNegativeContext(array $words, int $wordIndex): bool
    {
        $negativeWords = ['no', 'sin', 'nunca', 'jamás', 'evitar', 'inadecuado', 'peligroso', 'pero', 'excepto'];
        
        // Verificar 2-3 palabras antes de la palabra actual
        for ($i = max(0, $wordIndex - 3); $i < $wordIndex; $i++) {
            if (in_array($words[$i], $negativeWords)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Detecta si una palabra clave está en un contexto negativo
     */
    private function hasNegativeContext(string $description, string $keyword): bool
    {
        // Buscar indicadores negativos cerca de la palabra clave
        $negativeIndicators = [
            'no es',
            'no está',
            'no se',
            'no apto',
            'no recomendable',
            'no compatible',
            'evitar',
            'sin',
            'nunca',
            'jamás',
            'prohibido',
            'inadecuado',
            'peligroso',
            'pero',
            'excepto'
        ];

        // Buscar en un radio de ~50 caracteres alrededor de la palabra
        $keywordPos = strpos($description, $keyword);
        if ($keywordPos === false) {
            return false;
        }

        $start = max(0, $keywordPos - 50);
        $length = min(100, strlen($description) - $start);
        $context = substr($description, $start, $length);

        foreach ($negativeIndicators as $indicator) {
            if (str_contains($context, $indicator)) {
                return true;
            }
        }

        return false;
    }

    private function getRecommendationReasons(Pet $pet, ?AdoptionRequest $adoptionRequest, array $likes): array
    {
        $reasons = [];

        // Razones basadas en AdoptionRequest
        if ($adoptionRequest) {
            // Normalizar compatibilidad
            $petCompatibility = array_map('strtolower', $pet->getCompatibility() ?? []);
            $petSize = strtolower($pet->getSize() ?? '');
            $isHouse = $adoptionRequest->getIsHouse();
            $hasYard = $adoptionRequest->getHasYard();
            
            if ($adoptionRequest->getHasChildren() && in_array('niños', $petCompatibility)) {
                $reasons[] = 'Compatible con niños';
            }

            // Espacio y vivienda - Razones específicas por tamaño
            if ($isHouse && $hasYard && $petSize === 'grande') {
                $reasons[] = 'Perfecto para casa con patio';
            } elseif (!$isHouse) { // Es departamento
                if ($pet->getType() === 'gato') {
                    $reasons[] = 'Ideal para departamento';
                } elseif ($pet->getType() === 'perro') {
                    if ($petSize === 'pequeño') {
                        $reasons[] = 'Ideal para departamento';
                    } elseif ($petSize === 'mediano') {
                        if ($hasYard) {
                            $reasons[] = 'Aceptable para depto con patio';
                        } else {
                            $reasons[] = 'Se adapta a departamento';
                        }
                    }
                }
            } elseif ($isHouse && !$hasYard) { // Casa sin patio
                if ($petSize === 'pequeño' || $petSize === 'mediano') {
                    $reasons[] = 'Perfecto para casa';
                }
            }

            if ($adoptionRequest->getHadPetsBefore()) {
                $reasons[] = 'Ideal para tu experiencia';
            }

            if ($adoptionRequest->getHoursAlonePerDay() <= 4) {
                $reasons[] = 'Se adapta a tu tiempo';
            }

            if ($adoptionRequest->getHasAllergies() && $pet->getBreed()) {
                $hypoallergenicBreeds = ['poodle', 'caniche', 'bichon frise', 'schnauzer'];
                if (in_array(strtolower($pet->getBreed()), $hypoallergenicBreeds)) {
                    $reasons[] = 'Raza hipoalergénica';
                }
            }

            if ($pet->getVaccinated() === 'Sí') {
                $reasons[] = 'Vacunado y saludable';
            }

            if ($pet->getSterilized() === 'Sí') {
                $reasons[] = 'Esterilizado';
            }

            if ($adoptionRequest->getHasCurrentPets() && 
                (in_array('perros', $petCompatibility) || in_array('gatos', $petCompatibility))) {
                $reasons[] = 'Compatible con otras mascotas';
            }
        }

        // Razones basadas en preferencias
        if (!empty($likes)) {
            $preferences = $this->extractUserPreferences($likes);
            
            if (isset($preferences['types'][$pet->getType()]) && 
                $preferences['types'][$pet->getType()] > 0.6) {
                $reasons[] = 'Te gustan los ' . $pet->getType() . 's';
            }

            $petBreed = strtolower($pet->getBreed() ?? '');
            if (isset($preferences['breeds'][$petBreed]) &&
                $preferences['breeds'][$petBreed] > 0.3) {
                $reasons[] = 'Raza que prefieres';
            }

            $petSize = strtolower($pet->getSize() ?? '');
            if (isset($preferences['sizes'][$petSize]) &&
                $preferences['sizes'][$petSize] > 0.5) {
                $reasons[] = 'Tamaño que te gusta';
            }
        }

        // Razón general si no hay otras
        if (empty($reasons)) {
            $reasons[] = 'Buena compatibilidad general';
        }

        return array_slice($reasons, 0, 3); // Máximo 3 razones
    }

    private function addDiversity(array $scored, int $limit): array
    {
        if (count($scored) <= $limit) {
            return $scored;
        }

        $result = [];
        $typeCount = [];
        $sizeCount = [];

        foreach ($scored as $item) {
            $pet = $item['pet'];
            $type = $pet->getType();
            $size = strtolower($pet->getSize() ?? 'unknown');
            
            // Máximo 70% del mismo tipo y 50% del mismo tamaño
            $typeLimit = ceil($limit * 0.7);
            $sizeLimit = ceil($limit * 0.5);
            
            if (($typeCount[$type] ?? 0) < $typeLimit && 
                ($sizeCount[$size] ?? 0) < $sizeLimit) {
                
                $result[] = $item;
                $typeCount[$type] = ($typeCount[$type] ?? 0) + 1;
                $sizeCount[$size] = ($sizeCount[$size] ?? 0) + 1;
                
                if (count($result) >= $limit) {
                    break;
                }
            }
        }

        // Completar con los mejores restantes si no se alcanza el límite
        if (count($result) < $limit) {
            foreach ($scored as $item) {
                if (!in_array($item, $result)) {
                    $result[] = $item;
                    if (count($result) >= $limit) {
                        break;
                    }
                }
            }
        }

        return $result;
    }

    private function getPresignedUrl(string $key): string
    {
        $bucket = 'mascotas';

        $s3 = new S3Client([
            'version' => 'latest',
            'region' => 'us-east-1',
            'endpoint' => 'http://localhost:9000',
            'use_path_style_endpoint' => true,
            'credentials' => [
                'key' => 'petmatch',
                'secret' => 'petmatch',
            ],
        ]);

        $cmd = $s3->getCommand('GetObject', [
            'Bucket' => $bucket,
            'Key' => $key,
        ]);

        $request = $s3->createPresignedRequest($cmd, '+20 minutes');
        $presignedUrl = (string) $request->getUri();

        return $presignedUrl; 
    }

    private function serializePetNormalized(Pet $pet): array
    {
        $photos = [];
        foreach ($pet->getPhotos() as $photo) {
            $photos[] = $this->getPresignedUrl($photo->getUrl());
        }

        return [
            'id' => $pet->getId(),
            'name' => $pet->getName(),
            'type' => $pet->getType(),
            'breed' => $pet->getBreed(),
            'size' => $pet->getSize(),
            'age' => method_exists($pet, 'getAgeYears') ? $pet->getAgeYears() : null,
            'age_months' => method_exists($pet, 'getAgeMonths') ? $pet->getAgeMonths() : null,
            'description' => $pet->getDescription(),
            'compatibility' => $pet->getCompatibility(),
            'is_adopted' => $pet->isAdopted(),
            'sterilized' => method_exists($pet, 'getSterilized') ? $pet->getSterilized() : null,
            'vaccinated' => method_exists($pet, 'getVaccinated') ? $pet->getVaccinated() : null,
            'location' => method_exists($pet, 'getLocation') ? $pet->getLocation() : null,
            'created_at' => $pet->getCreatedAt()->format('Y-m-d H:i:s'),
            'photos' => $photos,
        ];
    }
}