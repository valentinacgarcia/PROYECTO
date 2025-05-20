FROM php:8.2-fpm

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    unzip \
    php-xml \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Establecer directorio de trabajo
WORKDIR /var/www/symfony

# Copiar archivos de composer primero (para cache)
COPY symfony/composer*.json ./
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Copiar el resto del código
COPY symfony/ .

# Instalar dependencias de Composer
RUN composer install

# Permisos
RUN chown -R www-data:www-data /var/www/symfony
RUN chmod -R 755 /var/www/symfony

# Crear directorios necesarios
RUN mkdir -p var/cache var/log
RUN chown -R www-data:www-data var/

# Exponer puerto
EXPOSE 8000

# Comando para iniciar el servidor de desarrollo de Symfony
CMD ["sh", "-c", "sleep 10 && php bin/console doctrine:migrations:migrate --no-interaction && php -S 0.0.0.0:8000 -t public"]
