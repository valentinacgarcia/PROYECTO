<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250531160000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add last_name and address to users table, modify pets table constraints';
    }

    public function up(Schema $schema): void
    {
        // Agregar columnas a users (sin IF NOT EXISTS)
        $this->addSql('ALTER TABLE users ADD last_name VARCHAR(100) DEFAULT NULL');
        $this->addSql('ALTER TABLE users ADD address VARCHAR(255) DEFAULT NULL');

        // Modificar tabla pets
        $this->addSql('ALTER TABLE pets 
            MODIFY gender VARCHAR(10) NOT NULL, 
            MODIFY species VARCHAR(50) NOT NULL, 
            MODIFY breed VARCHAR(100) NOT NULL, 
            MODIFY size VARCHAR(10) NOT NULL, 
            MODIFY color VARCHAR(50) NOT NULL, 
            MODIFY is_adopted TINYINT(1) NOT NULL, 
            MODIFY created_at DATETIME NOT NULL, 
            MODIFY owner_id INT DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // Revertir cambios en pets
        $this->addSql('ALTER TABLE pets 
            MODIFY gender VARCHAR(10) DEFAULT NULL, 
            MODIFY species VARCHAR(50) DEFAULT NULL, 
            MODIFY breed VARCHAR(100) DEFAULT NULL, 
            MODIFY size VARCHAR(10) DEFAULT NULL, 
            MODIFY color VARCHAR(50) DEFAULT NULL, 
            MODIFY is_adopted TINYINT(1) DEFAULT NULL, 
            MODIFY created_at DATETIME DEFAULT NULL, 
            MODIFY owner_id INT NOT NULL');

        // Eliminar columnas de users (sin IF EXISTS)
        $this->addSql('ALTER TABLE users DROP COLUMN last_name');
        $this->addSql('ALTER TABLE users DROP COLUMN address');
    }
}
