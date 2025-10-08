<?php

namespace App\Service;

use Symfony\Contracts\HttpClient\HttpClientInterface;

class GeocodingService
{
    private HttpClientInterface $httpClient;
    
    public function __construct(HttpClientInterface $httpClient)
    {
        $this->httpClient = $httpClient;
    }

    /**
     */
    public function geocode(string $address): ?array
    {
        try {
            // Normalizar dirección para Argentina
            $normalizedAddress = $this->normalizeAddress($address);
            

            // Request a Nominatim
            $response = $this->httpClient->request('GET', 'https://nominatim.openstreetmap.org/search', [
                'query' => [
                    'q' => $normalizedAddress,
                    'format' => 'json',
                    'limit' => 1,
                    'addressdetails' => 1,
                    'countrycodes' => 'ar', // Solo Argentina
                    'accept-language' => 'es', // Preferir español
                ],
                'headers' => [
                    'User-Agent' => 'CordobaMapApp/1.0 (maps@miapp.com)'
                ],
                'timeout' => 10
            ]);

            $data = $response->toArray();
            
            if (empty($data)) {
                return null;
            }

            $result = $data[0];
            
            $geocodeResult = [
                'lat' => (float) $result['lat'],
                'lng' => (float) $result['lon'], 
                'formatted_address' => $result['display_name'],
                'accuracy' => $this->calculateAccuracy($result),
                'address_components' => $this->parseAddress($result['address'] ?? []),
                'original_query' => $address,
                'normalized_query' => $normalizedAddress,
                'provider' => 'nominatim'
            ];

            
            return $geocodeResult;

        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Geocodificación inversa (coordenadas -> dirección)
     */
    public function reverseGeocode(float $lat, float $lng): ?array
    {
        try {
            $response = $this->httpClient->request('GET', 'https://nominatim.openstreetmap.org/reverse', [
                'query' => [
                    'lat' => $lat,
                    'lon' => $lng,
                    'format' => 'json',
                    'addressdetails' => 1,
                    'accept-language' => 'es',
                ],
                'headers' => [
                    'User-Agent' => 'CordobaMapApp/1.0 (maps@miapp.com)'
                ],
                'timeout' => 10
            ]);

            $data = $response->toArray();

            if (empty($data)) {
                return null;
            }

            return [
                'formatted_address' => $data['display_name'],
                'address_components' => $this->parseAddress($data['address'] ?? []),
                'provider' => 'nominatim'
            ];

        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Normalizar dirección argentina
     */
    private function normalizeAddress(string $address): string
    {
        $address = trim($address);
        
        // Si no incluye Córdoba o Argentina, agregarlo
        if (!preg_match('/córdoba|cordoba|argentina/i', $address)) {
            $address .= ', Córdoba, Argentina';
        }

        // Normalizar abreviaciones argentinas comunes
        $replacements = [
            // Avenidas
            '/\bav\.?\s+/i' => 'avenida ',
            '/\bavda\.?\s+/i' => 'avenida ',
            
            // Boulevards  
            '/\bbv\.?\s+/i' => 'boulevard ',
            '/\bbvd\.?\s+/i' => 'boulevard ',
            '/\bboulevard\s+/i' => 'boulevard ',
            
            // Generales
            '/\bgral\.?\s+/i' => 'general ',
            '/\bgeneral\s+/i' => 'general ',
            
            // Santos
            '/\bsan\s+/i' => 'san ',
            '/\bsta\.?\s+/i' => 'santa ',
            '/\bsanta\s+/i' => 'santa ',
            
            // Pasajes y calles
            '/\bpje\.?\s+/i' => 'pasaje ',
            '/\bcalle\s+/i' => '',
            
            // Números
            '/\bn°\s*/' => ' ',
            '/\bnum\.?\s*/' => ' ',
            '/\bnro\.?\s*/' => ' ',
            
            // Limpiar espacios múltiples
            '/\s+/' => ' ',
        ];

        foreach ($replacements as $pattern => $replacement) {
            $address = preg_replace($pattern, $replacement, $address);
        }

        return trim($address);
    }

    /**
     * Calcular precisión del resultado
     */
    private function calculateAccuracy(array $result): string
    {
        $type = $result['type'] ?? '';
        $class = $result['class'] ?? '';
        
        // Precisión alta
        if (in_array($type, ['house', 'building'])) {
            return 'high';
        }
        
        // Precisión media
        if (in_array($type, ['residential', 'commercial', 'retail', 'amenity', 'shop'])) {
            return 'medium';
        }
        
        // Precisión baja
        if (in_array($type, ['highway', 'suburb', 'neighbourhood'])) {
            return 'low';
        }
        
        return 'unknown';
    }

    /**
     * Parsear dirección de Nominatim
     */
    private function parseAddress(array $address): array
    {
        return [
            'house_number' => $address['house_number'] ?? '',
            'street' => $address['road'] ?? '',
            'neighbourhood' => $address['neighbourhood'] ?? $address['suburb'] ?? '',
            'city' => $address['city'] ?? $address['town'] ?? $address['village'] ?? '',
            'state' => $address['state'] ?? '',
            'country' => $address['country'] ?? '',
            'postcode' => $address['postcode'] ?? '',
        ];
    }

    /**
     * Validar dirección argentina
     */
    public function validateAddress(string $address): bool
    {
        $address = trim($address);
        
        if (empty($address) || strlen($address) < 5) {
            return false;
        }

        // Patrones de direcciones argentinas válidas
        $patterns = [
            '/^[a-záéíóúñ\s\.]+\s+\d+/i', // Calle + número
            '/^(avenida|av|boulevard|bv|general|gral|san|santa|sta)\s+[a-záéíóúñ\s\.]+\s+\d+/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $address)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Verificar si las coordenadas están en Argentina
     */
    public function isInArgentina(float $lat, float $lng): bool
    {
        // Bounding box de Argentina
        return $lat >= -55.1 && $lat <= -21.8 && $lng >= -73.6 && $lng <= -53.6;
    }

    /**
     * Verificar si las coordenadas están en Córdoba
     */
    public function isInCordoba(float $lat, float $lng): bool
    {
        // Bounding box de la provincia de Córdoba
        return $lat >= -35.0 && $lat <= -29.5 && $lng >= -66.0 && $lng <= -61.5;
    }

    /**
     * Ejemplos de direcciones válidas
     */
    public function getExamples(): array
    {
        return [
            'Duarte Quirós 2080',
            'Avenida Colón 1234', 
            'Boulevard San Juan 567',
            'General Paz 890',
            'Santa Rosa 456',
            'Av. Rafael Núñez 2500',
            'Humberto Primo 670',
            'Caseros 545'
        ];
    }
}