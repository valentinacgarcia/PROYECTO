<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250816175945 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE adoption_requests (id BIGINT AUTO_INCREMENT NOT NULL, is_house TINYINT(1) NOT NULL, is_owner TINYINT(1) NOT NULL, has_yard TINYINT(1) NOT NULL, has_security TINYINT(1) NOT NULL, household_members INT NOT NULL, has_children TINYINT(1) NOT NULL, has_allergies TINYINT(1) NOT NULL, adoption_agreement TINYINT(1) NOT NULL, had_pets_before TINYINT(1) NOT NULL, has_current_pets TINYINT(1) NOT NULL, pets_vaccinated TINYINT(1) DEFAULT NULL, hours_alone_per_day INT NOT NULL, sleeping_location VARCHAR(255) NOT NULL, caretaker VARCHAR(255) NOT NULL, will_neuter_vaccinate TINYINT(1) NOT NULL, submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL, status VARCHAR(255) NOT NULL, notes LONGTEXT DEFAULT NULL, user_id INT NOT NULL, INDEX IDX_5CFD08E2A76ED395 (user_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE adoption_requests ADD CONSTRAINT FK_5CFD08E2A76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE adoption_requests DROP FOREIGN KEY FK_5CFD08E2A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE adoption_requests
        SQL);
    }
}
