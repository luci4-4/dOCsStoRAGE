#!/bin/sh
set -e

php bin/console doctrine:schema:update --force --no-interaction 2>/dev/null || true

exec apache2-foreground
