<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250909201849 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE pet_like ADD owner_user_id INT NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pet_like ADD CONSTRAINT FK_B72BA5D92B18554A FOREIGN KEY (owner_user_id) REFERENCES users (id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_B72BA5D92B18554A ON pet_like (owner_user_id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE pet_like DROP FOREIGN KEY FK_B72BA5D92B18554A
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_B72BA5D92B18554A ON pet_like
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE pet_like DROP owner_user_id
        SQL);
    }
}
