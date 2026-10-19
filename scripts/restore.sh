#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source_file="${1:?Geri yüklenecek yedek dosyasını belirtin}"
# Restore into a NEW database; existing application data is never dropped.
docker compose exec -T postgres createdb -U ceramica ceramica_restored
docker compose exec -T postgres pg_restore --exit-on-error -U ceramica -d ceramica_restored < "$source_file"
