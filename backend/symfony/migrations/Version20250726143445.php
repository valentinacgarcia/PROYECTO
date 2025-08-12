<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250726143445 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE pet_like (id INT AUTO_INCREMENT NOT NULL, status VARCHAR(20) NOT NULL, created_at DATETIME NOT NULL, interested_user_id INT NOT NULL, pet_id INT NOT NULL, INDEX IDX_B72BA5D9B54B2A53 (interested_user_id), INDEX IDX_B72BA5D9966F7FB6 (pet_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci`
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pet_like ADD CONSTRAINT FK_B72BA5D9B54B2A53 FOREIGN KEY (interested_user_id) REFERENCES users (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pet_like ADD CONSTRAINT FK_B72BA5D9966F7FB6 FOREIGN KEY (pet_id) REFERENCES pets (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pets CHANGE is_purebred is_purebred TINYINT(1) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_1483A5E9444F97DD ON users
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE pet_like DROP FOREIGN KEY FK_B72BA5D9B54B2A53
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pet_like DROP FOREIGN KEY FK_B72BA5D9966F7FB6
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE pet_like
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_1483A5E9444F97DD ON users (phone)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pets CHANGE is_purebred is_purebred TINYINT(1) DEFAULT 0 NOT NULL
        SQL);
    }
}
