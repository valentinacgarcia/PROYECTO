<?php

namespace App\Controller;

use App\Service\GeocodingService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api')]
class MapsController extends AbstractController
{
    public function __construct(
        private GeocodingService $geocodingService
    ) {
    }

    /**
     * Geocodificar dirección (dirección → coordenadas)
     */
    #[Route('/geocode', methods: ['POST', 'GET'])]
    public function geocode(Request $request): JsonResponse
    {
        try {
            // Obtener dirección del request
            if ($request->isMethod('POST')) {
                $data = json_decode($request->getContent(), true);
                $address = $data['address'] ?? '';
            } else {
                $address = $request->query->get('address', '');
            }

            // Validación básica
            if (empty($address) || strlen($address) < 3) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'La dirección es requerida y debe tener al menos 3 caracteres'
                ], 400);
            }

            // Validar formato de dirección argentina
            if (!$this->geocodingService->validateAddress($address)) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Formato de dirección no válido. Ejemplo: "Duarte Quirós 2080"',
                    'examples' => $this->geocodingService->getExamples()
                ], 400);
            }

            // Geocodificar
            $result = $this->geocodingService->geocode($address);

            if (!$result) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'No se pudo encontrar la dirección especificada',
                    'suggestions' => [
                        'Verifica que la dirección esté completa',
                        'Incluye el número de la calle',
                        'Prueba con formato: "Calle Número, Córdoba"'
                    ]
                ], 404);
            }

            // Verificar que esté en Argentina/Córdoba
            if (!$this->geocodingService->isInArgentina($result['lat'], $result['lng'])) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'La dirección encontrada no está en Argentina'
                ], 400);
            }

            return new JsonResponse([
                'success' => true,
                'data' => $result,
                'message' => 'Dirección geocodificada exitosamente'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Error interno del servidor',
                'message' => 'No se pudo procesar la geocodificación'
            ], 500);
        }
    }

    /**
     * Geocodificación inversa (coordenadas → dirección)
     */
    #[Route('/reverse-geocode', methods: ['POST', 'GET'])]
    public function reverseGeocode(Request $request): JsonResponse
    {
        try {
            // Obtener coordenadas del request
            if ($request->isMethod('POST')) {
                $data = json_decode($request->getContent(), true);
                $lat = $data['lat'] ?? null;
                $lng = $data['lng'] ?? null;
            } else {
                $lat = $request->query->get('lat');
                $lng = $request->query->get('lng');
            }

            // Validaciones básicas
            if ($lat === null || $lng === null) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Las coordenadas lat y lng son requeridas'
                ], 400);
            }

            $lat = (float) $lat;
            $lng = (float) $lng;

            // Validar rango de coordenadas
            if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Coordenadas fuera del rango válido'
                ], 400);
            }

            // Verificar que esté en Argentina
            if (!$this->geocodingService->isInArgentina($lat, $lng)) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'Las coordenadas no están dentro de Argentina',
                    'info' => 'Este servicio está optimizado para direcciones argentinas'
                ], 400);
            }

            // Geocodificación inversa
            $result = $this->geocodingService->reverseGeocode($lat, $lng);

            if (!$result) {
                return new JsonResponse([
                    'success' => false,
                    'error' => 'No se pudo encontrar una dirección para estas coordenadas'
                ], 404);
            }

            return new JsonResponse([
                'success' => true,
                'data' => [
                    'coordinates' => [
                        'lat' => $lat,
                        'lng' => $lng
                    ],
                    'address' => $result
                ],
                'message' => 'Coordenadas geocodificadas exitosamente'
            ]);

        } catch (\Exception $e) {
            return new JsonResponse([
                'success' => false,
                'error' => 'Error interno del servidor',
                'message' => 'No se pudo procesar la geocodificación inversa'
            ], 500);
        }
    }

    /**
     * Endpoint de prueba con ejemplos
     */
    #[Route('/test-geocoding', methods: ['GET'])]
    public function testGeocoding(): JsonResponse
    {
        $examples = $this->geocodingService->getExamples();
        $results = [];

        // Probar algunos ejemplos
        foreach (array_slice($examples, 0, 3) as $address) {
            $result = $this->geocodingService->geocode($address);
            $results[] = [
                'address' => $address,
                'success' => $result !== null,
                'result' => $result ? [
                    'lat' => $result['lat'],
                    'lng' => $result['lng'],
                    'formatted_address' => $result['formatted_address'],
                    'accuracy' => $result['accuracy']
                ] : null
            ];
        }

        // Prueba de geocodificación inversa (Centro de Córdoba)
        $reverseTest = $this->geocodingService->reverseGeocode(-31.4201, -64.1888);

        return new JsonResponse([
            'success' => true,
            'message' => 'Pruebas de geocodificación ejecutadas',
            'data' => [
                'geocoding_tests' => $results,
                'reverse_geocoding_test' => [
                    'coordinates' => ['lat' => -31.4201, 'lng' => -64.1888],
                    'success' => $reverseTest !== null,
                    'result' => $reverseTest
                ],
                'examples' => $examples,
                'service_info' => [
                    'provider' => 'OpenStreetMap Nominatim',
                    'cost' => 'Gratuito',
                    'region' => 'Argentina (optimizado para Córdoba)'
                ]
            ]
        ]);
    }

    /**
     * Obtener ejemplos de direcciones válidas
     */
    #[Route('/examples', methods: ['GET'])]
    public function getExamples(): JsonResponse
    {
        return new JsonResponse([
            'success' => true,
            'examples' => $this->geocodingService->getExamples(),
            'formats' => [
                'Con número: "Duarte Quirós 2080"',
                'Con avenida: "Avenida Colón 1234"', 
                'Con boulevard: "Boulevard San Juan 567"',
                'Abreviado: "Av. Rafael Núñez 2500"'
            ],
            'tips' => [
                'Incluye siempre el número de la calle',
                'No es necesario agregar "Córdoba" al final',
                'Funciona con abreviaciones (Av., Bv., Gral.)',
                'Optimizado para direcciones de Córdoba, Argentina'
            ]
        ]);
    }
}