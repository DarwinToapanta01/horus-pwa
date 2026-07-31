FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    git curl libpq-dev unzip zip \
    && docker-php-ext-install pdo pdo_pgsql \
    && pecl install opentelemetry \
    && docker-php-ext-enable opentelemetry \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

# Instrumentacion OpenTelemetry "zero-code": los paquetes opentelemetry-auto-*
# se autoregistran via Composer (sin tocar controladores, rutas ni modelos).
RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && composer require --no-interaction --no-progress \
         open-telemetry/sdk \
         open-telemetry/exporter-otlp \
         open-telemetry/opentelemetry-auto-laravel \
         open-telemetry/opentelemetry-auto-guzzle \
         open-telemetry/opentelemetry-auto-pdo \
         php-http/guzzle7-adapter \
    && composer dump-autoload --optimize

EXPOSE 8000

CMD ["sh", "-c", "php artisan key:generate --force && until php artisan migrate --force 2>/dev/null; do echo 'Esperando BD...'; sleep 3; done && php artisan serve --no-reload --host=0.0.0.0 --port=8000"]
