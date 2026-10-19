#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
target="${1:?Yedek dosyasının yolunu belirtin}"
(umask 077; docker compose exec -T postgres pg_dump -U ceramica -d ceramica -Fc > "$target")
