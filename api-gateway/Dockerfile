FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    git curl unzip zip \
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
         php-http/guzzle7-adapter \
    && composer dump-autoload --optimize

EXPOSE 8000

# El gateway no tiene BD, solo genera la key y arranca
CMD ["sh", "-c", "php artisan key:generate --force && php artisan serve --no-reload --host=0.0.0.0 --port=8000"]
