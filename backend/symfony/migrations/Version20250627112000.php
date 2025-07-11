<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20250627112000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Insertar datos de prueba en tabla users';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("
            INSERT INTO users (name, email, phone, password_hash, created_at, last_name, address) VALUES
            ('Candela', 'candela.britos@email.com', '3511234567', 'hashed_pwd_1', '2024-06-01 10:00:00', 'Britos', 'Av. Siempreviva 123'),
            ('Juan', 'juan.perez@email.com', '3517654321', 'hashed_pwd_2', '2024-06-02 11:15:00', 'Pérez', 'Calle Falsa 456'),
            ('Lucía', 'lucia.gomez@email.com', '3519876543', 'hashed_pwd_3', '2024-06-03 09:45:00', 'Gómez', 'Ruta 9 Km 123'),
            ('Pedro', 'pedro.lopez@email.com', '3512468101', 'hashed_pwd_4', '2024-06-04 14:20:00', 'López', 'B° Centro, Mza 10'),
            ('María', 'maria.fernandez@email.com', '3511357913', 'hashed_pwd_5', '2024-06-05 08:30:00', 'Fernández', 'Los Aromos 321')
        ");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("
            DELETE FROM users WHERE email IN (
                'candela.britos@email.com',
                'juan.perez@email.com',
                'lucia.gomez@email.com',
                'pedro.lopez@email.com',
                'maria.fernandez@email.com'
            )
        ");
    }
}
