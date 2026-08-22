#!/usr/bin/env bash
# Run on the VPS after CI has the image available locally
# (either GHCR pull here, or docker load from the Actions runner).
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/kalkisenadrive-dashboard}"
WEB_IMAGE="${WEB_IMAGE:?WEB_IMAGE required}"
SKIP_GHCR_PULL="${SKIP_GHCR_PULL:-0}"

cd "$DEPLOY_PATH"

if [[ "$SKIP_GHCR_PULL" != "1" ]]; then
  GHCR_USER="${GHCR_USER:?GHCR_USER required}"
  GHCR_TOKEN="${GHCR_TOKEN:?GHCR_TOKEN required}"
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
  export WEB_IMAGE
  docker compose pull web
fi

if grep -q '^WEB_IMAGE=' .env 2>/dev/null; then
  sed -i "s|^WEB_IMAGE=.*|WEB_IMAGE=${WEB_IMAGE}|" .env
elif [[ -f .env ]]; then
  printf '\nWEB_IMAGE=%s\n' "$WEB_IMAGE" >> .env
else
  printf 'WEB_IMAGE=%s\n' "$WEB_IMAGE" > .env
fi

export WEB_IMAGE
docker compose up -d --pull never --force-recreate web

docker image prune -f
echo "Deployed ${WEB_IMAGE}"
docker compose ps
curl -sS -o /dev/null -w "local dashboard %{http_code}\n" http://127.0.0.1:3015/ || true
