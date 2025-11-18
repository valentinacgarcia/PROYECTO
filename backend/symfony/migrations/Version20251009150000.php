<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251009150000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add found_location field to pets table';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE pets ADD found_location VARCHAR(255) DEFAULT NULL
        SQL);
        
        // Asignar ubicaciones reales de Córdoba, Argentina a todas las mascotas existentes
        // Usando una distribución circular basada en el ID para distribuir las ubicaciones
        $this->addSql(<<<'SQL'
            UPDATE pets 
            SET found_location = CASE MOD(id, 24)
                WHEN 0 THEN 'Duarte Quirós 2045, Córdoba'
                WHEN 1 THEN 'Duarte Quirós 2048, Córdoba'
                WHEN 2 THEN 'Duarte Quirós 2050, Córdoba'
                WHEN 3 THEN 'Duarte Quirós 2052, Córdoba'
                WHEN 4 THEN 'Duarte Quirós 2055, Córdoba'
                WHEN 5 THEN 'Duarte Quirós 2058, Córdoba'
                WHEN 6 THEN 'Duarte Quirós 2060, Córdoba'
                WHEN 7 THEN 'Duarte Quirós 2062, Córdoba'
                WHEN 8 THEN 'Duarte Quirós 2065, Córdoba'
                WHEN 9 THEN 'Esteban Piacenza 4630, Córdoba'
                WHEN 10 THEN 'Esteban Piacenza 4635, Córdoba'
                WHEN 11 THEN 'Esteban Piacenza 4640, Córdoba'
                WHEN 12 THEN 'Esteban Piacenza 4645, Córdoba'
                WHEN 13 THEN 'Esteban Piacenza 4650, Córdoba'
                WHEN 14 THEN 'Martín Galán 3660, Córdoba'
                WHEN 15 THEN 'Martín Galán 3665, Córdoba'
                WHEN 16 THEN 'Martín Galán 3670, Córdoba'
                WHEN 17 THEN 'Martín Galán 3675, Córdoba'
                WHEN 18 THEN 'Martín Galán 3680, Córdoba'
                WHEN 19 THEN 'Av. Hipólito Yrigoyen 136, Córdoba'
                WHEN 20 THEN 'Av. Hipólito Yrigoyen 140, Córdoba'
                WHEN 21 THEN 'Av. Hipólito Yrigoyen 146, Córdoba'
                WHEN 22 THEN 'Av. Hipólito Yrigoyen 150, Córdoba'
                WHEN 23 THEN 'Av. Hipólito Yrigoyen 156, Córdoba'
            END
            WHERE found_location IS NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE pets DROP found_location
        SQL);
    }
}

