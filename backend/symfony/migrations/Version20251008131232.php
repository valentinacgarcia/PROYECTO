<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251008131232 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE services ADD marker_id INT DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE services ADD CONSTRAINT FK_7332E169474460EB FOREIGN KEY (marker_id) REFERENCES marcadores (id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE UNIQUE INDEX UNIQ_7332E169474460EB ON services (marker_id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE services DROP FOREIGN KEY FK_7332E169474460EB
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX UNIQ_7332E169474460EB ON services
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE services DROP marker_id
        SQL);
    }
}
