#!/bin/bash
set -e

echo "======================================"
echo "  DocStorage — Quick Start"
echo "======================================"

# Generate JWT keys if missing
JWT_DIR="backend/config/jwt"
mkdir -p "$JWT_DIR"
if [ ! -f "$JWT_DIR/private.pem" ]; then
  echo "[1/4] Generating JWT keys..."
  openssl genrsa -out "$JWT_DIR/private.pem" 4096 2>/dev/null
  openssl rsa -pubout -in "$JWT_DIR/private.pem" -out "$JWT_DIR/public.pem" 2>/dev/null
  chmod 600 "$JWT_DIR/private.pem"
  echo "      Done."
else
  echo "[1/4] JWT keys already exist."
fi

echo "[2/4] Building and starting containers..."
docker compose up -d --build

echo "[3/4] Waiting for services to start (15s)..."
sleep 15

echo "[4/4] Running database migrations..."
docker exec docstorage_backend php bin/console doctrine:schema:create --no-interaction 2>/dev/null || \
docker exec docstorage_backend php bin/console doctrine:schema:update --force --no-interaction 2>/dev/null || true

echo ""
echo "======================================"
echo "  Frontend    →  http://localhost:5173"
echo "  Backend API →  http://localhost:8000/api"
echo "  MeiliSearch →  http://localhost:7700"
echo "  Scraper     →  http://localhost:8001/docs"
echo "======================================"
echo ""
echo "  First admin account:"
echo "  1. Register at http://localhost:5173/register"
echo "  2. Run: docker exec docstorage_backend php bin/console doctrine:query:sql \"
echo "          \"UPDATE users SET roles='\"[\\"ROLE_ADMIN\\"]\"' WHERE username='YOUR_LOGIN'\""
