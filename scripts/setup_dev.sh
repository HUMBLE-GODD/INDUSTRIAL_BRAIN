#!/usr/bin/env bash

set -e

# Navigate to project root (script lives in scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "🧠 Setting up Industrial Brain development environment..."
echo ""

# ── Check dependencies ──
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop."
    exit 1
fi

if ! docker compose version &> /dev/null 2>&1; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker and Docker Compose detected."

# ── Setup .env ──
if [ ! -f .env ]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "   ⚠️  Edit .env to add your GEMINI_API_KEY and GROQ_API_KEY"
else
    echo "✅ .env file already exists."
fi

# ── Build and start ──
echo ""
echo "🐳 Building and starting containers..."
docker compose up --build -d

# ── Wait for health ──
echo ""
echo "⏳ Waiting for services to become healthy..."
TIMEOUT=90
START_TIME=$(date +%s)

while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))

    if [ $ELAPSED -gt $TIMEOUT ]; then
        echo ""
        echo "⚠️  Timeout after ${TIMEOUT}s. Some services may still be starting."
        docker compose ps
        exit 1
    fi

    ALL_HEALTHY=true
    for SERVICE in postgres neo4j qdrant; do
        CONTAINER_ID=$(docker compose ps -q "$SERVICE" 2>/dev/null)
        if [ -z "$CONTAINER_ID" ]; then
            ALL_HEALTHY=false
            break
        fi
        STATUS=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' "$CONTAINER_ID" 2>/dev/null)
        if [ "$STATUS" != "healthy" ]; then
            ALL_HEALTHY=false
            break
        fi
    done

    if [ "$ALL_HEALTHY" = true ]; then
        break
    fi

    echo -n "."
    sleep 3
done

echo ""
echo ""
echo "✅ All services are healthy!"
echo ""
echo "📊 Service Status:"
docker compose ps
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║          🔗 Access URLs                      ║"
echo "╠══════════════════════════════════════════════╣"
echo "║  Backend API:     http://localhost:8000       ║"
echo "║  API Health:      http://localhost:8000/health║"
echo "║  API Docs:        http://localhost:8000/docs  ║"
echo "║  Neo4j Browser:   http://localhost:7474       ║"
echo "║  Qdrant Dashboard:http://localhost:6333/dashboard║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "🎉 Setup complete! Run 'make logs' to view logs."
