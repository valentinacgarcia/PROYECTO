<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250520175821 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE adoptions (id INT AUTO_INCREMENT NOT NULL, adoption_date DATETIME NOT NULL, user_id INT DEFAULT NULL, pet_id INT DEFAULT NULL, INDEX IDX_B4E90AF1A76ED395 (user_id), INDEX IDX_B4E90AF1966F7FB6 (pet_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE pets (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(100) DEFAULT NULL, age INT DEFAULT NULL, gender VARCHAR(10) NOT NULL, description LONGTEXT DEFAULT NULL, species VARCHAR(50) NOT NULL, breed VARCHAR(100) NOT NULL, size VARCHAR(10) NOT NULL, color VARCHAR(50) NOT NULL, is_adopted TINYINT(1) NOT NULL, created_at DATETIME NOT NULL, owner_id INT DEFAULT NULL, INDEX IDX_8638EA3F7E3C61F9 (owner_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE roles (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(50) NOT NULL, UNIQUE INDEX UNIQ_B63E2EC75E237E06 (name), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE users (id INT AUTO_INCREMENT NOT NULL, name VARCHAR(100) NOT NULL, email VARCHAR(100) NOT NULL, phone VARCHAR(20) DEFAULT NULL, password_hash VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL, UNIQUE INDEX UNIQ_1483A5E9E7927C74 (email), UNIQUE INDEX UNIQ_1483A5E9444F97DD (phone), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            CREATE TABLE user_roles (user_id INT NOT NULL, role_id INT NOT NULL, INDEX IDX_54FCD59FA76ED395 (user_id), INDEX IDX_54FCD59FD60322AC (role_id), PRIMARY KEY(user_id, role_id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE adoptions ADD CONSTRAINT FK_B4E90AF1A76ED395 FOREIGN KEY (user_id) REFERENCES users (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE adoptions ADD CONSTRAINT FK_B4E90AF1966F7FB6 FOREIGN KEY (pet_id) REFERENCES pets (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pets ADD CONSTRAINT FK_8638EA3F7E3C61F9 FOREIGN KEY (owner_id) REFERENCES users (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_roles ADD CONSTRAINT FK_54FCD59FA76ED395 FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_roles ADD CONSTRAINT FK_54FCD59FD60322AC FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE adoptions DROP FOREIGN KEY FK_B4E90AF1A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE adoptions DROP FOREIGN KEY FK_B4E90AF1966F7FB6
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pets DROP FOREIGN KEY FK_8638EA3F7E3C61F9
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_roles DROP FOREIGN KEY FK_54FCD59FA76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE user_roles DROP FOREIGN KEY FK_54FCD59FD60322AC
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE adoptions
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE pets
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE roles
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE users
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE user_roles
        SQL);
    }
}
