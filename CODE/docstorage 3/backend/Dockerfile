FROM php:8.3-apache

# Системные зависимости + расширения PHP
RUN apt-get update && apt-get install -y \
    git unzip libpq-dev libzip-dev \
    && docker-php-ext-install pdo pdo_pgsql zip \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Сначала только composer.json + lock для кеширования слоёв
COPY composer.json composer.lock ./

# Установка зависимостей (lock уже есть — ставит строго)
RUN composer install --no-scripts --no-interaction --optimize-autoloader

# Копируем весь исходный код
COPY . .

# Генерируем autoload ещё раз с учётом src/
RUN composer dump-autoload --optimize --no-interaction

# Создаём нужные папки
RUN mkdir -p config/jwt var/cache var/log var/uploads \
    && chmod -R 777 var/cache var/log var/uploads

# Apache: DocumentRoot → public/ + AllowOverride All
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public

RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
    /etc/apache2/sites-available/000-default.conf \
    && printf '<Directory /var/www/html/public>\n    AllowOverride All\n    Require all granted\n</Directory>\n' \
    >> /etc/apache2/apache2.conf \
    && echo "ServerName localhost" >> /etc/apache2/apache2.conf

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
EXPOSE 80