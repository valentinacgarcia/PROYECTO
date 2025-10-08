<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251008123735 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE services (id INT AUTO_INCREMENT NOT NULL, service_name VARCHAR(255) NOT NULL, description LONGTEXT NOT NULL, category VARCHAR(100) NOT NULL, address VARCHAR(255) DEFAULT NULL, latitude NUMERIC(10, 8) DEFAULT NULL, longitude NUMERIC(11, 8) DEFAULT NULL, price NUMERIC(10, 2) DEFAULT NULL, price_type VARCHAR(50) DEFAULT NULL, modalities JSON NOT NULL, availability_days JSON NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, is_active TINYINT(1) NOT NULL, provider_id INT NOT NULL, INDEX IDX_7332E169A53A8AA (provider_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE services ADD CONSTRAINT FK_7332E169A53A8AA FOREIGN KEY (provider_id) REFERENCES users (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE photo ADD service_id INT DEFAULT NULL, CHANGE pet_id pet_id INT DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE photo ADD CONSTRAINT FK_14B78418ED5CA9E6 FOREIGN KEY (service_id) REFERENCES services (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_14B78418ED5CA9E6 ON photo (service_id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE services DROP FOREIGN KEY FK_7332E169A53A8AA
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE services
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE photo DROP FOREIGN KEY FK_14B78418ED5CA9E6
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_14B78418ED5CA9E6 ON photo
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE photo DROP service_id, CHANGE pet_id pet_id INT NOT NULL
        SQL);
    }
}
