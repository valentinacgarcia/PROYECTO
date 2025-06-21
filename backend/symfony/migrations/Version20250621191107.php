<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250621191107 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add photo table and update pets table with new fields';
    }

    public function up(Schema $schema): void
    {
        // Crear tabla photo
        $this->addSql(<<<'SQL'
            CREATE TABLE photo (
                id INT AUTO_INCREMENT NOT NULL, 
                url VARCHAR(255) NOT NULL, 
                pet_id INT NOT NULL, 
                INDEX IDX_14B78418966F7FB6 (pet_id), 
                PRIMARY KEY(id)
            ) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        
        // Agregar constraint a photo
        $this->addSql(<<<'SQL'
            ALTER TABLE photo ADD CONSTRAINT FK_14B78418966F7FB6 
            FOREIGN KEY (pet_id) REFERENCES pets (id) ON DELETE CASCADE
        SQL);
        
        // Agregar nuevas columnas a pets
        $this->addSql(<<<'SQL'
            ALTER TABLE pets 
            ADD type VARCHAR(10) NOT NULL,
            ADD age_months INT DEFAULT NULL,
            ADD is_purebred TINYINT(1) NOT NULL DEFAULT 0,
            ADD colors JSON DEFAULT NULL,
            ADD fur_length VARCHAR(10) DEFAULT NULL,
            ADD sterilized VARCHAR(10) DEFAULT NULL,
            ADD vaccinated VARCHAR(10) DEFAULT NULL,
            ADD compatibility JSON DEFAULT NULL,
            ADD location VARCHAR(255) DEFAULT NULL,
            ADD age_years INT DEFAULT NULL
        SQL);
        
        // Copiar datos de age a age_years antes de eliminar age
        $this->addSql('UPDATE pets SET age_years = age WHERE age IS NOT NULL');
        
        // Eliminar columnas obsoletas
        $this->addSql('ALTER TABLE pets DROP COLUMN age');
        $this->addSql('ALTER TABLE pets DROP COLUMN species');  
        $this->addSql('ALTER TABLE pets DROP COLUMN color');
        
        // Modificar columnas existentes para que coincidan con la entidad
        $this->addSql(<<<'SQL'
            ALTER TABLE pets 
            MODIFY name VARCHAR(100) NOT NULL,
            MODIFY breed VARCHAR(100) DEFAULT NULL,
            MODIFY size VARCHAR(10) DEFAULT NULL,
            MODIFY description LONGTEXT DEFAULT NULL
        SQL);
    }

    public function down(Schema $schema): void
    {
        // Eliminar constraint de photo
        $this->addSql('ALTER TABLE photo DROP FOREIGN KEY FK_14B78418966F7FB6');
        
        // Eliminar tabla photo
        $this->addSql('DROP TABLE photo');
        
        // Restaurar columnas eliminadas con valores por defecto temporales
        $this->addSql(<<<'SQL'
            ALTER TABLE pets 
            ADD age INT DEFAULT NULL,
            ADD species VARCHAR(50) NOT NULL DEFAULT '',
            ADD color VARCHAR(50) NOT NULL DEFAULT ''
        SQL);
        
        // Copiar datos de age_years a age antes de eliminar age_years
        $this->addSql('UPDATE pets SET age = age_years WHERE age_years IS NOT NULL');
        
        // Eliminar nuevas columnas
        $this->addSql(<<<'SQL'
            ALTER TABLE pets 
            DROP COLUMN type,
            DROP COLUMN age_years,
            DROP COLUMN age_months,
            DROP COLUMN is_purebred,
            DROP COLUMN colors,
            DROP COLUMN fur_length,
            DROP COLUMN sterilized,
            DROP COLUMN vaccinated,
            DROP COLUMN compatibility,
            DROP COLUMN location
        SQL);
        
        // Restaurar columnas a su estado anterior según la migración inicial
        $this->addSql(<<<'SQL'
            ALTER TABLE pets 
            MODIFY name VARCHAR(100) DEFAULT NULL,
            MODIFY breed VARCHAR(100) NOT NULL,
            MODIFY size VARCHAR(10) NOT NULL
        SQL);
    }
}