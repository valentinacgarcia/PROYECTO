<?php

namespace App\DataFixtures;

use App\Entity\Pet;
use App\Entity\Photo;
use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Aws\S3\S3Client;

class PetFixtures extends Fixture
{
    private UserRepository $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function load(ObjectManager $manager): void
    {
        $user = new User();
        $user->setName('Raul')
            ->setLastName('Gomez')
            ->setEmail('raul.gomez@email.com')
            ->setPhone('3511234567')
            ->setPassword('123')
            ->setCreatedAt(new \DateTimeImmutable())   
            ->setAddress('B° Centro, Córdoba');
        $manager->persist($user);
        $manager->flush(); 

        $petsData = [
            [
                'name' => 'Firulais',
                'type' => 'perro',
                'breed' => 'Labrador',
                'gender' => 'Macho',
                'age_years' => 3,
                'age_months' => 0,
                'size' => 'Grande',
                'is_purebred' => true,
                'colors' => ['café'],
                'fur_length' => 'Corto',
                'sterilized' => 'Sí',
                'vaccinated' => 'Sí',
                'compatibility' => ['Niños', 'Perros'],
                'description' => 'Muy amigable, juguetón, le encanta correr.',
                'location' => 'Salsipuedes',
                'photo' => 'dog1.jpg'
            ],
            [
                'name' => 'Misu',
                'type' => 'gato',
                'breed' => 'Siames',
                'gender' => 'Hembra',
                'age_years' => 2,
                'age_months' => 6,
                'size' => 'Mediano',
                'is_purebred' => false,
                'colors' => ['blanco', 'negro'],
                'fur_length' => 'Corto',
                'sterilized' => 'No',
                'vaccinated' => 'Sí',
                'compatibility' => ['Niños', 'Gatos'],
                'description' => 'Tranquila, le gusta dormir y que la acaricien.',
                'location' => 'La Calera',
                'photo' => 'cat1.jpg'
            ],
            [
                'name' => 'Rocky',
                'type' => 'perro',
                'breed' => 'Bulldog',
                'gender' => 'Macho',
                'age_years' => 5,
                'age_months' => 3,
                'size' => 'Mediano',
                'is_purebred' => true,
                'colors' => ['blanco'],
                'fur_length' => 'Corto',
                'sterilized' => 'Sí',
                'vaccinated' => 'Sí',
                'compatibility' => ['Perros'],
                'description' => 'Fuerte pero miedoso con niños.',
                'location' => 'Poeta Lugones',
                'photo' => 'dog2.jpg'
            ],
            [
                'name' => 'Luna',
                'type' => 'gato',
                'breed' => 'Mestizo',
                'gender' => 'Hembra',
                'age_years' => 1,
                'age_months' => 2,
                'size' => 'Pequeño',
                'is_purebred' => false,
                'colors' => ['gris'],
                'fur_length' => 'Medio',
                'sterilized' => 'No',
                'vaccinated' => 'No',
                'compatibility' => ['Niños'],
                'description' => 'Muy activa y curiosa, puede ser traviesa.',
                'location' => 'Alta Córdoba',
                'photo' => 'cat2.jpg'
            ],
            [
                'name' => 'Toby',
                'type' => 'perro',
                'breed' => 'Beagle',
                'gender' => 'Macho',
                'age_years' => 4,
                'age_months' => 0,
                'size' => 'Mediano',
                'is_purebred' => true,
                'colors' => ['tricolor'],
                'fur_length' => 'Corto',
                'sterilized' => 'Sí',
                'vaccinated' => 'Sí',
                'compatibility' => ['Niños', 'Perros', 'Gatos'],
                'description' => 'Amigable con todos, muy inteligente.',
                'location' => 'Villa Belgrano',
                'photo' => 'dog3.jpg'
            ],
            [
                'name' => 'Nina',
                'type' => 'perro',
                'breed' => 'Chihuahua',
                'gender' => 'Hembra',
                'age_years' => 6,
                'age_months' => 5,
                'size' => 'Pequeño',
                'is_purebred' => false,
                'colors' => ['negro'],
                'fur_length' => 'Corto',
                'sterilized' => 'No',
                'vaccinated' => 'No',
                'compatibility' => ['Niños'],
                'description' => 'Muy pequeña y nerviosa, requiere paciencia.',
                'location' => 'Poeta Lugones',
                'photo' => 'dog4.jpg'
            ],
            [
                'name' => 'Simba',
                'type' => 'gato',
                'breed' => 'Mestizo',
                'gender' => 'Macho',
                'age_years' => 3,
                'age_months' => 4,
                'size' => 'Mediano',
                'is_purebred' => false,
                'colors' => ['naranja', 'blanco'],
                'fur_length' => 'Medio',
                'sterilized' => 'Sí',
                'vaccinated' => 'Sí',
                'compatibility' => ['Niños', 'Perros'],
                'description' => 'Curioso y juguetón, le gusta estar con otros animales.',
                'location' => 'La Calera',
                'photo' => 'cat3.jpg'
            ],
            [
                'name' => 'Bella',
                'type' => 'perro',
                'breed' => 'Golden Retriever',
                'gender' => 'Hembra',
                'age_years' => 2,
                'age_months' => 9,
                'size' => 'Grande',
                'is_purebred' => true,
                'colors' => ['dorado'],
                'fur_length' => 'Medio',
                'sterilized' => 'No',
                'vaccinated' => 'Sí',
                'compatibility' => ['Niños', 'Perros'],
                'description' => 'Extremadamente amigable y cariñosa.',
                'location' => 'Salsipuedes',
                'photo' => 'dog5.jpg'
            ],
            [
                'name' => 'Milo',
                'type' => 'gato',
                'breed' => 'Persa',
                'gender' => 'Macho',
                'age_years' => 4,
                'age_months' => 1,
                'size' => 'Mediano',
                'is_purebred' => true,
                'colors' => ['blanco'],
                'fur_length' => 'Largo',
                'sterilized' => 'Sí',
                'vaccinated' => 'Sí',
                'compatibility' => ['Niños', 'Gatos'],
                'description' => 'Calmado y elegante, le gusta dormir al sol.',
                'location' => 'Villa Belgrano',
                'photo' => 'cat4.jpg'
            ],
            [
                'name' => 'Lola',
                'type' => 'perro',
                'breed' => 'Dálmata',
                'gender' => 'Hembra',
                'age_years' => 3,
                'age_months' => 6,
                'size' => 'Grande',
                'is_purebred' => true,
                'colors' => ['blanco', 'negro'],
                'fur_length' => 'Corto',
                'sterilized' => 'Sí',
                'vaccinated' => 'Sí',
                'compatibility' => ['Niños', 'Perros', 'Gatos'],
                'description' => 'Enérgica y juguetona, muy amigable con todos.',
                'location' => 'Alta Córdoba',
                'photo' => 'dog6.jpg'
            ],
        ];

        foreach ($petsData as $data) {
        $pet = new Pet();
        $pet->setOwner($user)
            ->setName($data['name'])
            ->setType($data['type'])
            ->setGender($data['gender'])
            ->setAgeYears($data['age_years'])
            ->setAgeMonths($data['age_months'])
            ->setSize($data['size'])
            ->setIsPurebred($data['is_purebred'])
            ->setBreed($data['breed'])
            ->setColors($data['colors'])
            ->setFurLength($data['fur_length'])
            ->setSterilized($data['sterilized'])
            ->setVaccinated($data['vaccinated'])
            ->setCompatibility($data['compatibility'])
            ->setDescription($data['description'])
            ->setLocation($data['location'])
            ->setIsAdopted(true);

        $manager->persist($pet);
        $manager->flush(); // 🚨 Esto asegura que $pet tenga ID antes de subir fotos

        // Subir foto a MinIO
        $imagePath = __DIR__ . '/images/' . $data['photo'];
        if (file_exists($imagePath)) {
            $uploadedFile = new UploadedFile($imagePath, $data['photo'], null, null, true);
            $s3Key = $this->uploadToMinio($uploadedFile, $user->getId(), $pet->getId());

            $photo = new Photo();
            $photo->setUrl($s3Key)->setPet($pet);
            $manager->persist($photo);
        }
    }

    // Flush final para fotos
    $manager->flush();

    }

    private function uploadToMinio(UploadedFile $file, int $userId, int $petId): string
    {
        $bucket = 'mascotas';
        $key = "user_{$userId}/pet_{$petId}/" . uniqid() . '.' . $file->guessExtension();

        $s3 = new S3Client([
            'version' => 'latest',
            'region' => 'us-east-1',
            'endpoint' => $_ENV['MINIO_ENDPOINT'] ?? 'http://minio:9000',
            'use_path_style_endpoint' => true,
            'credentials' => [
                'key' => $_ENV['MINIO_KEY'] ?? 'petmatch',
                'secret' => $_ENV['MINIO_SECRET'] ?? 'petmatch',
            ],
        ]);

        $s3->putObject([
            'Bucket' => $bucket,
            'Key' => $key,
            'Body' => fopen($file->getPathname(), 'rb'),
            'ContentType' => $file->getMimeType(),
        ]);

        return $key;
    }
}
