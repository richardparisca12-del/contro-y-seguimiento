#!/bin/bash
set -e

echo "=============================================================="
echo "  MINJUVENTUD - CONSTRUCCIÓN Y DESPLIEGUE EN DOCKER (LINUX)   "
echo "=============================================================="
echo ""

if [ ! -f .env ]; then
    echo "Creando archivo .env a partir de .env.docker..."
    cp .env.docker .env
fi

echo "Construyendo e iniciando contenedores..."
if docker compose version > /dev/null 2>&1; then
    docker compose up -d --build
else
    docker-compose up -d --build
fi

echo ""
echo "=============================================================="
echo "  ¡Contenedores iniciados exitosamente!"
echo "  Frontend: http://localhost:3085"
echo "  Backend API: http://localhost:8005/docs"
echo "=============================================================="
