FROM php:8.2-fpm

RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Instala Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Creamos un comando simulado para evitar el error
RUN echo '#!/bin/sh\n' > /usr/local/bin/symfony-cmd && chmod +x /usr/local/bin/symfony-cmd

# Habilitamos plugins aunque Composer se ejecute como root
ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /var/www/symfony

# Copia el proyecto Symfony completo
COPY symfony/ .

# Instala dependencias de Composer
RUN composer install --optimize-autoloader

# Permisos
RUN chown -R www-data:www-data /var/www/symfony
RUN chmod -R 755 /var/www/symfony

# Cache/logs
RUN mkdir -p var/cache var/log
RUN chown -R www-data:www-data var/

# Expone el puerto
EXPOSE 8000

# Arranca el servidor
CMD ["php", "-S", "0.0.0.0:8000", "-t", "public"]