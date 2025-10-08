<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251004122435 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE marcadores (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(255) NOT NULL, description LONGTEXT DEFAULT NULL, address VARCHAR(400) DEFAULT NULL, lat NUMERIC(10, 8) NOT NULL, lng NUMERIC(11, 8) NOT NULL, formatted_address VARCHAR(500) DEFAULT NULL, accuracy VARCHAR(20) DEFAULT NULL, geocoding_provider VARCHAR(50) DEFAULT NULL, fecha_creacion DATETIME NOT NULL, fecha_modificacion DATETIME DEFAULT NULL, activo TINYINT(1) NOT NULL, INDEX idx_coordinates (lat, lng), INDEX idx_activo (activo), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE users ADD lat DOUBLE PRECISION DEFAULT NULL, ADD lon DOUBLE PRECISION DEFAULT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            DROP TABLE marcadores
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE users DROP lat, DROP lon
        SQL);
    }
}
