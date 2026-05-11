#!/usr/bin/env sh
set -eu

: "${IMAGE:?IMAGE is required, for example ghcr.io/owner/repo:sha}"

APP_PORT="${APP_PORT:-3000}"
APP_VERSION="${APP_VERSION:-production}"
COMMIT_SHA="${COMMIT_SHA:-unknown}"

if [ -n "${GHCR_USERNAME:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin
fi

cat > .env <<EOF
APP_PORT=$APP_PORT
APP_VERSION=$APP_VERSION
COMMIT_SHA=$COMMIT_SHA
EOF

docker compose -f docker-compose.prod.yml pull app
docker compose -f docker-compose.prod.yml up -d --remove-orphans

echo "Waiting for health check..."
for attempt in $(seq 1 20); do
  if docker inspect --format='{{.State.Health.Status}}' docker-cicd-vps-demo 2>/dev/null | grep -q healthy; then
    docker image prune -f
    echo "Deploy completed with image $IMAGE"
    exit 0
  fi
  sleep 3
done

docker compose -f docker-compose.prod.yml logs --tail=120 app
echo "Deploy failed: container did not become healthy"
exit 1
