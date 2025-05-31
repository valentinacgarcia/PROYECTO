<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration to add last_name and address to users, modify pets constraints
 */
final class Version20250531160000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add last_name and address to users table, modify pets table constraints';
    }

    public function up(Schema $schema): void
    {
        // Modificar tabla pets
        $this->addSql('ALTER TABLE pets 
            CHANGE gender gender VARCHAR(10) NOT NULL, 
            CHANGE species species VARCHAR(50) NOT NULL, 
            CHANGE breed breed VARCHAR(100) NOT NULL, 
            CHANGE size size VARCHAR(10) NOT NULL, 
            CHANGE color color VARCHAR(50) NOT NULL, 
            CHANGE is_adopted is_adopted TINYINT(1) NOT NULL, 
            CHANGE created_at created_at DATETIME NOT NULL, 
            CHANGE owner_id owner_id INT DEFAULT NULL');

        // Agregar columnas a users (usando ADD COLUMN IF NOT EXISTS para MySQL 8.0+)
        // O simplemente ADD COLUMN para versiones anteriores
        $this->addSql('ALTER TABLE users 
            ADD COLUMN last_name VARCHAR(100) DEFAULT NULL, 
            ADD COLUMN address VARCHAR(255) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // Revertir cambios
        $this->addSql('ALTER TABLE pets 
            CHANGE gender gender VARCHAR(10) DEFAULT NULL, 
            CHANGE species species VARCHAR(50) DEFAULT NULL, 
            CHANGE breed breed VARCHAR(100) DEFAULT NULL, 
            CHANGE size size VARCHAR(10) DEFAULT NULL, 
            CHANGE color color VARCHAR(50) DEFAULT NULL, 
            CHANGE is_adopted is_adopted TINYINT(1) DEFAULT NULL, 
            CHANGE created_at created_at DATETIME DEFAULT NULL, 
            CHANGE owner_id owner_id INT NOT NULL');

        $this->addSql('ALTER TABLE users DROP COLUMN last_name, DROP COLUMN address');
    }
}
