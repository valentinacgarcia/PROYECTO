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


COPY --from=composer:latest /usr/bin/composer /usr/bin/composer


WORKDIR /var/www/symfony


COPY symfony/composer*.json ./
RUN composer install --no-dev --optimize-autoloader --no-scripts


COPY symfony/ .


RUN composer install


RUN chown -R www-data:www-data /var/www/symfony
RUN chmod -R 755 /var/www/symfony


RUN mkdir -p var/cache var/log
RUN chown -R www-data:www-data var/


EXPOSE 8000


CMD ["tail", "-f", "/dev/null"]
